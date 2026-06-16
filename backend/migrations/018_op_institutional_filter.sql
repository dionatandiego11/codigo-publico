-- Migration 018: filtro institucional e incidentes de divergência (PROTOCOLO-OP §8).
-- A decisão do Legislativo sobre uma proposta priorizada pela votação popular se
-- divide em dois atos: admissibilidade (fundamento formal → retorno) e veto
-- político (fora da lista → INCIDENTE PÚBLICO). O incidente é o registro
-- imutável de que a Câmara derrubou o que o povo aprovou — e por quê.

CREATE TABLE op_divergence_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE,
  proposal_id UUID NOT NULL REFERENCES budget_proposals(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES op_cycles(id) ON DELETE CASCADE,
  territory_id UUID NOT NULL REFERENCES territories(id) ON DELETE RESTRICT,
  -- registro do que foi derrubado e por quem
  proposal_title TEXT NOT NULL,
  reason TEXT NOT NULL,
  decided_by UUID REFERENCES citizens(id) ON DELETE SET NULL,
  decided_by_name TEXT NOT NULL,
  decided_by_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_op_incidents_proposal ON op_divergence_incidents(proposal_id);
CREATE INDEX idx_op_incidents_cycle ON op_divergence_incidents(cycle_id);

-- Um veto político por proposta (o incidente registra a derrubada definitiva).
CREATE UNIQUE INDEX uq_op_incident_per_proposal ON op_divergence_incidents(proposal_id);

COMMENT ON TABLE op_divergence_incidents IS
  'Registro público e imutável de veto político do Legislativo sobre proposta aprovada pelo povo (PROTOCOLO-OP §8).';
