import { useState, useEffect } from 'react';
import {
  codigoPublicoApi,
  isNotFound,
  type ApiBudgetDemand,
  type ApiCycle,
  type ApiCycleTerritoryEnvelope,
  type ApiTerritory
} from './services/api';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import DemandsSection from './components/DemandsSection';
import CouncilSection from './components/CouncilSection';
import InstitutionalSection from './components/InstitutionalSection';
import MaintainerSection from './components/MaintainerSection';
import AuditorySection from './components/AuditorySection';
import ExecutionSection from './components/ExecutionSection';
import { 
  INITIAL_CYCLE, 
  INITIAL_TERRITORIOS, 
  INITIAL_DEMANDAS, 
  INITIAL_CANDIDATOS, 
  INITIAL_AUDIT_TRAIL,
  calcularOrcamentoTerritorios 
} from './initialData';
import { CycleConfig, Territorio, Demanda, ConselhoCandidato, AuditEvent } from './types';

export default function App() {
  const { isAuthenticated, user } = useAuth();
  const [activeView, setActiveView] = useState<string>('cidadao');

  // Core state declarations
  const [cycle, setCycle] = useState<CycleConfig>(INITIAL_CYCLE);
  const [territorios, setTerritorios] = useState<Territorio[]>(
    calcularOrcamentoTerritorios(INITIAL_TERRITORIOS, INITIAL_CYCLE.pisoIgualBase, INITIAL_CYCLE.parcelaCarenciaTotal)
  );
  const [demandas, setDemandas] = useState<Demanda[]>(INITIAL_DEMANDAS);
  const [candidatos, setCandidatos] = useState<ConselhoCandidato[]>(INITIAL_CANDIDATOS);
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>(INITIAL_AUDIT_TRAIL);

  useEffect(() => {
    let isMounted = true;

    async function loadCodigoPublico() {
      try {
        const apiTerritories = await codigoPublicoApi.territories();

        let apiCycle: ApiCycle | undefined;
        try {
          apiCycle = await codigoPublicoApi.currentCycle();
        } catch (error) {
          if (!isNotFound(error)) throw error;
        }

        const nextCycle = apiCycle ? mapCycle(apiCycle, apiTerritories.length) : INITIAL_CYCLE;

        let envelopes: ApiCycleTerritoryEnvelope[] = [];
        if (apiCycle) {
          try {
            envelopes = await codigoPublicoApi.cycleTerritoryEnvelopes(apiCycle.id);
          } catch (error) {
            console.warn('Não foi possível carregar sub-envelopes territoriais.', error);
          }
        }

        let apiDemands: ApiBudgetDemand[] = [];
        try {
          apiDemands = await codigoPublicoApi.demands();
        } catch (error) {
          console.warn('Não foi possível carregar demandas OP.', error);
        }

        const mappedTerritorios = mapTerritories(apiTerritories, envelopes, nextCycle);
        const mappedDemandas = apiDemands.map(demand => mapDemand(demand, mappedTerritorios));

        if (!isMounted) return;
        setCycle(nextCycle);
        setTerritorios(mappedTerritorios);
        setDemandas(mappedDemandas);
      } catch (error) {
        console.warn('API indisponível; usando dados locais de demonstração.', error);
        if (!isMounted) return;
        setCycle(INITIAL_CYCLE);
        setTerritorios(calcularOrcamentoTerritorios(INITIAL_TERRITORIOS, INITIAL_CYCLE.pisoIgualBase, INITIAL_CYCLE.parcelaCarenciaTotal));
        setDemandas(INITIAL_DEMANDAS);
      }
    }

    void loadCodigoPublico();

    return () => {
      isMounted = false;
    };
  }, []);

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
      const resp = await codigoPublicoApi.createDemand({
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
      const updated = await codigoPublicoApi.supportDemand(demandaId);
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
      const comment = await codigoPublicoApi.commentDemand(demandaId, texto);
      
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
      const fork = await codigoPublicoApi.forkDemand(parentId, {
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased pb-12" id="app-root">
      
      {/* 1. Styled Header Component with nav */}
      <Header 
        activeView={activeView} 
        setActiveView={setActiveView} 
        cycle={cycle} 
        territoryCount={territorios.length}
      />

      {/* 2. Main Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeView === 'cidadao' && (
          <DemandsSection
            territorios={territorios}
            demandas={demandas}
            cycle={cycle}
            onAddDemanda={handleAddDemanda}
            onApoiar={handleApoiarDemanda}
            onAddComentario={handleAddComentario}
            onForkDemanda={handleForkDemanda}
            onVote={handleVote}
          />
        )}

        {activeView === 'sorteio' && (
          <CouncilSection
            candidatos={candidatos}
            onAddCandidato={handleAddCandidato}
            onLotteryComplete={handleLotteryComplete}
            cycle={cycle}
            navigateToAuditory={() => setActiveView('auditoria')}
          />
        )}

        {activeView === 'institucional' && (
          <InstitutionalSection
            demandas={demandas}
            territorios={territorios}
            onSetAdmissibilidade={handleSetAdmissibilidade}
          />
        )}

        {activeView === 'gestor' && (
          <MaintainerSection
            cycle={cycle}
            territorios={territorios}
            onUpdateRegimento={handleUpdateRegimento}
          />
        )}

        {activeView === 'execucao' && (
          <ExecutionSection
            demandas={demandas}
            territorios={territorios}
            onSetStatusExecucao={handleSetStatusExecucao}
          />
        )}

        {activeView === 'auditoria' && (
          <AuditorySection 
            auditTrail={auditTrail} 
          />
        )}

      </main>

    </div>
  );
}

function mapCycle(apiCycle: ApiCycle, territoryCount: number): CycleConfig {
  const regimento = apiCycle.regimento;
  const total = centsToReais(apiCycle.envelopeTotal);
  const territorialPool = Math.round(total * (100 - regimento.structuringPct) / 100);
  const equalPool = Math.round(territorialPool * regimento.equalSharePct / 100);
  const carenciaPool = Math.max(0, territorialPool - equalPool);
  const count = Math.max(1, territoryCount);

  return {
    id: apiCycle.id,
    ano: apiCycle.startsAt ? new Date(apiCycle.startsAt).getFullYear() : new Date().getFullYear(),
    nome: apiCycle.label,
    pisoIgualBase: Math.round(equalPool / count),
    parcelaCarenciaTotal: carenciaPool,
    limiarApoioPercentual: regimento.supportThresholdPct / 100,
    tamanhoConselho: regimento.councilSize,
    prazoDias: regimento.maturationWindow,
    faseAtual: mapCyclePhase(apiCycle.phase)
  };
}

function mapCyclePhase(phase: string): CycleConfig['faseAtual'] {
  switch (phase) {
    case 'Rascunho':
    case 'Inscrições':
      return 'preparacao';
    case 'Coleta':
      return 'propostas';
    case 'Votação':
      return 'votacao';
    case 'Consolidação':
    case 'Institucionalização':
      return 'institucional';
    case 'Encerrado':
    case 'Cancelado':
      return 'execucao';
    default:
      return 'propostas';
  }
}

function mapTerritories(
  apiTerritories: ApiTerritory[],
  envelopes: ApiCycleTerritoryEnvelope[],
  cycle: CycleConfig
): Territorio[] {
  const base = apiTerritories.map((territory): Territorio => {
    const envelope = envelopes.find(item => item.territoryName === territory.name);
    return {
      id: territory.id,
      nome: territory.name,
      populacao: Math.max(territory.activeCitizensCount || 0, 1000),
      indiceCarencia: envelope?.carenciaWeight ? Math.min(1, envelope.carenciaWeight / 100) : 0.5,
      pisoIgual: envelope ? centsToReais(envelope.equal) : 0,
      parcelaCarencia: envelope ? centsToReais(envelope.carencia) : 0,
      totalOrcamento: envelope ? centsToReais(envelope.total) : 0
    };
  });

  if (envelopes.length > 0) {
    return base;
  }

  return calcularOrcamentoTerritorios(base, cycle.pisoIgualBase, cycle.parcelaCarenciaTotal);
}

function mapDemand(apiDemand: ApiBudgetDemand, territorios: Territorio[]): Demanda {
  const territorio = territorios.find(item => item.id === apiDemand.territoryId || item.nome === apiDemand.territoryName);
  const threshold = Math.max(1, apiDemand.supportThreshold || Math.round((territorio?.populacao ?? 1000) * 0.03));
  const status = apiDemand.status;

  return {
    id: apiDemand.id,
    titulo: apiDemand.title,
    descricao: apiDemand.description,
    territorioId: apiDemand.territoryId,
    dataCriacao: dateOnly(apiDemand.createdAt),
    apoiosCount: apiDemand.supports,
    apoiosNecessarios: threshold,
    passouProtocolar: !['Precisa de informações', 'Arquivada', 'Dormente'].includes(status),
    passouPopular: apiDemand.supportReached || apiDemand.supports >= threshold,
    criteriaProtocolar: {
      vinculoValido: true,
      dadosMinimos: Boolean(apiDemand.title && apiDemand.description),
      interessePublico: !['Arquivada', 'Dormente'].includes(status),
    },
    comentarios: apiDemand.comments.map(comment => ({
      id: comment.id,
      autor: comment.authorName || 'Cidadão',
      texto: comment.content,
      data: dateOnly(comment.createdAt)
    })),
    forkId: apiDemand.forkedFromDemandId,
    parentTitulo: apiDemand.forkedFromDemandId ? `Demanda ${apiDemand.forkedFromDemandId}` : undefined,
    admissibilidadeMarcar: status === 'Apta para priorização' || status === 'Incluída na matriz orçamentária'
      ? 'admissivel'
      : status === 'Arquivada'
      ? 'inadmissivel'
      : 'pendente'
  };
}

function centsToReais(value: number) {
  return Math.round(value / 100);
}

function dateOnly(value?: string) {
  if (!value) return new Date().toISOString().substring(0, 10);
  return value.substring(0, 10);
}
