-- Migration 024: snapshot persistido do resultado do ciclo.
-- Quando o ciclo avança para Consolidação (votações fechadas), o resultado
-- completo é congelado como JSONB. Isso garante integridade histórica mesmo
-- que as regras de votação ou dados de ranking mudem no futuro.

CREATE TABLE IF NOT EXISTS cycle_result_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL UNIQUE REFERENCES op_cycles(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cycle_result_snapshots_cycle_id ON cycle_result_snapshots(cycle_id);

COMMENT ON TABLE cycle_result_snapshots IS 'Resultado congelado do ciclo OP. Gerado automaticamente ao fechar as votações (Consolidação).';
COMMENT ON COLUMN cycle_result_snapshots.snapshot_data IS 'JSON com o ranking completo, metadados do ciclo e contagem de votos no momento do fechamento.';
