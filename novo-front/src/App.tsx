import { useEffect, useState } from 'react';
import AppShell from './app/AppShell';
import { type AppView, canAccessView, userProfile } from './app/navigation';
import { useAuth } from './auth/AuthContext';
import ManagementSection, { type DemandTransition } from './features/op/ManagementSection';
import CycleDashboard from './features/op/CycleDashboard';
import DemandsSection from './features/op/DemandsSection';
import MaintainerSection from './features/op/MaintainerSection';
import MemorySection from './features/op/MemorySection';
import VotingSection from './features/op/VotingSection';
import UserSection from './features/op/UserSection';
import { dateOnly, mapDemand, mapRankingItem } from './features/op/adapters';
import { opApi } from './features/op/api';
import { useOPData } from './features/op/useOPData';
import React, { Component, ErrorInfo, ReactNode } from 'react';

import { calcularOrcamentoTerritorios } from './demo/initialData';
import type { CycleConfig, Demanda } from './shared/domain/types';

type DemandScope = 'territorial' | 'municipal';

function pathToView(path: string): AppView {
  switch (path) {
    case '/demandas': return 'demandas';
    case '/votacao': return 'votacao';
    case '/resultados': return 'resultados';
    case '/usuario': return 'usuario';
    default: return 'inicio';
  }
}

function viewToPath(view: AppView): string {
  switch (view) {
    case 'demandas': return '/demandas';
    case 'votacao': return '/votacao';
    case 'resultados': return '/resultados';
    case 'usuario': return '/usuario';
    default: return '/';
  }
}

export default function App() {
  const { adminContext, isAuthenticated, user } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const activeView = pathToView(currentPath);
  const { cycle, setCycle, territorios, setTerritorios, demandas, setDemandas, ranking, setRanking, cycleSnapshot } = useOPData();
  const profile = userProfile(user?.role, adminContext);
  const userTerritoryId = territorios.find(territorio => (
    territorio.id === user?.territoryId || territorio.nome === user?.territoryName
  ))?.id;

  const navigateTo = (view: AppView) => {
    const path = viewToPath(view);
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!canAccessView(activeView, profile)) {
      navigateTo('inicio');
    }
  }, [activeView, profile]);

  const handleUpdateCycle = (updates: Partial<CycleConfig>) => {
    setCycle(current => {
      const next = { ...current, ...updates };
      setTerritorios(items => calcularOrcamentoTerritorios(items, next.pisoIgualBase, next.parcelaCarenciaTotal));
      setDemandas(items => items.map(demanda => {
        const territory = territorios.find(item => item.id === demanda.territorioId);
        const population = demanda.escopoVotacao === 'municipal'
          ? territorios.reduce((sum, item) => sum + item.populacao, 0)
          : territory?.populacao || 1000;
        const threshold = Math.max(1, Math.round(population * next.limiarApoioPercentual));
        return { ...demanda, apoiosNecessarios: threshold, passouPopular: demanda.apoiosCount >= threshold };
      }));
      return next;
    });
  };

  const requireLogin = (message: string) => {
    if (isAuthenticated) return true;
    window.alert(message);
    return false;
  };

  const handleAddDemand = async (
    title: string,
    description: string,
    territoryId: string,
    scope: DemandScope,
  ) => {
    if (!requireLogin('Entre com sua conta para publicar uma demanda.')) return;
    const territory = territorios.find(item => item.id === territoryId);
    try {
      const response = await opApi.createDemand({
        territoryId,
        title,
        description,
        category: scope === 'municipal' ? 'Escopo municipal' : 'Escopo territorial',
        location: scope === 'municipal' ? 'Município de Brumadinho' : territory?.nome || territoryId,
      });
      setDemandas(current => [mapDemand(response, territorios), ...current]);
    } catch (error) {
      window.alert(`Não foi possível publicar a demanda: ${(error as Error).message}`);
    }
  };

  const handleSupportDemand = async (demandId: string) => {
    if (!requireLogin('Entre com sua conta para apoiar uma demanda.')) return;
    try {
      const response = await opApi.supportDemand(demandId);
      const mapped = mapDemand(response, territorios);
      setDemandas(current => current.map(demanda => demanda.id === demandId ? { ...demanda, ...mapped } : demanda));
    } catch (error) {
      window.alert(`Não foi possível registrar o apoio: ${(error as Error).message}`);
    }
  };

  const handleComment = async (demandId: string, text: string) => {
    if (!requireLogin('Entre com sua conta para comentar.')) return;
    try {
      const comment = await opApi.commentDemand(demandId, text);
      setDemandas(current => current.map(demanda => demanda.id === demandId ? {
        ...demanda,
        comentarios: [...demanda.comentarios, {
          id: comment.id,
          autor: comment.authorName || user?.fullName || 'Cidadão',
          texto: comment.content,
          data: dateOnly(comment.createdAt),
        }],
      } : demanda));
    } catch (error) {
      window.alert(`Não foi possível publicar o comentário: ${(error as Error).message}`);
    }
  };

  const handleRelatedProposal = async (parentId: string, title: string, description: string) => {
    if (!requireLogin('Entre com sua conta para sugerir uma proposta relacionada.')) return;
    const parent = demandas.find(demanda => demanda.id === parentId);
    if (!parent) return;
    try {
      const response = await opApi.forkDemand(parentId, {
        title,
        description,
        category: parent.escopoVotacao === 'municipal' ? 'Escopo municipal' : 'Escopo territorial',
        reason: `Proposta relacionada à demanda ${parent.titulo}`,
      });
      setDemandas(current => [{
        ...mapDemand(response, territorios),
        forkId: parent.id,
        parentTitulo: parent.titulo,
      }, ...current]);
    } catch (error) {
      window.alert(`Não foi possível publicar a proposta relacionada: ${(error as Error).message}`);
    }
  };

  const handleTransition = async (demandId: string, transition: DemandTransition, reason: string) => {
    try {
      const response = transition === 'mature'
        ? await opApi.startMaturation(demandId, reason)
        : transition === 'request-info'
          ? await opApi.requestInfo(demandId, reason)
          : transition === 'validate'
            ? await opApi.validateTerritory(demandId, reason)
            : await opApi.markReady(demandId, reason);
      const mapped = mapDemand(response, territorios);
      setDemandas(current => current.map(demanda => demanda.id === demandId ? { ...demanda, ...mapped } : demanda));
    } catch (error) {
      window.alert(`Não foi possível atualizar a demanda: ${(error as Error).message}`);
    }
  };

  const handleGroup = async (demandId: string, targetDemandId: string, reason: string) => {
    try {
      const response = await opApi.groupDemand(demandId, targetDemandId, reason);
      const mapped = mapDemand(response, territorios);
      setDemandas(current => current.map(demanda => demanda.id === demandId ? { ...demanda, ...mapped } : demanda));
    } catch (error) {
      window.alert(`Não foi possível agrupar as demandas: ${(error as Error).message}`);
    }
  };

  const handleViability = async (
    demandId: string,
    admissibility: 'admissivel' | 'inadmissivel',
    reason: string,
    estimatedCostCents?: number,
  ) => {
    const demand = demandas.find(item => item.id === demandId);
    if (!demand) return;

    try {
      if (admissibility === 'inadmissivel') {
        const response = await opApi.rejectDemand(demandId, 'Inviabilidade técnica ou orçamentária', reason);
        const mapped = mapDemand(response, territorios);
        setDemandas(current => current.map(item => item.id === demandId ? {
          ...item,
          ...mapped,
          justificativaInadmissibilidade: reason,
        } : item));
        return;
      }

      if (!estimatedCostCents || estimatedCostCents <= 0) {
        throw new Error('informe um custo estimado maior que zero');
      }

      if (demand.status !== 'Apta para priorização') {
        await opApi.approveDemand(demandId, reason);
      }

      const proposals = await opApi.proposals();
      const proposal = proposals.find(item => item.demandId === demandId) || await opApi.createProposal(demandId, {
        title: demand.titulo,
        problemSummary: demand.descricao,
        solutionScope: demand.escopoVotacao === 'municipal' ? 'municipal' : 'territorial',
        estimatedCostCents,
        category: demand.escopoVotacao === 'municipal' ? 'Escopo municipal' : 'Escopo territorial',
      });

      if (cycle.faseAtual === 'votacao') {
        const votings = await opApi.opVotings();
        if (!votings.some(item => item.proposalId === proposal.id)) {
          await opApi.openProposalVoting(proposal.id);
        }
      }

      const refreshed = await opApi.getDemand(demandId);
      const mapped = mapDemand(refreshed, territorios);
      setDemandas(current => current.map(item => item.id === demandId ? { ...item, ...mapped } : item));
    } catch (error) {
      window.alert(`Não foi possível concluir a análise: ${(error as Error).message}`);
    }
  };

  const handleExecution = async (demandId: string, status: Demanda['statusExecucao'], reason?: string) => {
    if (!status) return;
    const item = ranking.find(rankingItem => rankingItem.demandId === demandId);
    if (!item) {
      window.alert('A execução só pode ser atualizada depois que a votação gerar um item no ranking.');
      return;
    }

    const rankingStatus = {
      planejamento: 'Incluído na matriz',
      licitacao: 'Incluído na matriz',
      obra: 'Em execução',
      concluido: 'Concluído',
      frustrado: 'Frustrado',
    }[status];
    let publicReason = reason;
    if (status === 'frustrado' && !publicReason) {
      publicReason = window.prompt('Informe a justificativa pública para a não execução:') || undefined;
      if (!publicReason) return;
    }

    await handleRankingStatus(item.id, rankingStatus, publicReason);
    setDemandas(current => current.map(demanda => demanda.id === demandId ? {
      ...demanda,
      statusExecucao: status,
      justificativaFrustrado: status === 'frustrado' ? publicReason : undefined,
    } : demanda));
  };

  const handleVote = (demandId: string) => {
    const seed = `${demandId}-${user?.id || 'public'}-${Date.now()}`;
    setDemandas(current => current.map(demanda => demanda.id === demandId
      ? { ...demanda, votosCount: (demanda.votosCount || 0) + 1 }
      : demanda));
    return Array.from({ length: 64 }, (_, index) => ((seed.charCodeAt(index % seed.length) + index * 7) % 16).toString(16)).join('');
  };

  const handleRankingStatus = async (itemId: string, status: string, reason?: string) => {
    try {
      const response = await opApi.updateRankingStatus(itemId, status, reason);
      const mapped = mapRankingItem(response);
      setRanking(current => current.map(item => item.id === itemId ? mapped : item));
    } catch (error) {
      window.alert(`Erro ao atualizar status: ${(error as Error).message}`);
      throw error;
    }
  };

  const currentView = canAccessView(activeView, profile) ? activeView : 'inicio';
  const page = currentView === 'inicio' ? (
    <CycleDashboard cycle={cycle} territorios={territorios} demandas={demandas} user={user} onNavigate={navigateTo} />
  ) : currentView === 'demandas' ? (
    <DemandsSection
      territorios={territorios}
      demandas={demandas}
      cycle={cycle}
      userTerritoryId={userTerritoryId}
      onAddDemanda={handleAddDemand}
      onApoiar={handleSupportDemand}
      onAddComentario={handleComment}
      onForkDemanda={handleRelatedProposal}
    />
  ) : currentView === 'votacao' ? (
    <VotingSection territorios={territorios} cycle={cycle} userTerritoryId={userTerritoryId} />
  ) : currentView === 'resultados' ? (
    <MemorySection cycle={cycle} ranking={ranking} territorios={territorios} canEditStatus={profile === 'admin' || profile === 'management'} onUpdateStatus={handleRankingStatus} frozen={cycleSnapshot?.frozen} frozenAt={cycleSnapshot?.generatedAt} />
  ) : currentView === 'usuario' ? (
    profile === 'admin' ? (
      <MaintainerSection
        cycle={cycle}
        territorios={territorios}
        onUpdateRegimento={handleUpdateCycle}
      />
    ) : profile === 'management' ? (
      <ManagementSection
        demandas={demandas}
        territorios={territorios}
        onTransition={handleTransition}
        onGroup={handleGroup}
        onSetViability={handleViability}
        onSetExecution={handleExecution}
      />
    ) : (
      <UserSection />
    )
  ) : null;

  return (
    <AppShell activeView={currentView} setActiveView={navigateTo} cycle={cycle}>
      {page}
    </AppShell>
  );
}
