-- Migration 010: trilha de auditoria com hash encadeado + âncoras de integridade.
-- Cada audit_event passa a carregar o hash do evento anterior (prev_hash) e o
-- próprio hash (event_hash = SHA-256 do conteúdo + prev_hash), formando uma
-- cadeia verificável. A blockchain NÃO recebe dados pessoais: apenas o hash da
-- cabeça da cadeia é ancorado externamente (tabela audit_anchors).

ALTER TABLE audit_events
  ADD COLUMN IF NOT EXISTS prev_hash TEXT,
  ADD COLUMN IF NOT EXISTS event_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_events_event_hash ON audit_events(event_hash);

-- Âncoras: fotografias periódicas da cabeça da cadeia, com referência externa
-- (tx em blockchain) quando disponível.
CREATE TABLE IF NOT EXISTS audit_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_head_hash TEXT NOT NULL,
  events_count BIGINT NOT NULL,
  anchored_via TEXT NOT NULL DEFAULT 'noop',  -- noop | log | chain-specific id
  tx_ref TEXT,                                 -- referência externa (hash da tx on-chain)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_anchors IS
  'Provas de integridade da cadeia de auditoria. Somente hashes — nunca dados pessoais.';
