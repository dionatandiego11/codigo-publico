/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { ShieldAlert } from 'lucide-react';
import { AuthModal, useAuth } from './auth';
import { useBrowserRouter } from './app/useBrowserRouter';
import { useAdminContext, useOPCycle, useOPDemands, useOPProposals, useOPVotings, usePublicData } from './hooks';
import type { NewBudgetDemandData, NewBudgetProposalData, VoteSelection, WriteSource } from './hooks';
import {
  BudgetFiltersPage,
  CitizenArea,
  CycleAdminPanel,
  DivergenceIncidentsPage,
  ExecutionCenter,
  FlowHome,
  OPDemandComposer,
  OPDemandDetailPage,
  OPDemandList,
  OPProposalList,
  OPVotingCenter
} from './pages';
import { Navbar, BottomNav } from './shared/layout';
import { useToast } from './shared/feedback/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import type { BudgetDemand, BudgetProposal } from './types';
import type { OPActionContext } from './lib/op-permissions';

export default function App() {
  const { currentPath, setPath } = useBrowserRouter();
  const { citizen, isAuthenticated, requireAuth, openAuthModal } = useAuth();
  const { pushToast } = useToast();

  const { trackers, territories, userProfile, addVoteReceipt } = usePublicData({ isAuthenticated, citizen });
  const { currentCycle } = useOPCycle();
  const { adminContext } = useAdminContext(isAuthenticated);

  const { demands, addDemand, supportDemand, commentOnDemand, transitionDemand, groupDemand, forkDemand } = useOPDemands();
  const {
    proposals,
    createFromDemand,
    refresh: refreshProposals,
    applyVotingResolution,
    decideInstitutional
  } = useOPProposals();
  const { opVotings, openForProposal, castVote: castOPVote, resolveVoting: resolveOPVoting } = useOPVotings();

  const selectedDemandRouteId = currentPath.startsWith('/demandas/')
    ? decodeURIComponent(currentPath.slice('/demandas/'.length))
    : null;

  const previousCitizenIdRef = useRef<string | null>(null);
  useEffect(() => {
    const previousId = previousCitizenIdRef.current;
    if (citizen && citizen.id !== previousId) {
      pushToast('success', `Sessão iniciada como ${citizen.fullName}.`);
    } else if (!citizen && previousId) {
      pushToast('info', 'Sessão encerrada.');
    }
    previousCitizenIdRef.current = citizen?.id ?? null;
  }, [citizen, pushToast]);

  const notifyWriteSource = (source: WriteSource, apiMessage: string) => {
    if (source === 'api') {
      pushToast('success', apiMessage);
    } else {
      pushToast('warning', 'API indisponível: ação aplicada apenas localmente.');
    }
  };

  // Erros de regra de negócio (4xx): a API recusou a ação de forma deliberada e
  // nenhuma mudança local foi aplicada.
  const notifyActionRejected = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Falha inesperada.';
    pushToast('error', rejectionGuidance(message));
  };

  const rejectionGuidance = (message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes('envelope')) {
      return `Circuit breaker: ${message}. Caminho: fasear a proposta ou levar para ciclo plurianual.`;
    }
    if (normalized.includes('competência municipal')) {
      return `Circuit breaker: ${message}. Caminho: registrar como reivindicação externa.`;
    }
    if (normalized.includes('fonte de custeio') || normalized.includes('outro ente')) {
      return `Circuit breaker: ${message}. Caminho: pactuar fonte ou ente responsável antes de prosseguir.`;
    }
    if (normalized.includes('constitucional') || normalized.includes('legal')) {
      return `Circuit breaker: ${message}. Caminho: reformular a proposta.`;
    }
    return `Ação recusada pela plataforma: ${message}`;
  };

  const handleAddNewDemand = (formData: NewBudgetDemandData) => {
    requireAuth(() => {
      void addDemand(formData)
        .then(({ demand, source }) => {
          notifyWriteSource(source, `Demanda ${demand.id} registrada.`);
          setPath(`/demandas/${encodeURIComponent(demand.id)}`);
        })
        .catch(notifyActionRejected);
    });
  };

  const handleSupportDemand = (demandId: string) => {
    requireAuth(() => {
      void supportDemand(demandId)
        .then(source => notifyWriteSource(source, 'Apoio registrado na demanda.'))
        .catch(notifyActionRejected);
    });
  };

  const handleCommentDemand = (demandId: string, content: string) => {
    requireAuth(authenticated => {
      void commentOnDemand(demandId, content, authenticated.fullName)
        .then(source => notifyWriteSource(source, 'Comentário publicado na demanda.'))
        .catch(notifyActionRejected);
    });
  };

  const handleTransitionDemand = (
    demandId: string,
    transition: 'mature' | 'request-info' | 'validate-territory' | 'mark-ready',
    reason?: string
  ) => {
    requireAuth(() => {
      void transitionDemand(demandId, transition, reason)
        .then(source => notifyWriteSource(source, 'Demanda movida na esteira.'))
        .catch(notifyActionRejected);
    });
  };

  const handleGroupDemand = (sourceId: string, targetDemandId: string, reason: string) => {
    requireAuth(() => {
      void groupDemand(sourceId, targetDemandId, reason)
        .then(source => notifyWriteSource(source, 'Demanda agrupada.'))
        .catch(notifyActionRejected);
    });
  };

  const handleForkDemand = (
    sourceId: string,
    data: { title: string; description?: string; location?: string; category?: string; reason?: string }
  ) => {
    requireAuth(() => {
      void forkDemand(sourceId, data)
        .then(({ demand, source }) => {
          notifyWriteSource(source, `Fork ${demand.id} criado.`);
          setPath(`/demandas/${encodeURIComponent(demand.id)}`);
        })
        .catch(notifyActionRejected);
    });
  };

  const handleCreateProposal = (demand: BudgetDemand, data: NewBudgetProposalData) => {
    requireAuth(() => {
      void createFromDemand(demand, data)
        .then(({ proposal, source }) => {
          notifyWriteSource(source, `Proposta ${proposal.id} criada.`);
          setPath('/propostas');
        })
        .catch(notifyActionRejected);
    });
  };

  const handleOpenOPVoting = (proposal: BudgetProposal) => {
    requireAuth(() => {
      void openForProposal(proposal)
        .then(({ voting, source }) => {
          notifyWriteSource(source, `Votação ${voting.id} aberta.`);
          setPath('/votacoes');
        })
        .catch(notifyActionRejected);
    });
  };

  const handleCastOPVote = (votingId: string, selection: VoteSelection) => {
    requireAuth(() => {
      void castOPVote(votingId, selection)
        .then(receipt => {
          addVoteReceipt(receipt);
          notifyWriteSource(receipt.source, `Voto computado. Recibo: ${receipt.receipt}`);
        })
        .catch(notifyActionRejected);
    });
  };

  const handleResolveOPVoting = (votingId: string) => {
    requireAuth(() => {
      void resolveOPVoting(votingId)
        .then(({ voting, source }) => {
          if (source === 'api') {
            void refreshProposals().catch(error => {
              console.warn('Não foi possível atualizar propostas após encerramento da votação.', error);
            });
          } else {
            applyVotingResolution(voting);
          }
          notifyWriteSource(source, `Votação ${voting.id} encerrada.`);
        })
        .catch(notifyActionRejected);
    });
  };

  const citizenTerritoryId = isAuthenticated ? citizen?.territoryId ?? userProfile.territoryId : undefined;
  const citizenTerritoryName = isAuthenticated ? citizen?.territoryName ?? userProfile.territoryName : undefined;
  const citizenTerritory = citizenTerritoryId || citizenTerritoryName
    ? territories.find(territory =>
        territory.id === citizenTerritoryId ||
        territory.name === citizenTerritoryName ||
        territory.name === citizenTerritoryId
      ) ?? {
        id: citizenTerritoryId ?? citizenTerritoryName ?? '',
        name: citizenTerritoryName ?? citizenTerritoryId ?? ''
      }
    : undefined;
  const opActionContext: OPActionContext = {
    isAuthenticated,
    cyclePhase: currentCycle?.phase,
    citizenTerritoryId,
    citizenTerritoryName,
    adminContext
  };

  const page = (() => {
    if (selectedDemandRouteId) {
      return (
        <OPDemandDetailPage
          demand={demands.find(demand => demand.id === selectedDemandRouteId)}
          demands={demands}
          proposals={proposals}
          votings={opVotings}
          onBack={() => setPath('/demandas')}
          onSupport={handleSupportDemand}
          onComment={handleCommentDemand}
          onTransition={handleTransitionDemand}
          onGroup={handleGroupDemand}
          onFork={handleForkDemand}
          onCreateProposal={handleCreateProposal}
          onViewProposals={() => setPath('/propostas')}
          onViewVotings={() => setPath('/votacoes')}
          onViewFilters={() => setPath('/filtros')}
          actionContext={opActionContext}
        />
      );
    }

    if (currentPath === '/' || currentPath === '') {
      return <FlowHome setPath={setPath} />;
    }

    if (currentPath === '/demandas') {
      return (
        <div className="space-y-6 fade-in">
          <OPDemandList demands={demands} onSelect={demandId => setPath(`/demandas/${encodeURIComponent(demandId)}`)} />
          <OPDemandComposer
            isAuthenticated={isAuthenticated}
            currentTerritory={citizenTerritory}
            actionContext={opActionContext}
            onLogin={openAuthModal}
            onSubmit={handleAddNewDemand}
          />
        </div>
      );
    }

    if (currentPath === '/propostas') {
      return (
        <OPProposalList
          proposals={proposals}
          votings={opVotings}
          onOpenVoting={handleOpenOPVoting}
          onSelectVoting={() => setPath('/votacoes')}
          onViewIncidents={() => setPath('/incidentes')}
          actionContext={opActionContext}
        />
      );
    }

    if (currentPath === '/votacoes') {
      return (
        <OPVotingCenter
          votings={opVotings}
          onVote={handleCastOPVote}
          onResolve={handleResolveOPVoting}
          actionContext={opActionContext}
        />
      );
    }

    if (currentPath === '/fiscalizacao') {
      return <ExecutionCenter trackers={trackers} />;
    }

    if (currentPath === '/incidentes') {
      return <DivergenceIncidentsPage onGoProposals={() => setPath('/propostas')} />;
    }

    if (currentPath === '/filtros') {
      return <BudgetFiltersPage onGoDemands={() => setPath('/demandas')} />;
    }

    if (currentPath === '/minha-area') {
      return (
        <CitizenArea
          isAuthenticated={isAuthenticated}
          onLogin={openAuthModal}
          profile={userProfile}
          territories={territories}
          onSelectVoting={() => setPath('/votacoes')}
        />
      );
    }

    if (currentPath === '/admin') {
      if (!isAuthenticated) {
        return (
          <div className="flex h-full items-center justify-center fade-in">
            <div className="glass-panel p-8 text-center rounded-[20px] max-w-sm w-full">
              <ShieldAlert className="mx-auto h-12 w-12 text-[var(--color-git-muted)] mb-4" />
              <h1 className="font-display text-xl font-bold text-white">Acesso institucional</h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-git-muted)] mb-6">
                Área restrita à instância geral para gestão do ciclo do Orçamento Participativo.
              </p>
              <button onClick={openAuthModal} className="btn-primary w-full">Fazer login</button>
            </div>
          </div>
        );
      }

      return (
        <CycleAdminPanel
          adminContext={adminContext}
          proposals={proposals}
          onDecideInstitutional={decideInstitutional}
          onViewFilters={() => setPath('/filtros')}
          onViewIncidents={() => setPath('/incidentes')}
        />
      );
    }

    return <FlowHome setPath={setPath} />;
  })();

  return (
    <div className="flex min-h-screen justify-center bg-[#020408]">
      {/* outer ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[120%] h-[60%]"
          style={{
            background:
              'radial-gradient(ellipse at 50% -20%, rgba(56,189,248,0.07) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden border-x border-[var(--color-git-border)] bg-[var(--color-git-bg)] shadow-[0_0_120px_rgba(0,0,0,0.9)]">
        {/* ── Animated Background Blobs ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute top-[-15%] left-[-25%] w-[80%] h-[50%] opacity-30 blur-[90px]"
            style={{
              background: 'radial-gradient(ellipse, rgba(56,189,248,0.55), transparent 65%)',
              animation: 'blob 9s ease-in-out infinite',
            }}
          />
          <div
            className="absolute top-[35%] right-[-25%] w-[70%] h-[55%] opacity-20 blur-[80px]"
            style={{
              background: 'radial-gradient(ellipse, rgba(192,132,252,0.6), transparent 65%)',
              animation: 'blob 11s ease-in-out infinite reverse',
            }}
          />
          <div
            className="absolute bottom-[-10%] left-[10%] w-[90%] h-[45%] opacity-15 blur-[100px]"
            style={{
              background: 'radial-gradient(ellipse, rgba(52,211,153,0.5), transparent 65%)',
              animation: 'blob 13s ease-in-out infinite 2s',
            }}
          />
          <div className="absolute inset-0 bg-grid opacity-40" />
        </div>

        <Navbar currentPath={currentPath} setPath={setPath} />

        <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24 px-4 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 18, scale: 0.975 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.985 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full"
            >
              {page}
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomNav currentPath={currentPath} setPath={setPath} />
        <AuthModal territories={territories} />
      </div>
    </div>
  );
}
