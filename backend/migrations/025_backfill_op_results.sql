-- Migration 025: recupera resultados de votações encerradas antes da correção
-- do contrato de IDs do ranking e congela ciclos que já estão consolidados.

WITH numbered AS (
  SELECT
    v.id AS voting_id,
    v.cycle_id,
    v.territory_id,
    v.proposal_id,
    p.title AS proposal_title,
    t.name AS territory_name,
    v.votes_yes,
    v.votes_no,
    v.votes_abstain,
    v.quorum_needed,
    v.quorum_reached,
    v.created_at,
    ROW_NUMBER() OVER (ORDER BY v.created_at, v.id) AS sequence
  FROM op_votings v
  JOIN budget_proposals p ON p.id = v.proposal_id
  JOIN territories t ON t.id = v.territory_id
  LEFT JOIN op_ranking_items ri ON ri.voting_id = v.id
  WHERE v.status = 'Encerrada' AND ri.id IS NULL
), current_max AS (
  SELECT COALESCE(MAX(substring(public_id from 5)::int), 0) AS value
  FROM op_ranking_items
  WHERE public_id ~ '^RNK-[0-9]+$'
), prepared AS (
  SELECT
    n.*,
    'RNK-' || LPAD((m.value + n.sequence)::text, 3, '0') AS public_id,
    n.votes_yes + n.votes_no + n.votes_abstain AS total_votes,
    CASE
      WHEN n.votes_yes + n.votes_no = 0 THEN 0
      ELSE n.votes_yes::numeric * 100 / (n.votes_yes + n.votes_no)
    END AS approval_pct,
    n.quorum_reached >= n.quorum_needed AS quorum_met,
    n.quorum_reached >= n.quorum_needed AND n.votes_yes > n.votes_no AS approved
  FROM numbered n
  CROSS JOIN current_max m
), ranked AS (
  SELECT
    p.*,
    ROW_NUMBER() OVER (
      PARTITION BY p.cycle_id, p.territory_id
      ORDER BY p.approval_pct DESC, p.total_votes DESC, p.created_at, p.voting_id
    ) AS position
  FROM prepared p
)
INSERT INTO op_ranking_items (
  public_id,
  cycle_id,
  territory_id,
  proposal_id,
  voting_id,
  proposal_title,
  territory_name,
  position,
  votes_yes,
  votes_no,
  votes_abstain,
  total_votes,
  approval_pct,
  quorum_reached,
  approved
)
SELECT
  public_id,
  cycle_id,
  territory_id,
  proposal_id,
  voting_id,
  proposal_title,
  territory_name,
  position,
  votes_yes,
  votes_no,
  votes_abstain,
  total_votes,
  approval_pct,
  quorum_met,
  approved
FROM ranked
ON CONFLICT (voting_id) DO NOTHING;

WITH positions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY cycle_id, territory_id
      ORDER BY approval_pct DESC, total_votes DESC, created_at, id
    ) AS position
  FROM op_ranking_items
)
UPDATE op_ranking_items ri
SET position = positions.position
FROM positions
WHERE ri.id = positions.id;

INSERT INTO cycle_result_snapshots (cycle_id, snapshot_data)
SELECT
  c.id,
  jsonb_build_object(
    'cycleId', c.id::text,
    'cycleLabel', c.label,
    'frozen', true,
    'items', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'position', ri.position,
          'proposalTitle', ri.proposal_title,
          'territoryId', t.slug,
          'territoryName', ri.territory_name,
          'votesYes', ri.votes_yes,
          'votesNo', ri.votes_no,
          'votesAbstain', ri.votes_abstain,
          'totalVotes', ri.total_votes,
          'approvalPct', ri.approval_pct,
          'quorumReached', ri.quorum_reached,
          'approved', ri.approved,
          'status', ri.status
        ) ORDER BY ri.territory_name, ri.position
      ) FILTER (WHERE ri.id IS NOT NULL),
      '[]'::jsonb
    )
  )
FROM op_cycles c
LEFT JOIN op_ranking_items ri ON ri.cycle_id = c.id
LEFT JOIN territories t ON t.id = ri.territory_id
WHERE c.phase IN ('Consolidação', 'Institucionalização', 'Encerrado')
  AND NOT EXISTS (
    SELECT 1 FROM cycle_result_snapshots existing WHERE existing.cycle_id = c.id
  )
GROUP BY c.id, c.label
ON CONFLICT (cycle_id) DO NOTHING;
