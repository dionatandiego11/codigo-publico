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

export interface Demanda {
  id: string;
  titulo: string;
  descricao: string;
  territorioId: string;
  dataCriacao: string;
  apoiosCount: number;
  apoiosNecessarios: number;
  passouProtocolar: boolean;
  passouPopular: boolean;
  criteriaProtocolar: {
    vinculoValido: boolean;
    dadosMinimos: boolean;
    interessePublico: boolean;
  };
  comentarios: Comment[];
  forkId?: string; // se for fork de outra demanda
  parentTitulo?: string;
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
