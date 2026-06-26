import { useEffect, useState } from 'react';
import { useAuth } from './auth/AuthContext';
import AppShell from './app/AppShell';
import { AppView, canAccessView, isInstitutionalRole } from './app/navigation';
import CycleDashboard from './features/op/CycleDashboard';
import DemandsSection from './features/op/DemandsSection';
import VotingSection from './features/op/VotingSection';
import CouncilSection from './features/council/CouncilSection';
import InstitutionalSection from './features/institutional/InstitutionalSection';
import MaintainerSection from './features/op/MaintainerSection';
import AuditorySection from './features/audit/AuditorySection';
import ExecutionSection from './features/execution/ExecutionSection';
import { dateOnly, mapDemand } from './features/op/adapters';
import { opApi } from './features/op/api';
import { useOPData } from './features/op/useOPData';
import { 
  INITIAL_CANDIDATOS, 
  INITIAL_AUDIT_TRAIL,
  calcularOrcamentoTerritorios 
} from './demo/initialData';
import { AuditEvent, ConselhoCandidato, CycleConfig, Demanda } from './shared/domain/types';

export default function App() {
  const { isAuthenticated, user } = useAuth();
  const [activeView, setActiveView] = useState<AppView>('painel');
  const { cycle, setCycle, territorios, setTerritorios, demandas, setDemandas } = useOPData();
  const [candidatos, setCandidatos] = useState<ConselhoCandidato[]>(INITIAL_CANDIDATOS);
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>(INITIAL_AUDIT_TRAIL);
  const activeRole = user?.role;

  useEffect(() => {
    if (!canAccessView(activeView, activeRole)) {
      setActiveView('painel');
    }
  }, [activeRole, activeView]);

  // Helper to generate mock secure sha256-like hex hashes for ledger
  const generateHash = () => {
    return Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  // Add event to imutavel ledger
  const appendAuditEvent = (tipo: AuditEvent['tipo'], descricao: string, provaAncora?: string) => {
    const anteriorHash = auditTrail[auditTrail.length - 1]?.hash || generateHash();
    const hash = generateHash();
    const newEvent: AuditEvent = {
      id: `ev-${Date.now()}`,
      tipo,
      descricao,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      hash,
      anteriorHash,
      provaAncora
    };
    setAuditTrail(prev => [...prev, newEvent]);
  };

  // Callback: User updates cycle regimento parameters (Stage 0 / Maintainer)
  const handleUpdateRegimento = (updatedFields: Partial<CycleConfig>) => {
    setCycle(prev => {
      const nextCycle = { ...prev, ...updatedFields };
      
      // Recalculate territorial budget distribution based on new envelope values
      setTerritorios(prevTerritorios => 
        calcularOrcamentoTerritorios(
          prevTerritorios, 
          nextCycle.pisoIgualBase, 
          nextCycle.parcelaCarenciaTotal
        )
      );

      // Recalculate signatures required for all active demands
      setDemandas(prevDemandas => 
        prevDemandas.map(d => {
          const t = territorios.find(currT => currT.id === d.territorioId);
          const pop = t ? t.populacao : 1000;
          const apoioPct = nextCycle.limiarApoioPercentual;
          const apoiosReq = Math.round(pop * apoioPct);
          return {
            ...d,
            apoiosNecessarios: apoiosReq,
            passouPopular: d.apoiosCount >= apoiosReq
          };
        })
      );

      return nextCycle;
    });

    appendAuditEvent(
      'estado_execucao', 
      `Regimento modificado. Novo piso: R$ ${updatedFields.pisoIgualBase?.toLocaleString()}, quórum: ${(updatedFields.limiarApoioPercentual || 0.03) * 100}%.`
    );
  };

  // Callback: Citizens adds a raw idea
  const handleAddDemanda = async (titulo: string, descricao: string, territorioId: string) => {
    if (!isAuthenticated) {
      alert("Você precisa estar logado para publicar uma demanda.");
      return;
    }
    
    const t = territorios.find(curr => curr.id === territorioId);
    try {
      const resp = await opApi.createDemand({
        territoryId: territorioId,
        title: titulo,
        description: descricao,
        category: "Geral",
        location: t?.nome || territorioId
      });

      const novaDemanda = mapDemand(resp, territorios);
      setDemandas(prev => [novaDemanda, ...prev]);
      appendAuditEvent('apoio', `Nova demanda "${titulo}" publicada em ${t?.nome || 'Brumadinho'} pelo cidadão.`);
    } catch (e: any) {
      alert("Erro ao publicar: " + e.message);
    }
  };

  // Callback: Citizen supports an active idea
  const handleApoiarDemanda = async (demandaId: string) => {
    if (!isAuthenticated) {
      alert("Você precisa estar logado para apoiar uma proposta.");
      return;
    }
    try {
      const updated = await opApi.supportDemand(demandaId);
      const mapped = mapDemand(updated, territorios);
      
      setDemandas(prev => 
        prev.map(d => {
          if (d.id === demandaId) {
            if (mapped.passouPopular && !d.passouPopular) {
              setTimeout(() => {
                appendAuditEvent('apoio', `Demanda "${d.titulo}" atingiu o quórum de assinaturas de apoio e destravou o Portão Popular.`);
              }, 100);
            }

            return { ...d, ...mapped };
          }
          return d;
        })
      );
    } catch (e: any) {
      alert("Erro ao apoiar: " + e.message);
    }
  };

  // Callback: Citizen adds comment
  const handleAddComentario = async (demandaId: string, texto: string) => {
    if (!isAuthenticated) {
      alert("Você precisa estar logado para comentar.");
      return;
    }
    try {
      const comment = await opApi.commentDemand(demandaId, texto);
      
      const newComment = {
        id: comment.id,
        autor: comment.authorName || user?.fullName || 'Cidadão',
        texto: comment.content,
        data: dateOnly(comment.createdAt),
      };

      setDemandas(prev => 
        prev.map(d => {
          if (d.id === demandaId) {
            return {
              ...d,
              comentarios: [...d.comentarios, newComment]
            };
          }
          return d;
        })
      );
    } catch (e: any) {
      alert("Erro ao comentar: " + e.message);
    }
  };

  // Callback: Citizen branches an idea (Fork)
  const handleForkDemanda = async (parentId: string, novoTitulo: string, novaDescricao: string) => {
    if (!isAuthenticated) {
      alert("Você precisa estar logado para criar um fork.");
      return;
    }

    const parent = demandas.find(d => d.id === parentId);
    if (!parent) return;

    try {
      const fork = await opApi.forkDemand(parentId, {
        title: novoTitulo,
        description: novaDescricao,
        category: "Geral",
        reason: `Fork criado a partir de ${parent.titulo}`
      });
      const novaDemanda = {
        ...mapDemand(fork, territorios),
        forkId: parent.id,
        parentTitulo: parent.titulo
      };

      setDemandas(prev => [novaDemanda, ...prev]);
      appendAuditEvent('apoio', `Nova ramificação (fork) "${novoTitulo}" criada a partir da ideia base "${parent.titulo}".`);
    } catch (e: any) {
      alert("Erro ao criar fork: " + e.message);
    }
  };

  // Callback: Secret ballot simulation
  const handleVote = (demandaId: string) => {
    const d = demandas.find(curr => curr.id === demandaId);
    const receipt = generateHash();
    
    appendAuditEvent(
      'voto', 
      `Voto secreto computado e verificado com Recibo Opaco para proposta ID: ${demandaId.substring(0, 6)}...`
    );

    return receipt;
  };

  // Callback: Add candidate to Council Lottery
  const handleAddCandidato = (nome: string, bairro: string) => {
    const novoCandidato: ConselhoCandidato = {
      id: `cand-${Date.now()}`,
      nome,
      bairro,
      comprovado: true,
      sorteado: false
    };
    setCandidatos(prev => [novoCandidato, ...prev]);
  };

  // Callback: Council Lottery drawing completes
  const handleLotteryComplete = (sorteados: ConselhoCandidato[], semente: string) => {
    const sorteadosIds = new Set(sorteados.map(s => s.id));
    
    // update state
    setCandidatos(prev => 
      prev.map(c => ({
        ...c,
        sorteado: sorteadosIds.has(c.id)
      }))
    );

    appendAuditEvent(
      'sorteio', 
      `Sorteio público do Conselho concluído usando a semente "${semente}". ${sorteados.length} membros diplomados.`,
      `MUNICÍPIO-SRT-${Date.now().toString().substring(8)}`
    );
  };

  // Callback: Admissibility decisions (Filtro Institucional & Divergência)
  const handleSetAdmissibilidade = (
    demandaId: string, 
    admissibilidade: 'admissivel' | 'inadmissivel', 
    justificativa: string
  ) => {
    setDemandas(prev => 
      prev.map(d => {
        if (d.id === demandaId) {
          const isDivergente = admissibilidade === 'inadmissivel' && d.passouPopular;
          
          if (isDivergente) {
            // Trigger log on active divergence
            setTimeout(() => {
              appendAuditEvent(
                'veto', 
                `Incidente de divergência pública aberto para proposta "${d.titulo}" devido a veto de admissibilidade formal.`,
                `VETO-LEGISLATIVO-${d.id.split('-')[1]}`
              );
            }, 100);
          }

          return {
            ...d,
            admissibilidadeMarcar: admissibilidade,
            justificativaInadmissibilidade: admissibilidade === 'inadmissivel' ? justificativa : undefined,
            divergente: isDivergente,
            justificativaDivergencia: isDivergente ? justificativa : undefined
          };
        }
        return d;
      })
    );
  };

  // Callback: Edit execution status (with systematic feedback compensation loop)
  const handleSetStatusExecucao = (
    demandaId: string, 
    status: Demanda['statusExecucao'], 
    justificativa?: string
  ) => {
    const targetDemanda = demandas.find(d => d.id === demandaId);
    if (!targetDemanda) return;

    setDemandas(prev => 
      prev.map(d => {
        if (d.id === demandaId) {
          return {
            ...d,
            statusExecucao: status,
            justificativaFrustrado: status === 'frustrado' ? justificativa : undefined
          };
        }
        return d;
      })
    );

    // SYSTEM COMPENSATIVE LOOP: If marked frustrated, increase territorial vulnerability carência by +0.10!
    if (status === 'frustrado') {
      setTerritorios(prevT => {
        const nextTerritorios = prevT.map(t => {
          if (t.id === targetDemanda.territorioId) {
            const nextIndex = Math.min(1.0, t.indiceCarencia + 0.10);
            return {
              ...t,
              indiceCarencia: nextIndex
            };
          }
          return t;
        });

        // Recalculate dynamic budgets instantly with updated carência values!
        return calcularOrcamentoTerritorios(
          nextTerritorios, 
          cycle.pisoIgualBase, 
          cycle.parcelaCarenciaTotal
        );
      });

      appendAuditEvent(
        'estado_execucao', 
        `Obra "${targetDemanda.titulo}" marcada como frustrada. Compensação ativada: carência territorial aumentada.`
      );
    } else {
      appendAuditEvent(
        'estado_execucao', 
        `Status da obra "${targetDemanda.titulo}" alterado formalmente para "${status}".`
      );
    }
  };

  const currentView = canAccessView(activeView, activeRole) ? activeView : 'painel';

  const page = (() => {
    if (currentView === 'painel') {
      return (
        <CycleDashboard
          cycle={cycle}
          territorios={territorios}
          demandas={demandas}
          user={user}
          onNavigate={setActiveView}
        />
      );
    }

    if (currentView === 'cidadao') {
      return (
        <DemandsSection
          territorios={territorios}
          demandas={demandas}
          cycle={cycle}
          onAddDemanda={handleAddDemanda}
          onApoiar={handleApoiarDemanda}
          onAddComentario={handleAddComentario}
          onForkDemanda={handleForkDemanda}
        />
      );
    }

    if (currentView === 'votacao') {
      return (
        <VotingSection
          territorios={territorios}
          demandas={demandas}
          cycle={cycle}
          onVote={handleVote}
        />
      );
    }

    if (currentView === 'sorteio') {
      return (
        <CouncilSection
          candidatos={candidatos}
          onAddCandidato={handleAddCandidato}
          onLotteryComplete={handleLotteryComplete}
          cycle={cycle}
          navigateToAuditory={() => setActiveView('auditoria')}
        />
      );
    }

    if (currentView === 'institucional') {
      return (
        <InstitutionalSection
          demandas={demandas}
          territorios={territorios}
          onSetAdmissibilidade={handleSetAdmissibilidade}
        />
      );
    }

    if (currentView === 'gestor') {
      return (
        <MaintainerSection
          cycle={cycle}
          territorios={territorios}
          onUpdateRegimento={handleUpdateRegimento}
        />
      );
    }

    if (currentView === 'execucao') {
      return (
        <ExecutionSection
          demandas={demandas}
          territorios={territorios}
          onSetStatusExecucao={handleSetStatusExecucao}
          canEditStatus={isInstitutionalRole(activeRole)}
        />
      );
    }

    return <AuditorySection auditTrail={auditTrail} />;
  })();

  return (
    <AppShell
      activeView={currentView}
      setActiveView={setActiveView}
      cycle={cycle}
      territoryCount={territorios.length}
    >
      {page}
    </AppShell>
  );
}
