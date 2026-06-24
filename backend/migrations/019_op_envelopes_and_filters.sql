-- Migration 019: sub-envelopes territoriais e registro dos filtros do circuit breaker.
-- O envelope deixa de ser apenas número municipal: cada ciclo passa a ter uma
-- divisão territorial congelada, usada para aferir custo das propostas. Quando o
-- circuit breaker barra uma proposta, o filtro vira registro operacional público
-- auditável, com caminho de retorno para a esteira.

CREATE TABLE op_territory_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES op_cycles(id) ON DELETE CASCADE,
  territory_id UUID NOT NULL REFERENCES territories(id) ON DELETE RESTRICT,
  carencia_weight BIGINT NOT NULL DEFAULT 0 CHECK (carencia_weight >= 0),
  equal_cents BIGINT NOT NULL DEFAULT 0 CHECK (equal_cents >= 0),
  carencia_cents BIGINT NOT NULL DEFAULT 0 CHECK (carencia_cents >= 0),
  total_cents BIGINT NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cycle_id, territory_id),
  CHECK (total_cents = equal_cents + carencia_cents)
);

CREATE INDEX idx_op_territory_envelopes_cycle ON op_territory_envelopes(cycle_id);
CREATE INDEX idx_op_territory_envelopes_territory ON op_territory_envelopes(territory_id);

CREATE TRIGGER set_updated_at_op_territory_envelopes
BEFORE UPDATE ON op_territory_envelopes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE op_territory_envelopes IS
  'Sub-envelope territorial congelado por ciclo do OP: piso igual + parcela de carencia.';

CREATE TABLE budget_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE,
  cycle_id UUID NOT NULL REFERENCES op_cycles(id) ON DELETE CASCADE,
  territory_id UUID NOT NULL REFERENCES territories(id) ON DELETE RESTRICT,
  demand_id UUID REFERENCES budget_demands(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES budget_proposals(id) ON DELETE SET NULL,
  verdict TEXT NOT NULL CHECK (verdict IN (
    'inconstitucional',
    'fora_da_competencia',
    'depende_de_outro_ente',
    'excede_envelope'
  )),
  message TEXT NOT NULL,
  return_path TEXT NOT NULL,
  estimated_cost_cents BIGINT NOT NULL DEFAULT 0 CHECK (estimated_cost_cents >= 0),
  available_cents BIGINT NOT NULL DEFAULT 0 CHECK (available_cents >= 0),
  actor_citizen_id UUID REFERENCES citizens(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Registrado'
    CHECK (status IN ('Registrado', 'Em recurso', 'Reformulado', 'Superado')),
  appeal_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budget_filters_cycle ON budget_filters(cycle_id);
CREATE INDEX idx_budget_filters_territory ON budget_filters(territory_id);
CREATE INDEX idx_budget_filters_demand ON budget_filters(demand_id);
CREATE INDEX idx_budget_filters_verdict ON budget_filters(verdict);

CREATE TRIGGER set_updated_at_budget_filters
BEFORE UPDATE ON budget_filters
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE budget_filters IS
  'Registro operacional do circuit breaker juridico-orcamentario do OP, com fundamento e caminho de retorno.';
