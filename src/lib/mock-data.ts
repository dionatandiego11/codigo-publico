/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LawArticle, Issue, CivicPR, Voting, Release, ExecutionTracker, Territory } from '../types';

export const MOCK_TERRITORIOS: Territory[] = [
  {
    id: 'campo-grande',
    name: 'Campo Grande',
    zone: 'Zona Rural',
    activeIssuesCount: 18,
    linkedPRsCount: 3,
    activeVotingsCount: 2,
    executionProjectsCount: 1,
    activeCitizensCount: 1240,
  },
  {
    id: 'vila-esperanca',
    name: 'Vila Esperança',
    zone: 'Zona Urbana',
    activeIssuesCount: 24,
    linkedPRsCount: 5,
    activeVotingsCount: 1,
    executionProjectsCount: 2,
    activeCitizensCount: 3820,
  },
  {
    id: 'centro',
    name: 'Centro Histórico',
    zone: 'Zona Urbana',
    activeIssuesCount: 12,
    linkedPRsCount: 8,
    activeVotingsCount: 3,
    executionProjectsCount: 4,
    activeCitizensCount: 5600,
  },
  {
    id: 'morro-alto',
    name: 'Morro Alto',
    zone: 'Zona Especial',
    activeIssuesCount: 31,
    linkedPRsCount: 4,
    activeVotingsCount: 1,
    executionProjectsCount: 1,
    activeCitizensCount: 2950,
  },
  {
    id: 'distrito-industrial',
    name: 'Distrito Industrial',
    zone: 'Zona Urbana',
    activeIssuesCount: 7,
    linkedPRsCount: 2,
    activeVotingsCount: 0,
    executionProjectsCount: 2,
    activeCitizensCount: 450,
  }
];

export const MOCK_ARTIGOS: LawArticle[] = [
  {
    id: 'art-1',
    number: 1,
    title: 'Título I: Dos Princípios Fundamentais',
    chapter: 'Capítulo I: Do Município como Entidade',
    content: 'Art. 1º. O Município de Novo Horizonte, parte integrante da República Federativa do Brasil e do Estado de São Paulo, organiza-se de forma autônoma em tudo o que respeite ao seu peculiar interesse, regendo-se por esta Lei Orgânica.',
    citizenExplanation: 'O município de Novo Horizonte tem autonomia para criar suas próprias regras de interesse local, sempre respeitando as constituições paulista e brasileira, sob o amparo da sua própria Lei Orgânica do município (o núcleo de todas as leis da cidade).',
    version: 'v2020.0',
    lastUpdated: '2020-11-15',
    comments: [
      {
        id: 'c-1',
        authorName: 'Ana Silva',
        authorRole: 'Cidadão',
        content: 'Excelente nível de clareza sobre que a autonomia serve para cuidar do "peculiar interesse".',
        createdAt: '2026-02-12T10:00:00Z',
        likes: 12
      },
      {
        id: 'c-2',
        authorName: 'Gabriel Nogueira',
        authorRole: 'Procurador',
        content: 'Esse dispositivo preserva a perfeita consonância com o Artigo 29 da Constituição Federal de 1988.',
        createdAt: '2026-03-01T14:30:00Z',
        likes: 24
      }
    ]
  },
  {
    id: 'art-12',
    number: 12,
    title: 'Título II: Dos Direitos e Garantias Fundamentais',
    chapter: 'Capítulo III: Da Participação Popular',
    section: 'Seção I: Das Ferramentas de Consulta',
    content: 'Art. 12. O Município assegurará a participação da comunidade na formulação e controle das políticas públicas municipais, assegurados os recursos de audiência pública, iniciativa popular de projetos de lei e conselhos paritários.',
    citizenExplanation: 'Este artigo garante que a prefeitura crie meios físicos ou representativos para que as pessoas possam discutir o planejamento da cidade, ir a reuniões públicas (audiências) e criar propostos de leis com assinaturas de eleitores.',
    version: 'v2024.0',
    lastUpdated: '2024-06-10',
    amendmentNumber: 'Emenda nº 03/2024',
    comments: [
      {
        id: 'c-3',
        authorName: 'Renato Mendes',
        authorRole: 'Cidadão',
        content: 'As audiências físicas às 14h de uma quarta-feira inviabilizam a participação de quem trabalha. Precisamos de mecanismos digitais urgentes!',
        createdAt: '2026-05-18T09:12:00Z',
        likes: 56
      },
      {
        id: 'c-4',
        authorName: 'Mariana Costa',
        authorRole: 'Técnico',
        content: 'Excelente insight. É ideal abrirmos uma issue normativa para discutir a segurança jurídica do plebiscito e consultas online.',
        createdAt: '2026-05-19T11:24:00Z',
        likes: 31
      }
    ]
  },
  {
    id: 'art-35',
    number: 35,
    title: 'Título III: Da Organização Administrativa',
    chapter: 'Capítulo I: Da Transparência Ativa',
    content: 'Art. 35. Os atos da administração direta e indireta serão publicados em Diário Oficial do Município, garantindo a ampla transparência ativa de receitas e despesas em tempo real de forma acessível à população.',
    citizenExplanation: 'Todas as ações da Prefeitura, contratações, editais e gastos de dinheiro público devem sair no Diário Oficial e constar em portais públicos para que qualquer pessoa possa ver onde o imposto está sendo investido.',
    version: 'v2020.0',
    lastUpdated: '2020-11-15',
    comments: [
      {
        id: 'c-5',
        authorName: 'Thiago Azevedo',
        authorRole: 'Controladoria',
        content: 'O atraso na indexação de dados em formatos legíveis (como JSON/CSV) gera retrabalho para o controle social.',
        createdAt: '2026-04-10T15:20:00Z',
        likes: 18
      }
    ]
  },
  {
    id: 'art-88',
    number: 88,
    title: 'Título IV: Do Orçamento Municipal',
    chapter: 'Capítulo II: Das Peças de Planejamento',
    content: 'Art. 88. O Plano Plurianual (PPA), as Diretrizes Orçamentárias (LDO) e o Orçamento Anual (LOA) serão elaborados anualmente e submetidos à apreciação legislativa com mecanismos obrigatórios de consulta participativa nos bairros.',
    citizenExplanation: 'As três principais ferramentas de orçamento da nossa cidade (o PPA para planos de 4 anos, a LDO para desenhar regras de prioridades, e a LOA que distribui o dinheiro de verdade) exigem escuta popular direta nos bairros antes de irem para votação na Câmara.',
    version: 'v2024.0',
    lastUpdated: '2024-12-12',
    comments: []
  },
  {
    id: 'art-110',
    number: 110,
    title: 'Título V: Do Desenvolvimento Urbano e Rural',
    chapter: 'Capítulo I: Do Plano Diretor',
    content: 'Art. 110. O Plano Diretor do Município é o instrumento básico da política de desenvolvimento e expansão urbana, e deve ser revisto a cada dez anos com auditoria de zoneamento e impacto ambiental.',
    citizenExplanation: 'O Plano Diretor organiza o crescimento da nossa cidade. Ele decide onde podem subir prédios, onde ficam as áreas verdes, os bairros residenciais e as vias principais. Ele precisa obrigatoriamente de uma revisão detalhada a cada dez anos.',
    version: 'v2020.0',
    lastUpdated: '2020-11-15',
    comments: [
      {
        id: 'c-6',
        authorName: 'Marcos Terrazas',
        authorRole: 'Cidadão',
        content: 'Importante frisar que as zonas de mananciais em Campo Grande estão sofrendo pressões imobiliárias irregulares.',
        createdAt: '2026-06-02T18:00:00Z',
        likes: 42
      }
    ]
  }
];

export const MOCK_REPOSITORIOS = [
  {
    slug: 'lei-organica',
    name: 'Lei Orgânica Municipal',
    description: 'O Kernel do Município. O conjunto de normas estruturantes que rege toda a organização institucional, divisão de poderes, direitos e finanças municipais.',
    version: 'v2026.0',
    docsCount: 1,
    activeIssues: 3,
    activePRs: 2,
    releasesCount: 4,
    status: 'Consolidado',
    category: 'Kernel'
  },
  {
    slug: 'plano-diretor',
    name: 'Plano Diretor Decenal',
    description: 'O Módulo de Desenvolvimento Urbano. Define o zoneamento, restrições construtivas, e planejamento de infraestrutura para os próximos dez anos.',
    version: 'v2022.2',
    docsCount: 3,
    activeIssues: 5,
    activePRs: 1,
    releasesCount: 2,
    status: 'Em vigor - necessita revisão',
    category: 'Desenvolvimento'
  },
  {
    slug: 'codigo-posturas',
    name: 'Código de Posturas Urbanas',
    description: 'Regulamenta o comportamento comercial, uso do passeio público, controle de ruídos, higiene pública municipal e licenciamentos.',
    version: 'v2018.1',
    docsCount: 1,
    activeIssues: 8,
    activePRs: 3,
    releasesCount: 3,
    status: 'Estável - desatualizado em acessibilidade',
    category: 'Cotidiano'
  },
  {
    slug: 'orcamento-anual-loa',
    name: 'LOA (Lei de Orçamento Anual)',
    description: 'O Runtime Orçamentário ativo. Alocação direta da receita do ano fiscal corrente para cada secretaria, fundo, folha, investimento e obra do município.',
    version: 'v2026.1',
    docsCount: 5,
    activeIssues: 2,
    activePRs: 1,
    releasesCount: 1,
    status: 'Execução Ativa (Runtime)',
    category: 'Orçamento'
  },
  {
    slug: 'codigo-tributario',
    name: 'Código Tributário Municipal',
    description: 'Normatiza o IPTU, ISS, taxas municipais, contribuição de melhoria e regras de incentivo fiscal da cidade.',
    version: 'v2021.0',
    docsCount: 2,
    activeIssues: 4,
    activePRs: 0,
    releasesCount: 2,
    status: 'Consolidado',
    category: 'Tributos'
  }
];

export const MOCK_ISSUES: Issue[] = [
  {
    id: '#044',
    title: 'Lei Orgânica não prevê mecanismos de democracia direta digital',
    type: 'Lacuna normativa',
    territory: 'Todo o Município',
    theme: 'Participação Popular',
    description: 'A nossa Lei Orgânica em seu Artigo 12 prevê apenas audiências físicas de fôlego reduzido. Há clara ausência de sustentação de assinaturas digitais certificadas por Gov.br, além de carência de portal para realização de plebiscitos e referendos digitais controlados pelo município.',
    authorName: 'Associação de Defesa Social de Novo Horizonte',
    createdAt: '2026-05-10T12:00:00Z',
    status: 'Vinculada a PR',
    upvotes: 247,
    comments: [
      {
        id: 'ic-1',
        authorName: 'Thiago Neves',
        content: 'Isso ajudará imensamente as comunidades rurais que dependem de condução e perdem um dia inteiro de trabalho para participar nas sessões da câmara.',
        createdAt: '2026-05-11T09:00:00Z'
      },
      {
        id: 'ic-2',
        authorName: 'Patricia Gomes (Procuradora)',
        content: 'Exatamente. Estamos elaborando o parecer jurídico com base no PR #045 da iniciativa popular. É perfeitamente executável respeitando a ADI local.',
        createdAt: '2026-05-14T15:00:00Z'
      }
    ],
    linkedPRId: '#045',
    assignedDepartment: 'Procuradoria Geral do Município',
    relatedArticleId: 'art-12',
    relatedRepository: 'Lei Orgânica'
  },
  {
    id: '#118',
    title: 'Estrada rural sem manutenção na comunidade Campo Grande',
    type: 'Problema público',
    territory: 'Campo Grande',
    theme: 'Infraestrutura Rural',
    description: 'O trecho da estrada vicinal NH-023, que atende a mais de 80 famílias e produtores de morango orgânico da colônia Campo Grande, está intransitável desde as chuvas de março. A prefeitura descumpre a diretriz de escoamento agrícola do Plano Plurianual.',
    authorName: 'Josias Pereira',
    createdAt: '2026-06-01T08:30:00Z',
    status: 'Em triagem',
    upvotes: 189,
    comments: [
      {
        id: 'ic-3',
        authorName: 'Marilda Rodrigues',
        content: 'Os caminhoneiros parceiros estão se recusando a coletar nossa produção de morangos, acarretando perda imediata!',
        createdAt: '2026-06-02T10:15:00Z'
      }
    ],
    assignedDepartment: 'Secretaria de Obras e Serviços Rurais',
    relatedRepository: 'Plano Diretor'
  },
  {
    id: '#119',
    title: 'Inconsistência orçamentária na LDO sobre dotação turística',
    type: 'Inconsistência orçamentária',
    territory: 'Morro Alto',
    theme: 'Finanças Públicas',
    description: 'Foi identificada uma duplicidade flagrante de dotação contábil para o mesmo projeto de ciclovia turística entre as contas da Secretaria de Desenvolvimento Urbano e do Fundo Municipal de Turismo na Lei Orçamentária.',
    authorName: 'Observatório Social de Gastos de Novo Horizonte',
    createdAt: '2026-06-03T11:00:00Z',
    status: 'Em análise técnica',
    upvotes: 95,
    comments: [
      {
        id: 'ic-4',
        authorName: 'Carlos Drummom',
        content: 'Duplo empenho orçamentário público é crime de irresponsabilidade fiscal. Precisamos de revisão orçamentária para retirar esse duto fantasma.',
        createdAt: '2026-06-04T13:40:00Z'
      }
    ],
    assignedDepartment: 'Controladoria Geral do Município',
    relatedRepository: 'orcamento-anual-loa'
  },
  {
    id: '#120',
    title: 'Falta de transparência em contratos de eventos municipais',
    type: 'Pedido de transparência',
    territory: 'Centro Histórico',
    theme: 'Compliance e Gestão',
    description: 'Os valores pagos a artistas contratados para o aniversário da cidade não foram detalhados por CPF/CNPJ de intermediários nas notas de rodapé institucionais do Portal da Transparência, impedindo apuração de superfaturamento.',
    authorName: 'Letícia Barbosa de Lima',
    createdAt: '2026-06-05T14:20:00Z',
    status: 'Aberta',
    upvotes: 122,
    comments: [],
    assignedDepartment: 'Secretaria de Cultura e Governança'
  },
  {
    id: '#121',
    title: 'Ausência de prazo para resposta da Prefeitura a demandas digitais',
    type: 'Sugestão de melhoria',
    territory: 'Todo o Município',
    theme: 'Serviços Públicos Digitais',
    description: 'Propomos a inclusão de um prazo vinculante na Lei Orgânica (Máximo 15 dias corridos) para que as solicitações enviadas através de canais eletrônicos ou canais da Ouvidoria recebam resposta conclusiva do órgão encarregado.',
    authorName: 'Amanda Guedes',
    createdAt: '2026-06-08T09:00:00Z',
    status: 'Em debate',
    upvotes: 110,
    comments: [],
    assignedDepartment: 'Ouvidoria e Controladoria',
    relatedArticleId: 'art-35',
    relatedRepository: 'Lei Orgânica'
  }
];

export const MOCK_PRS: CivicPR[] = [
  {
    id: '#045',
    title: 'Inserir capítulo sobre democracia direta digital',
    repository: 'Lei Orgânica Municipal',
    targetTitle: 'Título II - Dos Direitos e Garantias Fundamentais',
    affectedArticles: 'Artigo 12, inclusão de §1º e §2º',
    authorName: 'Iniciativa Popular Colegiada (NH-Digital)',
    authorType: 'Iniciativa Popular',
    status: 'Em revisão pública',
    citizenSummary: 'Esta proposta estabelece a base legal definitiva para a realização de consultas cívicas em Novo Horizonte de forma puramente digital. Ela regulamenta a segurança, a verificação por assinatura gov.br e força a prefeitura a aceitar assinaturas digitais coletadas em petições normativas populares.',
    justification: 'As ferramentas físicas tradicionais de consulta ao cidadão excluem mais de 70% da população economicamente ativa por barreiras de transporte e horários comerciais engessados. A alteração traz inclusão digital, com segurança de dados garantidos pela LGPD municipal.',
    createdAt: '2026-05-15T10:00:00Z',
    linkedIssueIds: ['#044'],
    upvotes: 412,
    comments: [
      {
        id: 'p-c-1',
        authorName: 'Júlio de Carvalho',
        content: 'Democradia direta é o futuro! Essa emenda recolhe os reais anseios e desburocratiza a participação cidadã formal.',
        createdAt: '2026-05-16T11:00:00Z'
      }
    ],
    diffs: [
      {
        articleNumber: 12,
        titleRef: 'Artigo 12, Da Participação Popular',
        beforeText: 'Art. 12. O Município assegurará a participação da comunidade na formulação e controle das políticas públicas municipais, assegurados os recursos de audiência pública, iniciativa popular de projetos de lei e conselhos paritários.',
        afterText: 'Art. 12. O Município assegurará a participação da comunidade na formulação e controle das políticas públicas municipais, assegurados os recursos de audiência pública, iniciativa popular de projetos de lei e conselhos paritários.\n\n+ §1º O Município estabelecerá portal cívico seguro de democracia direta digital, integrado à Identidade Digital Nacional, permitindo a submissão de propostas, coleta de assinaturas válidas em propostas populares, debates públicos e referendos digitais.\n+ §2º Fica instituído o comitê consultivo misto sociedade civil/tecnologia para avaliar bianualmente a auditabilidade das votações eletrônicas locais.',
        rationale: 'Estender as ferramentas de envolvimento da sociedade civil para canais digitais públicos confiáveis.',
        lines: [
          { type: 'neutral', content: 'Art. 12. O Município assegurará a participação da comunidade na formulação e controle das políticas públicas municipais, assegurados os recursos de audiência pública, iniciativa popular de projetos de lei e conselhos paritários.' },
          { type: 'added', content: ' ' },
          { type: 'added', content: '+ §1º O Município estabelecerá portal cívico seguro de democracia direta digital, integrado à Identidade Digital Nacional, permitindo a submissão de propostas, coleta de assinaturas válidas em propostas populares, debates públicos e referendos digitais.' },
          { type: 'added', content: '+ §2º Fica instituído o comitê consultivo misto sociedade civil/tecnologia para avaliar bianualmente a auditabilidade das votações eletrônicas locais de participação.' }
        ]
      }
    ],
    reviews: [
      {
        id: 'r-1',
        reviewerName: 'Comissão Especial de Inovação de Novo Horizonte',
        reviewerRole: 'Revisão Técnica',
        status: 'Aprovado',
        conclusion: 'O portal cívico proposto utiliza criptografia ponta a ponta e integração OAuth GOV.BR oficial, que não onera o orçamento estrutural por usar APIs públicas disponíveis gratuitamente.',
        feedback: 'Viável tecnicamente.',
        createdAt: '2026-05-20T10:00:00Z'
      },
      {
        id: 'r-2',
        reviewerName: 'Dra. Patrícia Gomes (Procuradora-Chefe)',
        reviewerRole: 'Revisão Jurídica',
        status: 'Aprovado com ressalvas',
        conclusion: 'A proposta respeita a Lei de Diretrizes Federais e a autonomia do art. 30, CF/88. Contudo, recomenda-se adicionar parágrafo prevendo que o portal digital não exclua as audiências físicas obrigatórias de lei federal para dar ampla garantia de isonomia ao hipossuficiente sem internet.',
        feedback: 'Controle de isonomia requerido.',
        createdAt: '2026-05-25T14:00:00Z'
      }
    ],
    checks: [
      { id: 'chk-1', name: 'Compatibilidade com Constituição Federal', description: 'Garante que os direitos municipais propostos não ferem a carta magna nacional de 1988.', status: 'Aprovado', feedback: 'Perfeita sintonia com o direito fundamental de participação constitucional.' },
      { id: 'chk-2', name: 'Compatibilidade com Constituição Estadual', description: 'Evita leis incompatíveis com a carta do estado de São Paulo.', status: 'Aprovado', feedback: 'Livre de óbices estaduais.' },
      { id: 'chk-3', name: 'Competência municipal', description: 'Valida se o tema é de peculiar interesse do município ou se invade competências federais (como telecom ou penal).', status: 'Aprovado', feedback: 'Participação cívica regulatória é exclusiva autonomia territorial do município.' },
      { id: 'chk-4', name: 'Impacto orçamentário', description: 'Verifica necessidade de remanejamento ou novas fontes para contratação e manutenção de servidores públicos.', status: 'Atenção', feedback: 'Necessita do rito de dotação contábil do Fundo de Inovação Municipal. Custos mínimos.' },
      { id: 'chk-5', name: 'Proteção de dados pessoais', description: 'Análise de integridade de acordo com a LGPD e sigilo eleitoral nos registros locais.', status: 'Aprovado', feedback: 'Dados não serão expostos, voto restrito à auditoria de hash.' },
      { id: 'chk-6', name: 'Necessidade de quórum qualificado', description: 'Esta emenda à Lei Orgânica requer 2/3 de aprovação legislativa parlamentar em dois turnos.', status: 'Atenção', feedback: 'Ao encaminhar para a Câmara, exige-se rito de quórum qualificado de Emenda Orgânica.' }
    ],
    votingId: 'vote-045',
    mergeTimeline: [
      { title: 'Abertura do PR Cívico', date: '15/05/2026', completed: true, description: 'Proposta registrada com assinaturas digitais prévias da campanha popular municipal.' },
      { title: 'Revisão Técnica de Segurança', date: '20/05/2026', completed: true, description: 'Análise de viabilidade pelo departamento de inovação em sistemas públicos.' },
      { title: 'Revisão Jurídica Normativa', date: '25/05/2026', completed: true, description: 'Estudo do texto pela Procuradoria para validação de competências legais.' },
      { title: 'Votação Consultiva Ativa', date: '10/06/2026', completed: false, description: 'Cidadãos residentes se identificam no sistema e votam diretamente pelo provimento da lei.' },
      { title: 'Sessão em Plenário na Câmara', date: 'Pendente', completed: false, description: 'Envio formal à Presidência da Câmara Municipal com apelo de votação nominal com base na consulta digital.' },
      { title: 'Merge Institucional (Consolidação)', date: 'Pendente', completed: false, description: 'Promulgação de emenda à Lei Orgânica e incorporação ao Branch Principal do texto legal.' }
    ]
  },
  {
    id: '#046',
    title: 'Criar obrigação de orçamento participativo anual',
    repository: 'Lei Orgânica Municipal',
    targetTitle: 'Título IV: Do Orçamento Municipal',
    affectedArticles: 'Artigo 88, acréscimos parágrafo único',
    authorName: 'Movimento Luta por Habitação e Infraestrutura Pública',
    authorType: 'Mandato Coletivo',
    status: 'Em votação',
    citizenSummary: 'Torna obrigatório por lei que no mínimo 5% de toda a verba anual para obras e investimentos municipais seja decidida de modo direto nas plenárias orçamentárias nos distritos da cidade, inclusive por aplicativo oficial.',
    justification: 'Atualmente a indicação de bairros depende de favores de vereadores específicos (emendas de bancada). O orçamento deve ser distribuído de forma justa e transparente diretamente pelos moradores do território.',
    createdAt: '2026-05-20T11:00:00Z',
    linkedIssueIds: [],
    upvotes: 380,
    comments: [],
    diffs: [
      {
        articleNumber: 88,
        titleRef: 'Artigo 88, Dos Instrumentos Orçamentários',
        beforeText: 'Art. 88. O Plano Plurianual (PPA), as Diretrizes Orçamentárias (LDO) e o Orçamento Anual (LOA) serão elaborados anualmente e submetidos à apreciação legislativa com mecanismos obrigatórios de consulta participativa nos bairros.',
        afterText: 'Art. 88. O Plano Plurianual (PPA), as Diretrizes Orçamentárias (LDO) e o Orçamento Anual (LOA) serão elaborados anualmente e submetidos à apreciação legislativa com mecanismos obrigatórios de consulta participativa nos bairros.\n\n+ Parágrafo único. Dos montantes destinados a investimentos de infraestrutura e serviços públicos diretos, um percentual mínimo de 5% (cinco por cento) será integralmente submetido e executado de acordo com as deliberações populares coletadas via orçamento participativo por subprefeitura municipal.',
        rationale: 'Estipular percentual orçamentário vinculante para governança popular efetiva de recursos municipais.',
        lines: [
          { type: 'neutral', content: 'Art. 88. O Plano Plurianual (PPA), as Diretrizes Orçamentárias (LDO) e o Orçamento Anual (LOA) serão elaborados anualmente...' },
          { type: 'added', content: '+ Parágrafo único. Dos montantes destinados a investimentos de infraestrutura e serviços públicos diretos, um percentual mínimo de 5% (cinco por cento) será integralmente submetido e executado de acordo com as deliberações populares coletadas via orçamento participativo por subprefeitura municipal.' }
        ]
      }
    ],
    reviews: [
      {
        id: 'r-3',
        reviewerName: 'Secretaria Municipal de Finanças e Tesouro',
        reviewerRole: 'Revisão Orçamentária',
        status: 'Aprovado com ressalvas',
        conclusion: 'O teto de 5% de investimentos livres cabe na consolidação técnica corrente, mas demanda que a LDO fixe critérios de exclusão de verba carimbada de educação e saúde federais (que são inacessíveis para remanejamento popular).',
        feedback: 'Critérios federais intangíveis alertados.',
        createdAt: '2026-05-28T16:00:00Z'
      }
    ],
    checks: [
      { id: 'chk-a1', name: 'Compatibilidade Constitucional', description: 'Validação orçamentária geral', status: 'Aprovado', feedback: 'O STF já validou a instituição de orçamentos participativos obrigatórios em competências locais.' },
      { id: 'chk-a2', name: 'Necessidade de fonte de custeio', description: 'Análise de custos operacionais das plenárias', status: 'Aprovado', feedback: 'Custeio inserido na dotação corrente de modernização legislativa da câmara e prefeitura.' }
    ],
    votingId: 'vote-046',
    mergeTimeline: [
      { title: 'Abertura do PR', date: '20/05/2026', completed: true, description: 'Lançamento de emenda na plataforma.' },
      { title: 'Reviews de Finanças', date: '28/05/2026', completed: true, description: 'Aprovação condicionada com salvaguarda das contas de saúde e educação.' },
      { title: 'Votação Ativada', date: '01/06/2026', completed: true, description: 'Iniciada votação popular global na cidade de Novo Horizonte.' }
    ]
  },
  {
    id: '#047',
    title: 'Limitar repasses para shows e eventos com recursos das pastas básicas',
    repository: 'Lei Orgânica Municipal',
    targetTitle: 'Título IV: Do Orçamento Municipal',
    affectedArticles: 'Artigo 89, adição de parágrafo explicativo',
    authorName: 'Vereador Kleber Antunes',
    authorType: 'Vereador',
    status: 'Aberto para debate',
    citizenSummary: 'Proíbe terminantemente o uso de dinheiro da saúde, educação ou segurança para bancar shows, festas e feiras agropecuárias do município, mesmo que em caráter comemorativo nacional.',
    justification: 'Muitas prefeituras retiram recursos de verbas importantes de manutenção de postos de saúde de bairros humildes para pagar shows milionários de sertanejos. Essa emenda garante a blindagem orçamentária.',
    createdAt: '2026-06-02T15:00:00Z',
    linkedIssueIds: ['#120'],
    upvotes: 215,
    comments: [],
    diffs: [],
    reviews: [],
    checks: [
      { id: 'chk-b1', name: 'Análise de Constitucionalidade', description: 'Validação técnica', status: 'Aprovado', feedback: 'Inviolável sob aspecto de moralidade administrativa municipal.' }
    ],
    mergeTimeline: []
  },
  {
    id: '#048',
    title: 'Instituir prazo máximo para resposta a chamados de iluminação pública',
    repository: 'Regimento Interno da Câmara',
    targetTitle: 'Código de Posturas Urbanas',
    affectedArticles: 'Artigo 42-A, Código de Posturas',
    authorName: 'Moradores Unidos do Morro Alto',
    authorType: 'Iniciativa Popular',
    status: 'Incorporado ao texto oficial',
    citizenSummary: 'Fixa o prazo de 48 horas como teto para que a concessionária contratada pela prefeitura realize a troca de lâmpadas queimadas nos postes de luz de ruas residenciais e praças públicas.',
    justification: 'A escuridão favorece a criminalidade local e assusta os estudantes no período de retorno noturno das faculdades parceiras.',
    createdAt: '2026-01-10T10:00:00Z',
    linkedIssueIds: [],
    upvotes: 490,
    comments: [],
    diffs: [],
    reviews: [],
    checks: [],
    mergeTimeline: []
  },
  {
    id: '#049',
    title: 'Instituir política municipal de dados abertos digitais',
    repository: 'Lei Orgânica Municipal',
    targetTitle: 'Título III: Da Organização Administrativa',
    affectedArticles: 'Artigo 35, inclusão de §1º',
    authorName: 'Dra. Luiza de Rossi (Controladoria)',
    authorType: 'Técnico',
    status: 'Aprovado formalmente',
    citizenSummary: 'Determina que todos os dados do Portal Transparência sejam oferecidos em formatos livres abertos e processáveis por máquinas (CSV, JSON, XML e APIs públicas) de forma estruturada e permanente.',
    justification: 'Para incentivar startups de jornalismo local, vigilância fiscal privada de ongs e cidadãos que desejem analisar despesas públicas sem depender do PDF visual.',
    createdAt: '2026-04-18T09:00:00Z',
    linkedIssueIds: [],
    upvotes: 185,
    comments: [],
    diffs: [],
    reviews: [],
    checks: [],
    mergeTimeline: []
  }
];

export const MOCK_VOTACOES: Voting[] = [
  {
    id: 'vote-045',
    title: 'Consultas Populares Digitais na Lei Orgânica (PR #045)',
    citizenSummary: 'Cria uma base segura por lei para que o cidadão possa apoiar emendas diretamente pelo aplicativo, reduzindo a burocracia física e garantindo plebiscitos online transparentes.',
    textChanges: '+ §1º e §2º ao Artigo 12 da Lei Orgânica das Diretrizes de Democracia Participativa.',
    intendedImpact: 'Habilitar participação direta online vinculante a todas as pessoas de Novo Horizonte. A prefeitura estimará o Portal da Democracia em até 180 dias de forma auditável e gratuita.',
    pros: [
      'Garante que comunidades afastadas ou rurais possam votar e dar opiniões legítimas sobre leis da câmara sem deslocamento físico.',
      'Usa autenticação oficial Gov.br contra fraudes civis ou perfis clonados.',
      'Reduz custos de papel, impressão de abaixo-assinados e facilita as consultas orçamentárias frequentes.'
    ],
    cons: [
      'Fossete digital: cidadãos da terceira idade ou sem telefone celular estável necessitarão de postos públicos presenciais de apoio para não sofrerem de exclusão.',
      'Custos iniciais de infraestrutura de nuvem segura do município.',
      'Se o sistema Gov.br estiver fora do ar, paralisa a coleta temporária.'
    ],
    reviewsOverview: 'Aprovado formalmente pela Secretária de Inovação e Tecnologia. Aprovado com cautelas processuais (postos integrados em Cras/Postos de Saúde para o hipossuficiente digital) pela Procuradoria Geral.',
    deadline: '2026-06-30T23:59:00Z',
    quorumNeeded: 5000,
    quorumReached: 3840,
    votesYes: 3410,
    votesNo: 320,
    votesAbstain: 110,
    status: 'Aberta',
    hasVoted: false
  },
  {
    id: 'vote-046',
    title: 'Orçamento Participativo Obrigatório de 5% (PR #046)',
    citizenSummary: 'Obriga a destinação de no mínimo 5% dos fundos de obras municipais diretamente para as escolhas indicadas coletivamente nas plenárias públicas de cada subprefeitura.',
    textChanges: '+ Parágrafo Único ao Artigo 88 que rege o Orçamento Participativo Municipal.',
    intendedImpact: 'Colocar o controle de fomento de praças, asfalto localizado de bairros secundários e quadras esportivas diretamente na mão das associações de moradores, sem necessidade de benfeitorias políticas exclusivas de mandatários.',
    pros: [
      'Evita favorecimento de bairros apenas por laços de vereadores com a base do governo.',
      'Valorização e empoderamento das associações de moradores locais para eleição das obras prioritárias por bairro.',
      'Processo transparente, rastreável e auditável de ponta a ponta.'
    ],
    cons: [
      'Limitação de grandes obras estruturantes caso todo o bolo seja subdividido demais em pequenas causas locais.',
      'Falta de comitê técnico comunitário pode gerar eleição de obras muito complexas e de difícil licenciamento ambiental pelas lideranças.'
    ],
    reviewsOverview: 'Recomendação técnica para resguardar recursos fixos contábeis nacionais de saúde e educação exclusiva (comprados em subvenção).',
    deadline: '2026-06-20T18:00:00Z',
    quorumNeeded: 5000,
    quorumReached: 5120,
    votesYes: 4520,
    votesNo: 480,
    votesAbstain: 120,
    status: 'Aberta',
    hasVoted: true,
    userVoteSelection: 'Aprovo',
    voteReceipt: 'CP-2026-8K29-ZP41'
  }
];

export const MOCK_RELEASES: Release[] = [
  {
    id: 'v2026.0',
    title: 'Release Legislativa v2026.0',
    date: '2026-01-10',
    repositoryName: 'Lei Orgânica Municipal',
    changelog: [
      'Incorporada Emenda Orgânica nº 24/2025 para modernização de governança climática local.',
      'Atualizado artigo de proteção a bacias hidrográficas rurais.',
      'Renomeada seção de saneamento básico devido ao novo marco regulatório estadual.'
    ],
    incorporatedPRIds: ['#031', '#034'],
    affectedArticlesCount: 3,
    officialDocumentUrl: 'Diário Oficial Eletrônico - Edição 2432-A',
    promulgatedBy: 'Mesa Diretora da Câmara Municipal de Novo Horizonte'
  },
  {
    id: 'v2024.1',
    title: 'Release Legislativa v2024.1',
    date: '2024-12-12',
    repositoryName: 'Lei Orgânica Municipal',
    changelog: [
      'Incorporada Emenda nº 03/2024 (Artigo 12 / Diretriz de Participação Popular em Audiências Públicas Coletivas).',
      'Correção gramatical de artigo redundante no regimento de controle administrativo.'
    ],
    incorporatedPRIds: ['#022'],
    affectedArticlesCount: 1,
    officialDocumentUrl: 'Diário Oficial - Edição 2090',
    promulgatedBy: 'Prefeito Municipal e Mesa Diretora Cívica'
  }
];

export const MOCK_FISCALIZACOES: ExecutionTracker[] = [
  {
    id: 'f-1',
    title: 'Troca de Luminárias Queimadas em 48h (PR #048)',
    originalPRId: '#048',
    normReference: 'Artigo 42-A, Código de Posturas Urbanas',
    responsibleDepartment: 'Secretaria de Serviços Municipais e Concessionária de Iluminação SP-Luz',
    deadline: 'Cumprimento Contínuo (Vigente)',
    status: 'Em execução',
    progressPercentage: 88,
    budgetAllocated: 'R$ 450.000,00 (anual de fiscalização e app)',
    budgetSpent: 'R$ 180.000,00',
    evidence: [
      { title: 'Painel Público Georreferenciado', date: '01/05/2026', url: 'https://painel.novohorizonte.sp.gov.br/luz' },
      { title: 'Contrato aditivo de metas assinado', date: '12/03/2026', url: 'https://transparencia.novohorizonte.gov/contrato-119' }
    ],
    updates: [
      {
        id: 'fu-1',
        date: '2026-06-01',
        title: 'Balanço Geral de Chamados do Mês de Maio',
        description: 'Foram abertos 542 chamados na plataforma. Foram solucionados 481 dentro das 48 horas estabelecidas em lei (88.7% de conformidade operacional das equipes da concessionária SP-Luz).',
        category: 'Fiscalização Social'
      },
      {
        id: 'fu-2',
        date: '2026-04-15',
        title: 'Aplicação de Notificação Administrativa de Advertência',
        description: 'A prefeitura emitiu documento notificando a concessionária devido a falhas recorrentes no tempo de troca de reatores no bairro Campo Grande. Prazo regulado em lei reestabelecido.',
        category: 'Ofício'
      }
    ]
  },
  {
    id: 'f-2',
    title: 'Implantação Política Municipal Infraestrutura de Dados Abertos (PR #049)',
    originalPRId: '#049',
    normReference: 'Artigo 35, §1º da Lei Orgânica',
    responsibleDepartment: 'Subdepartamento de Tecnologia da Informação e Controladoria Geral',
    deadline: '31/12/2026',
    status: 'Em regulamentação',
    progressPercentage: 45,
    budgetAllocated: 'R$ 120.000,00 (migração legada para API)',
    budgetSpent: 'R$ 40.000,00',
    evidence: [
      { title: 'Plano Diretor de Tecnologia consolidado', date: '10/05/2026', url: 'https://portalti.gov.br/plano-novo-horizonte' }
    ],
    updates: [
      {
        id: 'fu-3',
        date: '2026-05-10',
        title: 'Publicação do Termo de Referência Técnica para a API de Despesas',
        description: 'Liberação de minutas das especificações Swagger/OpenAPI no fórum de tecnologias civis públicas para sugestões de desenvolvedores locais antes do fechamento de licitação.',
        category: 'Diário Oficial'
      }
    ]
  }
];

export const MOCK_NOTIFICACOES = [
  { id: 'n-1', prId: '#045', title: 'Novo parecer jurídico adicionado pelo Procurador no PR #045', date: 'Hoje às 10:12', unread: true },
  { id: 'n-2', prId: '#046', title: 'O PR #046 (Orçamento participativo) está em fase de votação popular ativa!', date: 'Ontem', unread: true },
  { id: 'n-3', prId: '#048', title: 'O relatório mensal de conformidade da iluminação foi publicado.', date: '3 dias atrás', unread: false }
];

export const MOCK_MEB = {
  name: 'Dionatan Santos',
  email: 'dionatan.pmb@gmail.com',
  territoryId: 'campo-grande',
  registeredAt: '2025-01-12',
  citizenId: 'CP-CITIZEN-938217',
  createdIssues: [
    { id: '#118', title: 'Estrada rural sem manutenção na comunidade Campo Grande', status: 'Em triagem' }
  ],
  votedList: [
    { id: 'vote-046', selection: 'Aprovo', receipt: 'CP-2026-8K29-ZP41', txHash: '0x8f2a938cdd9810bb' }
  ],
  supportedPRs: ['#045']
};

export const MOCK_ESTATISTICAS = {
  totalCitizens: 14238,
  organicLawArticles: 128,
  openIssuesCount: 42,
  prsInReviewCount: 16,
  activeVotingsCount: 1,
  releasesCount: 4,
  civicParticipationRate: '75.2%',
  reviewsPending: 3,
  timeToConsolidationDays: '14 dias'
};
