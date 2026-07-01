-- Migration 021: ranking persistido do Orçamento Participativo.
-- Quando uma votação OP é encerrada, o resultado é persistido como item de
-- ranking do ciclo/território. A posição é calculada por aprovação decrescente.
-- O status evolui conforme a execução (Computado → Em execução → Concluído/Frustrado).

CREATE TABLE op_ranking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE,
  cycle_id UUID NOT NULL REFERENCES op_cycles(id) ON DELETE CASCADE,
  territory_id UUID NOT NULL REFERENCES territories(id) ON DELETE RESTRICT,
  proposal_id UUID NOT NULL REFERENCES budget_proposals(id) ON DELETE CASCADE,
  voting_id UUID NOT NULL REFERENCES op_votings(id) ON DELETE CASCADE,
  proposal_title TEXT NOT NULL,
  territory_name TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  votes_yes INTEGER NOT NULL DEFAULT 0,
  votes_no INTEGER NOT NULL DEFAULT 0,
  votes_abstain INTEGER NOT NULL DEFAULT 0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  approval_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  quorum_reached BOOLEAN NOT NULL DEFAULT FALSE,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'Computado'
    CHECK (status IN (
      'Computado',
      'Incluído na matriz',
      'Em execução',
      'Concluído',
      'Frustrado'
    )),
  frustration_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (voting_id)
);

CREATE INDEX idx_op_ranking_items_public_id ON op_ranking_items(public_id);
CREATE INDEX idx_op_ranking_items_cycle_id ON op_ranking_items(cycle_id);
CREATE INDEX idx_op_ranking_items_territory_id ON op_ranking_items(territory_id);
CREATE INDEX idx_op_ranking_items_position ON op_ranking_items(cycle_id, territory_id, position);
CREATE INDEX idx_op_ranking_items_status ON op_ranking_items(status);

CREATE TRIGGER set_updated_at_op_ranking_items
BEFORE UPDATE ON op_ranking_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE op_ranking_items IS 'Ranking persistido: resultado da votação territorial, ordenado por aprovação.';
COMMENT ON COLUMN op_ranking_items.position IS 'Posição no ranking do território naquele ciclo (1 = mais votado).';
COMMENT ON COLUMN op_ranking_items.approval_pct IS 'Percentual de aprovação: votesYes / (votesYes + votesNo) * 100.';
