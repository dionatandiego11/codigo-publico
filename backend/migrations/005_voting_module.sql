-- Módulo de votação.
-- O voto individual não é exposto pela API. Resultados públicos são agregados.

CREATE TABLE voting_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voting_id UUID NOT NULL REFERENCES votings(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  vote_option TEXT NOT NULL CHECK (vote_option IN ('Aprovo', 'Rejeito', 'Abstenção')),
  receipt_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (voting_id, citizen_id)
);

CREATE INDEX idx_voting_votes_voting_id ON voting_votes(voting_id);
CREATE INDEX idx_voting_votes_citizen_id ON voting_votes(citizen_id);
CREATE INDEX idx_voting_votes_receipt_code ON voting_votes(receipt_code);

INSERT INTO votings (
  public_id,
  civic_pr_id,
  title,
  citizen_summary,
  text_changes,
  intended_impact,
  pros,
  cons,
  reviews_overview,
  deadline,
  quorum_needed,
  quorum_reached,
  votes_yes,
  votes_no,
  votes_abstain,
  status
)
SELECT
  'vote-046',
  cp.id,
  'Orçamento Participativo Obrigatório de 5% (PR #046)',
  'Obriga a realização anual de orçamento participativo com participação territorial dos moradores.',
  '+ Dispositivo na Lei Orgânica para tornar obrigatório o orçamento participativo anual.',
  'Ampliar o controle social sobre prioridades de obras, serviços e investimentos municipais.',
  ARRAY[
    'Distribui a decisão orçamentária entre territórios.',
    'Cria processo público, rastreável e auditável.',
    'Fortalece associações de moradores e participação popular.'
  ]::text[],
  ARRAY[
    'Pode exigir capacidade técnica adicional da administração.',
    'Precisa de regras claras para evitar fragmentação excessiva do orçamento.'
  ]::text[],
  'Recomendação técnica para preservar vinculações constitucionais e critérios de responsabilidade fiscal.',
  NOW() + INTERVAL '20 days',
  5000,
  5120,
  4520,
  480,
  120,
  'Aberta'
FROM civic_prs cp
WHERE cp.public_id = '#046'
ON CONFLICT (public_id) DO UPDATE SET
  title = EXCLUDED.title,
  citizen_summary = EXCLUDED.citizen_summary,
  text_changes = EXCLUDED.text_changes,
  intended_impact = EXCLUDED.intended_impact,
  pros = EXCLUDED.pros,
  cons = EXCLUDED.cons,
  reviews_overview = EXCLUDED.reviews_overview,
  deadline = EXCLUDED.deadline,
  quorum_needed = EXCLUDED.quorum_needed,
  quorum_reached = EXCLUDED.quorum_reached,
  votes_yes = EXCLUDED.votes_yes,
  votes_no = EXCLUDED.votes_no,
  votes_abstain = EXCLUDED.votes_abstain,
  status = EXCLUDED.status;

UPDATE civic_prs cp
SET voting_id = v.id,
    status = 'Em votação'
FROM votings v
WHERE cp.public_id = '#046'
  AND v.public_id = 'vote-046';
