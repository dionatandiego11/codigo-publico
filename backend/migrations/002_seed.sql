-- Código Público - seed inicial.
-- Dados mínimos para representar o conceito do protótipo no banco.

INSERT INTO territories (slug, name, zone)
VALUES
  ('centro', 'Centro', 'Zona Urbana'),
  ('zona-rural', 'Zona Rural', 'Zona Rural'),
  ('campo-grande', 'Campo Grande', 'Zona Rural'),
  ('estiva', 'Estiva', 'Zona Rural'),
  ('fangueiros', 'Fangueiros', 'Zona Rural')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  zone = EXCLUDED.zone;

INSERT INTO law_articles (
  article_number,
  title,
  chapter,
  section,
  content,
  citizen_explanation,
  version,
  last_updated,
  amendment_number
)
VALUES
  (
    1,
    'Art. 1º — Organização do Município',
    'Título I — Da Organização do Município',
    NULL,
    'Art. 1º. O Município organiza-se de forma autônoma, observados os princípios da Constituição Federal, da Constituição Estadual e desta Lei Orgânica.',
    'Este artigo define que o município tem autonomia para organizar sua administração e suas regras locais, respeitando as constituições federal e estadual.',
    'v2026.0',
    '2026-06-10',
    NULL
  ),
  (
    12,
    'Art. 12 — Participação Popular',
    'Título II — Dos Direitos e Garantias Fundamentais',
    'Seção I — Da Participação Popular',
    'Art. 12. O Município assegurará a participação da comunidade na formulação e no controle das políticas públicas municipais, por meio de audiências públicas, iniciativa popular e conselhos paritários.',
    'Este artigo garante que a população possa participar das decisões públicas, propor pautas e acompanhar políticas municipais.',
    'v2026.0',
    '2026-06-10',
    NULL
  ),
  (
    45,
    'Art. 45 — Orçamento Municipal',
    'Título IV — Do Orçamento Municipal',
    'Seção I — Das Peças Orçamentárias',
    'Art. 45. O orçamento municipal observará os princípios da publicidade, planejamento, responsabilidade fiscal e participação popular nas etapas de elaboração, execução e fiscalização.',
    'Este artigo afirma que o orçamento da cidade deve ser planejado, transparente, responsável e aberto à participação dos moradores.',
    'v2026.0',
    '2026-06-10',
    NULL
  )
ON CONFLICT (article_number) DO UPDATE SET
  title = EXCLUDED.title,
  chapter = EXCLUDED.chapter,
  section = EXCLUDED.section,
  content = EXCLUDED.content,
  citizen_explanation = EXCLUDED.citizen_explanation,
  version = EXCLUDED.version,
  last_updated = EXCLUDED.last_updated,
  amendment_number = EXCLUDED.amendment_number;

INSERT INTO issues (
  public_id,
  title,
  type,
  territory_id,
  territory_name,
  theme,
  description,
  author_name,
  status,
  upvotes,
  assigned_department,
  related_article_id,
  related_repository,
  linked_pr_public_id
)
VALUES
  (
    '#044',
    'Lei Orgânica não prevê mecanismos de democracia direta digital',
    'Lacuna normativa',
    NULL,
    'Todo o Município',
    'Participação Popular',
    'A Lei Orgânica prevê mecanismos presenciais de participação, mas não estabelece base normativa para consultas digitais, assinaturas eletrônicas e debates públicos online auditáveis.',
    'Associação de Defesa Social de Novo Horizonte',
    'Vinculada a PR',
    247,
    'Procuradoria Geral do Município',
    (SELECT id FROM law_articles WHERE article_number = 12),
    'Lei Orgânica Municipal',
    '#045'
  ),
  (
    '#118',
    'Estrada rural sem manutenção na comunidade Campo Grande',
    'Problema público',
    (SELECT id FROM territories WHERE slug = 'campo-grande'),
    'Campo Grande',
    'Infraestrutura Rural',
    'Trecho de estrada rural utilizado por famílias e produtores locais encontra-se sem manutenção adequada, prejudicando deslocamento, transporte escolar e escoamento da produção.',
    'Josias Pereira',
    'Em triagem',
    189,
    'Secretaria de Obras e Serviços Rurais',
    NULL,
    'Plano Diretor',
    NULL
  ),
  (
    '#119',
    'Divergência de valores na LDO',
    'Inconsistência orçamentária',
    NULL,
    'Todo o Município',
    'Finanças Públicas',
    'Foram identificadas divergências entre valores previstos na LDO e dotações apresentadas em quadros de execução, exigindo revisão técnica e transparência dos dados orçamentários.',
    'Observatório Social de Gastos de Novo Horizonte',
    'Em análise técnica',
    95,
    'Controladoria Geral do Município',
    (SELECT id FROM law_articles WHERE article_number = 45),
    'LDO',
    NULL
  )
ON CONFLICT (public_id) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  territory_id = EXCLUDED.territory_id,
  territory_name = EXCLUDED.territory_name,
  theme = EXCLUDED.theme,
  description = EXCLUDED.description,
  author_name = EXCLUDED.author_name,
  status = EXCLUDED.status,
  upvotes = EXCLUDED.upvotes,
  assigned_department = EXCLUDED.assigned_department,
  related_article_id = EXCLUDED.related_article_id,
  related_repository = EXCLUDED.related_repository,
  linked_pr_public_id = EXCLUDED.linked_pr_public_id;

INSERT INTO civic_prs (
  public_id,
  title,
  repository,
  target_title,
  affected_articles,
  author_name,
  author_type,
  status,
  citizen_summary,
  justification,
  linked_issue_public_ids,
  upvotes
)
VALUES
  (
    '#045',
    'Inserir capítulo sobre democracia direta digital',
    'Lei Orgânica Municipal',
    'Título II — Dos Direitos e Garantias Fundamentais',
    'Artigo 12',
    'Iniciativa Popular Colegiada NH-Digital',
    'Iniciativa Popular',
    'Em revisão pública',
    'Cria base legal para consultas digitais, coleta de assinaturas eletrônicas e debates públicos online no município.',
    'A participação exclusivamente presencial limita o acesso de moradores que trabalham em horário comercial, vivem em áreas rurais ou dependem de deslocamento. A proposta cria fundamento jurídico para participação digital auditável.',
    ARRAY['#044']::text[],
    412
  ),
  (
    '#046',
    'Criar obrigação de orçamento participativo anual',
    'Lei Orgânica Municipal',
    'Título IV — Do Orçamento Municipal',
    'Artigo 45',
    'Movimento por Orçamento Participativo',
    'Mandato Coletivo',
    'Em votação',
    'Torna obrigatória a realização anual de orçamento participativo com participação territorial dos moradores.',
    'A definição de prioridades orçamentárias precisa ser compreensível, territorializada e aberta à deliberação direta da população.',
    ARRAY['#119']::text[],
    380
  ),
  (
    '#047',
    'Limitar despesas com eventos públicos',
    'Lei Orgânica Municipal',
    'Título IV — Do Orçamento Municipal',
    'Artigo 45',
    'Vereador Kleber Antunes',
    'Vereador',
    'Aberto para debate',
    'Estabelece limites e critérios de transparência para gastos com eventos públicos quando houver demandas essenciais pendentes.',
    'A proposta busca proteger recursos destinados a serviços essenciais e ampliar a transparência na contratação de eventos, shows e festividades municipais.',
    ARRAY[]::text[],
    215
  )
ON CONFLICT (public_id) DO UPDATE SET
  title = EXCLUDED.title,
  repository = EXCLUDED.repository,
  target_title = EXCLUDED.target_title,
  affected_articles = EXCLUDED.affected_articles,
  author_name = EXCLUDED.author_name,
  author_type = EXCLUDED.author_type,
  status = EXCLUDED.status,
  citizen_summary = EXCLUDED.citizen_summary,
  justification = EXCLUDED.justification,
  linked_issue_public_ids = EXCLUDED.linked_issue_public_ids,
  upvotes = EXCLUDED.upvotes;

INSERT INTO audit_events (
  actor_type,
  actor_name,
  action,
  entity_type,
  entity_public_id,
  metadata
)
SELECT
  'system',
  'Código Público Seed',
  'seed.initialized',
  'database',
  'v1',
  '{"description": "Seed inicial com territórios, artigos, issues e PRs cívicos."}'::jsonb
WHERE NOT EXISTS (
  SELECT 1
  FROM audit_events
  WHERE action = 'seed.initialized'
    AND entity_type = 'database'
    AND entity_public_id = 'v1'
);
