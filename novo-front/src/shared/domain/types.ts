export interface Territorio {
  id: string;
  nome: string;
  populacao: number;
  indiceCarencia: number; // 0 a 1 - para cálculo de carência
  pisoIgual: number;
  parcelaCarencia: number;
  totalOrcamento: number;
}

export interface CycleConfig {
  id: string;
  ano: number;
  nome: string;
  pisoIgualBase: number;
  parcelaCarenciaTotal: number;
  limiarApoioPercentual: number; // ex: 0.03 (3%)
  tamanhoConselho: number; // 3 a 7
  prazoDias: number;
  faseAtual: 'preparacao' | 'propostas' | 'votacao' | 'institucional' | 'execucao';
}

export interface Comment {
  id: string;
  autor: string;
  texto: string;
  data: string;
}

export interface DemandEvent {
  id: string;
  demandId: string;
  actorId?: string;
  actorType: 'citizen' | 'management' | 'admin' | 'system';
  type: string;
  fromState?: string;
  toState?: string;
  visibility: 'public' | 'internal' | 'audit_only';
  payload: Record<string, any>;
  createdAt: string;
}

export interface Demanda {
  id: string;
  titulo: string;
  descricao: string;
  status?: string;
  territorioId: string;
  escopoVotacao?: 'territorial' | 'municipal';
  dataCriacao: string;
  apoiosCount: number;
  apoiosNecessarios: number;
  votosCount?: number;
  passouProtocolar: boolean;
  passouPopular: boolean;
  criteriaProtocolar: {
    vinculoValido: boolean;
    dadosMinimos: boolean;
    interessePublico: boolean;
  };
  comentarios: Comment[];
  events?: DemandEvent[];
  forkId?: string; // se for fork de outra demanda
  parentTitulo?: string;
  agrupadaEmId?: string;
  admissibilidadeMarcar?: 'admissivel' | 'inadmissivel' | 'pendente';
  justificativaInadmissibilidade?: string;
  divergente?: boolean;
  justificativaDivergencia?: string;
  statusExecucao?: 'planejamento' | 'licitacao' | 'obra' | 'concluido' | 'frustrado';
  justificativaFrustrado?: string;
}

export interface AuditEvent {
  id: string;
  tipo: 'sorteio' | 'voto' | 'veto' | 'apoio' | 'estado_execucao';
  descricao: string;
  timestamp: string;
  hash: string;
  anteriorHash: string;
  provaAncora?: string; // Link/Número de Diário Oficial ou Blockchain fictícia para ancoragem externa
}

export interface ConselhoCandidato {
  id: string;
  nome: string;
  bairro: string;
  comprovado: boolean;
  sorteado: boolean;
}

export interface RankingItem {
  id: string;
  cycleId: string;
  territoryId: string;
  territoryName: string;
  demandId: string;
  proposalId: string;
  votingId: string;
  proposalTitle: string;
  position: number;
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  totalVotes: number;
  approvalPct: number;
  quorumReached: boolean;
  approved: boolean;
  status: 'Computado' | 'Incluído na matriz' | 'Em execução' | 'Concluído' | 'Frustrado';
  frustrationReason?: string;
}

export interface OPVoting {
  id: string;
  proposalId: string;
  territoryId: string;
  territoryName: string;
  title: string;
  summary: string;
  deadline: string;
  quorumNeeded: number;
  quorumReached: number;
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  status: 'Aberta' | 'Encerrada' | 'Cancelada';
  scope?: string;
}
