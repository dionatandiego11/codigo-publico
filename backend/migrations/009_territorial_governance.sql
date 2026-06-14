-- Migration 009: governança territorial.
-- Vínculo territorial (cidadão ↔ território-base), maintainers, recursos e
-- contestações comunitárias. Regra-síntese:
--   "Uma pessoa, uma cidade, um território-base, um nível de confiança."

-- ── Maintainers ──────────────────────────────────────────────────────────────
-- scope 'territorial' exige território; scope 'geral' (instância recursal,
-- associada ao Legislativo) tem territory_id NULL.
CREATE TABLE territory_maintainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id UUID REFERENCES territories(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'territorial' CHECK (scope IN ('territorial', 'geral')),
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Suspenso', 'Revogado')),
  appointed_by TEXT NOT NULL DEFAULT 'indicação institucional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT territorial_scope_requires_territory
    CHECK (scope = 'geral' OR territory_id IS NOT NULL)
);

CREATE UNIQUE INDEX uq_territory_maintainers_active
  ON territory_maintainers (citizen_id, COALESCE(territory_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE status = 'Ativo';

CREATE INDEX idx_territory_maintainers_territory ON territory_maintainers(territory_id);

-- ── Vínculos territoriais ─────────────────────────────────────────────────────
CREATE TABLE territory_bonds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  territory_id UUID NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  bond_type TEXT NOT NULL CHECK (bond_type IN ('morador', 'trabalhador', 'estudante')),
  trust_level TEXT NOT NULL DEFAULT 'T1' CHECK (trust_level IN ('T0', 'T1', 'T2', 'T3', 'T4')),
  status TEXT NOT NULL DEFAULT 'Pendente'
    CHECK (status IN ('Pendente', 'Aprovado', 'Recusado', 'Contestado', 'Revogado')),
  evidence_note TEXT,
  decided_by UUID REFERENCES citizens(id) ON DELETE SET NULL,
  decision_reason TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uma pessoa só pode ter um vínculo vivo (pendente, aprovado ou em contestação).
CREATE UNIQUE INDEX uq_territory_bonds_one_active_per_citizen
  ON territory_bonds (citizen_id)
  WHERE status IN ('Pendente', 'Aprovado', 'Contestado');

CREATE INDEX idx_territory_bonds_territory ON territory_bonds(territory_id);
CREATE INDEX idx_territory_bonds_status ON territory_bonds(status);

-- ── Recursos (cidadão → Maintainer Geral) ────────────────────────────────────
CREATE TABLE bond_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id UUID NOT NULL REFERENCES territory_bonds(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Deferido', 'Indeferido')),
  decided_by UUID REFERENCES citizens(id) ON DELETE SET NULL,
  decision_reason TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_bond_appeals_pending ON bond_appeals (bond_id) WHERE status = 'Pendente';

-- ── Contestações comunitárias ─────────────────────────────────────────────────
-- A contestação abre revisão, mas não suspende o vínculo sem evidência mínima.
CREATE TABLE bond_contestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id UUID NOT NULL REFERENCES territory_bonds(id) ON DELETE CASCADE,
  contestant_citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  defense TEXT,
  status TEXT NOT NULL DEFAULT 'Aberta'
    CHECK (status IN ('Aberta', 'Mantido', 'Revogado', 'Escalada')),
  decided_by UUID REFERENCES citizens(id) ON DELETE SET NULL,
  decision_reason TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_bond_contestations_open ON bond_contestations (bond_id) WHERE status = 'Aberta';
CREATE INDEX idx_bond_contestations_bond ON bond_contestations(bond_id);

-- ── Triggers de updated_at ────────────────────────────────────────────────────
CREATE TRIGGER set_updated_at_territory_maintainers
BEFORE UPDATE ON territory_maintainers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_territory_bonds
BEFORE UPDATE ON territory_bonds
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
