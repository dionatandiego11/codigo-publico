-- Escrita cívica autenticada.
-- Comentários e apoios ficam associados ao cidadão, sem expor CPF.

ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS author_citizen_id UUID REFERENCES citizens(id) ON DELETE SET NULL;

ALTER TABLE civic_prs
  ADD COLUMN IF NOT EXISTS author_citizen_id UUID REFERENCES citizens(id) ON DELETE SET NULL;

CREATE TABLE issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  citizen_id UUID REFERENCES citizens(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE issue_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (issue_id, citizen_id)
);

CREATE TABLE pr_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  civic_pr_id UUID NOT NULL REFERENCES civic_prs(id) ON DELETE CASCADE,
  citizen_id UUID REFERENCES citizens(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pr_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  civic_pr_id UUID NOT NULL REFERENCES civic_prs(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (civic_pr_id, citizen_id)
);

CREATE INDEX idx_issues_author_citizen_id ON issues(author_citizen_id);
CREATE INDEX idx_civic_prs_author_citizen_id ON civic_prs(author_citizen_id);
CREATE INDEX idx_issue_comments_issue_id ON issue_comments(issue_id);
CREATE INDEX idx_issue_comments_citizen_id ON issue_comments(citizen_id);
CREATE INDEX idx_issue_upvotes_citizen_id ON issue_upvotes(citizen_id);
CREATE INDEX idx_pr_comments_civic_pr_id ON pr_comments(civic_pr_id);
CREATE INDEX idx_pr_comments_citizen_id ON pr_comments(citizen_id);
CREATE INDEX idx_pr_upvotes_citizen_id ON pr_upvotes(citizen_id);

CREATE TRIGGER set_updated_at_issue_comments
BEFORE UPDATE ON issue_comments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_pr_comments
BEFORE UPDATE ON pr_comments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
