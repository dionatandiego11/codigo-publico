-- Contratos de domínio entre front-end, API e PostgreSQL.
-- Mantém o banco alinhado aos rótulos públicos usados pela aplicação.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'territories_zone_contract_check') THEN
    ALTER TABLE territories
      ADD CONSTRAINT territories_zone_contract_check
      CHECK (zone IN ('Zona Rural', 'Zona Urbana', 'Zona Especial'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'issues_public_id_contract_check') THEN
    ALTER TABLE issues
      ADD CONSTRAINT issues_public_id_contract_check
      CHECK (public_id ~ '^#[0-9]{3,}$');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'issues_type_contract_check') THEN
    ALTER TABLE issues
      ADD CONSTRAINT issues_type_contract_check
      CHECK (type IN (
        'Problema público',
        'Lacuna normativa',
        'Falha de execução',
        'Inconsistência orçamentária',
        'Sugestão de melhoria',
        'Pedido de transparência'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'issues_status_contract_check') THEN
    ALTER TABLE issues
      ADD CONSTRAINT issues_status_contract_check
      CHECK (status IN (
        'Aberta',
        'Em triagem',
        'Em debate',
        'Vinculada a PR',
        'Em análise técnica',
        'Resolvida',
        'Arquivada'
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'civic_prs_public_id_contract_check') THEN
    ALTER TABLE civic_prs
      ADD CONSTRAINT civic_prs_public_id_contract_check
      CHECK (public_id ~ '^#[0-9]{3,}$');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'civic_prs_author_type_contract_check') THEN
    ALTER TABLE civic_prs
      ADD CONSTRAINT civic_prs_author_type_contract_check
      CHECK (author_type IN (
        'Iniciativa Popular',
        'Técnico',
        'Mandato Coletivo',
        'Vereador'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'civic_prs_status_contract_check') THEN
    ALTER TABLE civic_prs
      ADD CONSTRAINT civic_prs_status_contract_check
      CHECK (status IN (
        'Rascunho',
        'Aberto para debate',
        'Em revisão pública',
        'Em revisão técnica',
        'Em revisão jurídica',
        'Aguardando ajustes',
        'Pronto para votação',
        'Em votação',
        'Aprovado pela consulta pública',
        'Encaminhado à Câmara',
        'Aprovado formalmente',
        'Incorporado ao texto oficial',
        'Rejeitado',
        'Arquivado'
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pr_reviews_reviewer_role_contract_check') THEN
    ALTER TABLE pr_reviews
      ADD CONSTRAINT pr_reviews_reviewer_role_contract_check
      CHECK (reviewer_role IN (
        'Revisão Popular',
        'Revisão Jurídica',
        'Revisão Técnica',
        'Revisão Orçamentária',
        'Controladoria',
        'Comissão Legislativa'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pr_reviews_status_contract_check') THEN
    ALTER TABLE pr_reviews
      ADD CONSTRAINT pr_reviews_status_contract_check
      CHECK (status IN (
        'Pendente',
        'Aprovado',
        'Aprovado com ressalvas',
        'Solicita alterações',
        'Rejeitado'
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'institutional_checks_status_contract_check') THEN
    ALTER TABLE institutional_checks
      ADD CONSTRAINT institutional_checks_status_contract_check
      CHECK (status IN ('Aprovado', 'Atenção', 'Reprovado', 'Pendente'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'votings_public_id_contract_check') THEN
    ALTER TABLE votings
      ADD CONSTRAINT votings_public_id_contract_check
      CHECK (public_id ~ '^vote-[A-Za-z0-9._-]+$');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'votings_status_contract_check') THEN
    ALTER TABLE votings
      ADD CONSTRAINT votings_status_contract_check
      CHECK (status IN ('Aberta', 'Encerrada', 'Cancelada'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'execution_trackers_status_contract_check') THEN
    ALTER TABLE execution_trackers
      ADD CONSTRAINT execution_trackers_status_contract_check
      CHECK (status IN (
        'Aguardando regulamentação',
        'Em regulamentação',
        'Em execução',
        'Parcialmente cumprida',
        'Cumprida',
        'Descumprida',
        'Suspensa judicialmente'
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'citizens_role_contract_check') THEN
    ALTER TABLE citizens
      ADD CONSTRAINT citizens_role_contract_check
      CHECK (role IN (
        'citizen',
        'admin',
        'institutional_admin',
        'legislative_admin',
        'procurador',
        'secretario',
        'vereador',
        'mesa_diretora'
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'releases_version_contract_check') THEN
    ALTER TABLE releases
      ADD CONSTRAINT releases_version_contract_check
      CHECK (version ~ '^v[0-9]{4}\.[0-9]+$');
  END IF;
END $$;
