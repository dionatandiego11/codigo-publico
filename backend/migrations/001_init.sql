-- Código Público - primeira versão do schema.
-- Esta migration cria apenas a estrutura de dados. Entidades de aplicação,
-- endpoints e autenticação serão implementados em etapas futuras.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  zone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE law_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  chapter TEXT NOT NULL,
  section TEXT,
  content TEXT NOT NULL,
  citizen_explanation TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1.0.0',
  last_updated DATE,
  amendment_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  territory_id UUID REFERENCES territories(id) ON DELETE SET NULL,
  territory_name TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT NOT NULL,
  author_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aberta',
  upvotes INTEGER NOT NULL DEFAULT 0 CHECK (upvotes >= 0),
  assigned_department TEXT,
  related_article_id UUID REFERENCES law_articles(id) ON DELETE SET NULL,
  related_repository TEXT,
  linked_pr_public_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE civic_prs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  repository TEXT NOT NULL,
  target_title TEXT NOT NULL,
  affected_articles TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aberto para debate',
  citizen_summary TEXT NOT NULL,
  justification TEXT NOT NULL,
  linked_issue_public_ids TEXT[] NOT NULL DEFAULT '{}',
  upvotes INTEGER NOT NULL DEFAULT 0 CHECK (upvotes >= 0),
  voting_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE normative_diffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  civic_pr_id UUID NOT NULL REFERENCES civic_prs(id) ON DELETE CASCADE,
  article_id UUID REFERENCES law_articles(id) ON DELETE SET NULL,
  article_number INTEGER NOT NULL,
  title_ref TEXT NOT NULL,
  before_text TEXT NOT NULL,
  after_text TEXT NOT NULL,
  rationale TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (civic_pr_id, article_number, sort_order)
);

CREATE TABLE normative_diff_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normative_diff_id UUID NOT NULL REFERENCES normative_diffs(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  line_type TEXT NOT NULL CHECK (line_type IN ('added', 'removed', 'neutral')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (normative_diff_id, line_number)
);

CREATE TABLE pr_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  civic_pr_id UUID NOT NULL REFERENCES civic_prs(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente',
  conclusion TEXT NOT NULL,
  feedback TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE institutional_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  civic_pr_id UUID NOT NULL REFERENCES civic_prs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente',
  feedback TEXT NOT NULL DEFAULT '',
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (civic_pr_id, name)
);

CREATE TABLE votings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE,
  civic_pr_id UUID NOT NULL REFERENCES civic_prs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  citizen_summary TEXT NOT NULL,
  text_changes TEXT NOT NULL,
  intended_impact TEXT NOT NULL,
  pros TEXT[] NOT NULL DEFAULT '{}',
  cons TEXT[] NOT NULL DEFAULT '{}',
  reviews_overview TEXT NOT NULL DEFAULT '',
  deadline TIMESTAMPTZ NOT NULL,
  quorum_needed INTEGER NOT NULL DEFAULT 0 CHECK (quorum_needed >= 0),
  quorum_reached INTEGER NOT NULL DEFAULT 0 CHECK (quorum_reached >= 0),
  votes_yes INTEGER NOT NULL DEFAULT 0 CHECK (votes_yes >= 0),
  votes_no INTEGER NOT NULL DEFAULT 0 CHECK (votes_no >= 0),
  votes_abstain INTEGER NOT NULL DEFAULT 0 CHECK (votes_abstain >= 0),
  status TEXT NOT NULL DEFAULT 'Aberta',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE civic_prs
  ADD CONSTRAINT civic_prs_voting_id_fkey
  FOREIGN KEY (voting_id) REFERENCES votings(id) ON DELETE SET NULL;

CREATE TABLE releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  release_date DATE NOT NULL,
  repository_name TEXT NOT NULL,
  changelog TEXT[] NOT NULL DEFAULT '{}',
  incorporated_pr_public_ids TEXT[] NOT NULL DEFAULT '{}',
  affected_articles_count INTEGER NOT NULL DEFAULT 0 CHECK (affected_articles_count >= 0),
  official_document_url TEXT,
  promulgated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE execution_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  original_pr_id UUID REFERENCES civic_prs(id) ON DELETE SET NULL,
  original_pr_public_id TEXT,
  norm_reference TEXT NOT NULL,
  responsible_department TEXT NOT NULL,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'Aguardando regulamentação',
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  budget_allocated NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (budget_allocated >= 0),
  budget_spent NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (budget_spent >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT,
  actor_id UUID,
  actor_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_public_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_issues_public_id ON issues(public_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_type ON issues(type);
CREATE INDEX idx_issues_territory_id ON issues(territory_id);
CREATE INDEX idx_issues_related_article_id ON issues(related_article_id);

CREATE INDEX idx_civic_prs_public_id ON civic_prs(public_id);
CREATE INDEX idx_civic_prs_status ON civic_prs(status);
CREATE INDEX idx_civic_prs_repository ON civic_prs(repository);
CREATE INDEX idx_civic_prs_linked_issue_public_ids ON civic_prs USING GIN(linked_issue_public_ids);

CREATE INDEX idx_normative_diffs_civic_pr_id ON normative_diffs(civic_pr_id);
CREATE INDEX idx_normative_diff_lines_diff_id ON normative_diff_lines(normative_diff_id);
CREATE INDEX idx_pr_reviews_civic_pr_id ON pr_reviews(civic_pr_id);
CREATE INDEX idx_institutional_checks_civic_pr_id ON institutional_checks(civic_pr_id);
CREATE INDEX idx_votings_civic_pr_id ON votings(civic_pr_id);
CREATE INDEX idx_releases_version ON releases(version);
CREATE INDEX idx_execution_trackers_original_pr_id ON execution_trackers(original_pr_id);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at);

CREATE TRIGGER set_updated_at_territories
BEFORE UPDATE ON territories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_law_articles
BEFORE UPDATE ON law_articles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_issues
BEFORE UPDATE ON issues
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_civic_prs
BEFORE UPDATE ON civic_prs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_normative_diffs
BEFORE UPDATE ON normative_diffs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_pr_reviews
BEFORE UPDATE ON pr_reviews
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_institutional_checks
BEFORE UPDATE ON institutional_checks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_votings
BEFORE UPDATE ON votings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_releases
BEFORE UPDATE ON releases
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_execution_trackers
BEFORE UPDATE ON execution_trackers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
