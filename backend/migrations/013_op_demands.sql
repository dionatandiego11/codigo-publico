-- Migration 013: demandas simples do Orçamento Participativo.
-- A demanda é a entrada mínima da esteira: problema territorial simples,
-- apoiável, comentável e auditável. Ela ainda não é proposta, projeto nem item
-- institucionalizado.

CREATE TABLE budget_demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE,
  cycle_id UUID NOT NULL REFERENCES op_cycles(id) ON DELETE CASCADE,
  territory_id UUID NOT NULL REFERENCES territories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  author_citizen_id UUID REFERENCES citizens(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Recebida'
    CHECK (status IN (
      'Recebida',
      'Engajamento inicial',
      'Precisa de informações',
      'Agrupada',
      'Maturação territorial',
      'Validada territorialmente',
      'Apta para priorização',
      'Incluída na matriz orçamentária',
      'Em execução',
      'Concluída',
      'Dormente',
      'Arquivada'
    )),
  supports_count INTEGER NOT NULL DEFAULT 0 CHECK (supports_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE budget_demand_supports (
  demand_id UUID NOT NULL REFERENCES budget_demands(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (demand_id, citizen_id)
);

CREATE TABLE budget_demand_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES budget_demands(id) ON DELETE CASCADE,
  citizen_id UUID REFERENCES citizens(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budget_demands_public_id ON budget_demands(public_id);
CREATE INDEX idx_budget_demands_cycle_id ON budget_demands(cycle_id);
CREATE INDEX idx_budget_demands_territory_id ON budget_demands(territory_id);
CREATE INDEX idx_budget_demands_status ON budget_demands(status);
CREATE INDEX idx_budget_demands_created_at ON budget_demands(created_at);
CREATE INDEX idx_budget_demand_comments_demand_id ON budget_demand_comments(demand_id);

CREATE TRIGGER set_updated_at_budget_demands
BEFORE UPDATE ON budget_demands
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
