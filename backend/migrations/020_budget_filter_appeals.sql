-- Migration 020: recurso territorial contra filtro do circuit breaker.
-- O filtro não pode ser uma porta fechada sem contraditório: moradores do
-- território podem contestar a aplicação do circuit breaker e registrar por que
-- a demanda deveria voltar à esteira.

CREATE TABLE budget_filter_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE,
  filter_id UUID NOT NULL REFERENCES budget_filters(id) ON DELETE CASCADE,
  territory_id UUID NOT NULL REFERENCES territories(id) ON DELETE RESTRICT,
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  citizen_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aberto'
    CHECK (status IN ('Aberto', 'Deferido', 'Indeferido', 'Cancelado')),
  decided_by UUID REFERENCES citizens(id) ON DELETE SET NULL,
  decision_reason TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_budget_filter_one_open_appeal
  ON budget_filter_appeals (filter_id)
  WHERE status = 'Aberto';

CREATE INDEX idx_budget_filter_appeals_filter ON budget_filter_appeals(filter_id);
CREATE INDEX idx_budget_filter_appeals_territory ON budget_filter_appeals(territory_id);
CREATE INDEX idx_budget_filter_appeals_status ON budget_filter_appeals(status);

CREATE TRIGGER set_updated_at_budget_filter_appeals
BEFORE UPDATE ON budget_filter_appeals
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE budget_filter_appeals IS
  'Recurso territorial contra aplicação do circuit breaker do OP.';
