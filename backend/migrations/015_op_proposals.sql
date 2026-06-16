-- Migration 015: propostas do Orçamento Participativo.
-- Proposta é a demanda amadurecida em solução possível, com escopo e estimativa
-- inicial. Ainda não é votação, projeto priorizado nem item institucionalizado.

CREATE TABLE budget_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE,
  cycle_id UUID NOT NULL REFERENCES op_cycles(id) ON DELETE CASCADE,
  demand_id UUID NOT NULL REFERENCES budget_demands(id) ON DELETE RESTRICT,
  territory_id UUID NOT NULL REFERENCES territories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  problem_summary TEXT NOT NULL DEFAULT '',
  solution_scope TEXT NOT NULL,
  estimated_cost_cents BIGINT NOT NULL CHECK (estimated_cost_cents >= 0),
  category TEXT NOT NULL,
  author_citizen_id UUID REFERENCES citizens(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Apta para votação'
    CHECK (status IN (
      'Em elaboração',
      'Apta para votação',
      'Em votação',
      'Priorizada',
      'Incluída na matriz',
      'Retornada para maturação',
      'Arquivada'
    )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (demand_id)
);

CREATE INDEX idx_budget_proposals_public_id ON budget_proposals(public_id);
CREATE INDEX idx_budget_proposals_cycle_id ON budget_proposals(cycle_id);
CREATE INDEX idx_budget_proposals_demand_id ON budget_proposals(demand_id);
CREATE INDEX idx_budget_proposals_territory_id ON budget_proposals(territory_id);
CREATE INDEX idx_budget_proposals_status ON budget_proposals(status);

CREATE TRIGGER set_updated_at_budget_proposals
BEFORE UPDATE ON budget_proposals
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
