-- Migration 011: protocolo de maintainers territoriais.
-- Nomeação com mandato (início/fim), origem da indicação, e destituição por
-- duas vias: decisão fundamentada do Maintainer Geral ou moção popular do
-- território (recall). Regra-síntese:
--   "Um maintainer territorial não pode ser vitalício, invisível nem removido
--    informalmente."

-- ── Mandato e origem ──────────────────────────────────────────────────────────
ALTER TABLE territory_maintainers
  ADD COLUMN IF NOT EXISTS appointment_source TEXT,
  ADD COLUMN IF NOT EXISTS term_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS term_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mandate_note TEXT;

-- Vocabulário de status do maintainer (em português, como o resto do domínio).
-- 'Ativo' e 'Suspenso' são preservados das migrations anteriores.
ALTER TABLE territory_maintainers DROP CONSTRAINT IF EXISTS territory_maintainers_status_check;
ALTER TABLE territory_maintainers
  ADD CONSTRAINT territory_maintainers_status_check
  CHECK (status IN ('Provisório', 'Ativo', 'Em revisão', 'Suspenso', 'Destituído', 'Expirado'));

-- No máximo um maintainer territorial "efetivo" por território.
DROP INDEX IF EXISTS uq_territory_maintainers_active;
CREATE UNIQUE INDEX uq_territory_one_effective_maintainer
  ON territory_maintainers (territory_id)
  WHERE scope = 'territorial' AND status IN ('Provisório', 'Ativo', 'Em revisão');

-- ── Moção popular de destituição (recall) ─────────────────────────────────────
CREATE TABLE maintainer_recall_motions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintainer_id UUID NOT NULL REFERENCES territory_maintainers(id) ON DELETE CASCADE,
  territory_id UUID NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aberta'
    CHECK (status IN ('Aberta', 'Aprovada', 'Rejeitada', 'Cancelada')),
  quorum_required INT NOT NULL,         -- 50% + 1 dos vínculos T3+ no momento da abertura
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uma moção aberta por maintainer de cada vez.
CREATE UNIQUE INDEX uq_recall_open_per_maintainer
  ON maintainer_recall_motions (maintainer_id)
  WHERE status = 'Aberta';

CREATE INDEX idx_recall_motions_maintainer ON maintainer_recall_motions(maintainer_id);

-- Assinaturas de apoio à moção (cidadãos T3+ do território). Unicidade por cidadão.
CREATE TABLE maintainer_recall_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motion_id UUID NOT NULL REFERENCES maintainer_recall_motions(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (motion_id, citizen_id)
);

CREATE INDEX idx_recall_signatures_motion ON maintainer_recall_signatures(motion_id);

COMMENT ON COLUMN territory_maintainers.appointment_source IS
  'eleicao_territorial | indicacao_legislativa | nomeacao_executiva | designacao_emergencial';
COMMENT ON COLUMN maintainer_recall_motions.quorum_required IS
  'Assinaturas necessárias (50% + 1 dos vínculos T3+ ativos no território na abertura).';
