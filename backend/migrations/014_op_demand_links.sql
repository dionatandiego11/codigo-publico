-- Migration 014: agrupamento e fork de demandas do OP.
-- Demandas duplicadas podem ser agrupadas em uma demanda canônica; soluções
-- alternativas para o mesmo problema viram forks. A demanda original não é
-- apagada: a relação é pública, auditável e reversível por histórico.

ALTER TABLE budget_demands
  ADD COLUMN grouped_into_demand_id UUID REFERENCES budget_demands(id) ON DELETE SET NULL,
  ADD COLUMN forked_from_demand_id UUID REFERENCES budget_demands(id) ON DELETE SET NULL;

CREATE TABLE budget_demand_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_demand_id UUID NOT NULL REFERENCES budget_demands(id) ON DELETE CASCADE,
  target_demand_id UUID NOT NULL REFERENCES budget_demands(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('grouped', 'fork')),
  reason TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES citizens(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (source_demand_id <> target_demand_id),
  UNIQUE (source_demand_id, target_demand_id, link_type)
);

CREATE INDEX idx_budget_demands_grouped_into ON budget_demands(grouped_into_demand_id);
CREATE INDEX idx_budget_demands_forked_from ON budget_demands(forked_from_demand_id);
CREATE INDEX idx_budget_demand_links_source ON budget_demand_links(source_demand_id);
CREATE INDEX idx_budget_demand_links_target ON budget_demand_links(target_demand_id);
CREATE INDEX idx_budget_demand_links_type ON budget_demand_links(link_type);
