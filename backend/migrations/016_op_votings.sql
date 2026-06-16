-- Migration 016: votação territorial de propostas do Orçamento Participativo.
-- Uma proposta apta pode abrir uma votação territorial. O voto individual nunca
-- é exposto; apenas agregados públicos e recibo opaco ficam disponíveis.

CREATE TABLE op_votings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT NOT NULL UNIQUE,
  cycle_id UUID NOT NULL REFERENCES op_cycles(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES budget_proposals(id) ON DELETE CASCADE,
  territory_id UUID NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Aberta'
    CHECK (status IN ('Aberta', 'Encerrada', 'Cancelada')),
  deadline TIMESTAMPTZ NOT NULL,
  quorum_needed INTEGER NOT NULL DEFAULT 1 CHECK (quorum_needed > 0),
  quorum_reached INTEGER NOT NULL DEFAULT 0 CHECK (quorum_reached >= 0),
  votes_yes INTEGER NOT NULL DEFAULT 0 CHECK (votes_yes >= 0),
  votes_no INTEGER NOT NULL DEFAULT 0 CHECK (votes_no >= 0),
  votes_abstain INTEGER NOT NULL DEFAULT 0 CHECK (votes_abstain >= 0),
  created_by UUID REFERENCES citizens(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (proposal_id)
);

CREATE TABLE op_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voting_id UUID NOT NULL REFERENCES op_votings(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  vote_option TEXT NOT NULL CHECK (vote_option IN ('Aprovo', 'Rejeito', 'Abstenção')),
  receipt_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (voting_id, citizen_id)
);

CREATE INDEX idx_op_votings_public_id ON op_votings(public_id);
CREATE INDEX idx_op_votings_cycle_id ON op_votings(cycle_id);
CREATE INDEX idx_op_votings_proposal_id ON op_votings(proposal_id);
CREATE INDEX idx_op_votings_territory_id ON op_votings(territory_id);
CREATE INDEX idx_op_votings_status ON op_votings(status);
CREATE INDEX idx_op_votes_voting_id ON op_votes(voting_id);
CREATE INDEX idx_op_votes_citizen_id ON op_votes(citizen_id);

CREATE TRIGGER set_updated_at_op_votings
BEFORE UPDATE ON op_votings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
