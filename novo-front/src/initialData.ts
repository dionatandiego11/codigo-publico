import { Territorio, CycleConfig, Demanda, AuditEvent, ConselhoCandidato } from './types';

export const INITIAL_CYCLE: CycleConfig = {
  id: 'ciclo-2026',
  ano: 2026,
  nome: 'Ciclo Piloto Brumadinho 2026',
  pisoIgualBase: 1200000, // R$ 1.2M garantidos por território como Piso Igual
  parcelaCarenciaTotal: 3000000, // R$ 3.0M distribuídos proporcionalmente pela vulnerabilidade (carência)
  limiarApoioPercentual: 0.03, // 3% da população vinculada necessária para quórum
  tamanhoConselho: 5,
  prazoDias: 45,
  faseAtual: 'propostas',
};

export const INITIAL_TERRITORIOS: Territorio[] = [
  {
    id: 't-feijao',
    nome: 'Córrego do Feijão',
    populacao: 1800,
    indiceCarencia: 0.85, // Alto índice de vulnerabilidade e necessidade de reconstrução
    pisoIgual: 0, // Calculado dinamicamente
    parcelaCarencia: 0, // Calculado dinamicamente
    totalOrcamento: 0, // Calculado dinamicamente
  },
  {
    id: 't-flores',
    nome: 'Alberto Flores',
    populacao: 2400,
    indiceCarencia: 0.70,
    pisoIgual: 0,
    parcelaCarencia: 0,
    totalOrcamento: 0,
  },
  {
    id: 't-tejuco',
    nome: 'Tejuco',
    populacao: 3100,
    indiceCarencia: 0.65,
    pisoIgual: 0,
    parcelaCarencia: 0,
    totalOrcamento: 0,
  },
  {
    id: 't-cachoeira',
    nome: 'Parque da Cachoeira',
    populacao: 1500,
    indiceCarencia: 0.90, // Vulnerabilidade máxima devido a impactos
    pisoIgual: 0,
    parcelaCarencia: 0,
    totalOrcamento: 0,
  },
  {
    id: 't-aranha',
    nome: 'Aranha',
    populacao: 4200,
    indiceCarencia: 0.40,
    pisoIgual: 0,
    parcelaCarencia: 0,
    totalOrcamento: 0,
  },
  {
    id: 't-centro',
    nome: 'Brumadinho Centro',
    populacao: 12000,
    indiceCarencia: 0.20,
    pisoIgual: 0,
    parcelaCarencia: 0,
    totalOrcamento: 0,
  }
];

export const INITIAL_DEMANDAS: Demanda[] = [
  {
    id: 'dem-01',
    titulo: 'Reforma Completa do Posto de Saúde da Família',
    descricao: 'O posto de saúde atual atende precariamente e sofre com infiltrações no telhado. Precisamos de reforma geral, ampliação da sala de curativos e garantia de acessibilidade completa.',
    territorioId: 't-feijao',
    dataCriacao: '2026-06-10',
    apoiosCount: 62,
    apoiosNecessarios: 54, // 3% de 1800 é 54 apoios
    passouProtocolar: true,
    passouPopular: true,
    criteriaProtocolar: {
      vinculoValido: true,
      dadosMinimos: true,
      interessePublico: true,
    },
    comentarios: [
      { id: 'c1', autor: 'Aline de Souza', texto: 'Isso é urgente! Muitas vezes temos que nos deslocar até o Centro para consultas básicas.', data: '2026-06-11' },
      { id: 'c2', autor: 'João Carlos', texto: 'Completamente de acordo, o PSF é a alma do nosso território.', data: '2026-06-12' }
    ],
    statusExecucao: 'planejamento'
  },
  {
    id: 'dem-02',
    titulo: 'Falta de iluminação pública na descida principal',
    descricao: 'A descida de acesso ao bairro está às escuras, gerando grave insegurança para quem volta do trabalho ou escola à noite. Propomos a instalação de 15 novos braços de LED.',
    territorioId: 't-tejuco',
    dataCriacao: '2026-06-14',
    apoiosCount: 88,
    apoiosNecessarios: 93, // 3% de 3100 é 93
    passouProtocolar: true,
    passouPopular: false, // Quase lá!
    criteriaProtocolar: {
      vinculoValido: true,
      dadosMinimos: true,
      interessePublico: true,
    },
    comentarios: [
      { id: 'c3', autor: 'Marcos André', texto: 'Já passou da hora de resolverem isso. A pé à noite ali é perigosíssimo.', data: '2026-06-15' }
    ]
  },
  {
    id: 'dem-03',
    titulo: 'Centro de Apoio à Agricultura Familiar',
    descricao: 'Galpão comunitário para armazenamento, processamento mínimo e comercialização direta dos produtos hortifrúti dos pequenos produtores de Alberto Flores.',
    territorioId: 't-flores',
    dataCriacao: '2026-06-11',
    apoiosCount: 75,
    apoiosNecessarios: 72, // 3% de 2400 é 72
    passouProtocolar: true,
    passouPopular: true,
    criteriaProtocolar: {
      vinculoValido: true,
      dadosMinimos: true,
      interessePublico: true,
    },
    comentarios: [],
    admissibilidadeMarcar: 'admissivel',
    statusExecucao: 'licitacao'
  },
  {
    id: 'dem-04',
    titulo: 'Construção de Ciclovia de Integração',
    descricao: 'Ciclovia segura ligando a entrada de Alberto Flores à pista principal, permitindo o trânsito seguro de trabalhadores que usam bicicleta para locomoção diária.',
    territorioId: 't-flores',
    dataCriacao: '2026-06-12',
    apoiosCount: 85,
    apoiosNecessarios: 72,
    passouProtocolar: true,
    passouPopular: true,
    criteriaProtocolar: {
      vinculoValido: true,
      dadosMinimos: true,
      interessePublico: true,
    },
    comentarios: [
      { id: 'c4', autor: 'Geraldo do Trator', texto: 'Excelente projeto! Muitos ciclistas correm risco dividindo espaço com caminhões.', data: '2026-06-13' }
    ],
    admissibilidadeMarcar: 'inadmissivel',
    justificativaInadmissibilidade: 'A área proposta interfere com a faixa de domínio estadual e necessita de projeto de engenharia de alta complexidade, inviabilizando o custeio simplificado dentro deste ciclo.',
    divergente: true,
    justificativaDivergencia: 'A Câmara de Vereadores barrou o repasse por julgar que o projeto deve ser de responsabilidade direta da concessionária da rodovia, contrariando a aprovação técnica e o clamor local dos moradores.'
  },
  {
    id: 'dem-05',
    titulo: 'Quadra Poliesportiva Coberta e Iluminada',
    descricao: 'Espaço para o lazer das crianças e jovens. Atualmente eles jogam em um terreno baldio com poeira. A quadra coberta serviria também para eventos e reuniões do conselho.',
    territorioId: 't-cachoeira',
    dataCriacao: '2026-06-05',
    apoiosCount: 50,
    apoiosNecessarios: 45, // 3% de 1500 é 45
    passouProtocolar: true,
    passouPopular: true,
    criteriaProtocolar: {
      vinculoValido: true,
      dadosMinimos: true,
      interessePublico: true,
    },
    comentarios: [
      { id: 'c5', autor: 'Camila Santos', texto: 'Nossos filhos merecem um lugar limpo e digno para praticar esportes.', data: '2026-06-06' }
    ],
    statusExecucao: 'frustrado',
    justificativaFrustrado: 'A empresa vencedora da licitação declarou falência no meio do contrato. A execução foi interrompida e o contrato rescindido.'
  }
];

export const INITIAL_CANDIDATOS: ConselhoCandidato[] = [
  { id: 'cand-01', nome: 'Dona Maria do Socorro', bairro: 'Córrego do Feijão', comprovado: true, sorteado: false },
  { id: 'cand-02', nome: 'Aline de Souza Cruz', bairro: 'Córrego do Feijão', comprovado: true, sorteado: false },
  { id: 'cand-03', nome: 'Geraldo Magela Pinheiro', bairro: 'Alberto Flores', comprovado: true, sorteado: false },
  { id: 'cand-04', nome: 'Marcos André Silva', bairro: 'Tejuco', comprovado: true, sorteado: false },
  { id: 'cand-05', nome: 'Camila Santos de Paula', bairro: 'Parque da Cachoeira', comprovado: true, sorteado: false },
  { id: 'cand-06', nome: 'Sebastião Lacerda', bairro: 'Aranha', comprovado: true, sorteado: false },
  { id: 'cand-07', nome: 'Juliana Regina Reis', bairro: 'Brumadinho Centro', comprovado: true, sorteado: false },
  { id: 'cand-08', nome: 'Antônio Peixeira', bairro: 'Tejuco', comprovado: true, sorteado: false },
  { id: 'cand-09', nome: 'Cleusa Maria das Dores', bairro: 'Parque da Cachoeira', comprovado: true, sorteado: false },
  { id: 'cand-10', nome: 'Roberto Alves de Souza', bairro: 'Alberto Flores', comprovado: true, sorteado: false },
  { id: 'cand-11', nome: 'Lúcia de Fátima', bairro: 'Córrego do Feijão', comprovado: true, sorteado: false },
  { id: 'cand-12', nome: 'Pedro Henrique Guedes', bairro: 'Brumadinho Centro', comprovado: true, sorteado: false }
];

export const INITIAL_AUDIT_TRAIL: AuditEvent[] = [
  {
    id: 'ev-01',
    tipo: 'sorteio',
    descricao: 'Sorteio do Conselho Territorial Brumadinho 2026 concluído via semente pública "BRUMADINHO_PROSPERO_2026".',
    timestamp: '2026-06-01T10:00:00Z',
    hash: '8f7a90b8d7ef23e210ac09de99bf090887103ab62d645f78ee99b38dc763eeef',
    anteriorHash: '0000000000000000000000000000000000000000000000000000000000000000',
    provaAncora: 'D.O.M. Edição nº 3214 - Pág 12'
  },
  {
    id: 'ev-02',
    tipo: 'apoio',
    descricao: 'Demanda "Reforma Completa do Posto de Saúde da Família" atingiu o quórum popular (54 apoios necessários).',
    timestamp: '2026-06-15T16:24:11Z',
    hash: '03ba1299dfcb8ef9023ab9de23f4b8cc10e4f5539ab887efefd398912384aeee',
    anteriorHash: '8f7a90b8d7ef23e210ac09de99bf090887103ab62d645f78ee99b38dc763eeef',
  },
  {
    id: 'ev-03',
    tipo: 'veto',
    descricao: 'Veto formal (divergência) aplicado à proposta "Construção de Ciclovia de Integração" pelo Legislativo Municipal.',
    timestamp: '2026-06-18T18:45:00Z',
    hash: 'ab123fe5592bc9da812efd9943bbbe22cd9e8aa9938e12abef9e992381273922',
    anteriorHash: '03ba1299dfcb8ef9023ab9de23f4b8cc10e4f5539ab887efefd398912384aeee',
    provaAncora: 'ATA-CAMARA-2026-44'
  }
];

// Helper para recalcular os orçamentos com base no piso e carência
export function calcularOrcamentoTerritorios(
  territorios: Territorio[],
  pisoIgualBase: number,
  parcelaCarenciaTotal: number
): Territorio[] {
  // O "Piso Igual" é garantido para todos os territórios (dividido igualmente se for o caso, ou fixo)
  // De acordo com as especificações, a parcela por carência é ponderada pela população * índice de carência
  const somaPonderadaCarencia = territorios.reduce(
    (acc, t) => acc + t.populacao * t.indiceCarencia,
    0
  );

  return territorios.map((t) => {
    const piso = pisoIgualBase; // Cada território ganha R$ 1.2M de piso garantido
    const parcela = somaPonderadaCarencia > 0
      ? (t.populacao * t.indiceCarencia / somaPonderadaCarencia) * parcelaCarenciaTotal
      : 0;
    
    return {
      ...t,
      pisoIgual: piso,
      parcelaCarencia: Math.round(parcela),
      totalOrcamento: Math.round(piso + parcela),
    };
  });
}
