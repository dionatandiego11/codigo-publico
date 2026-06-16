-- Migration 012: ciclos do Orçamento Participativo.
-- O ciclo é a entidade-raiz da esteira do OP (docs/PROTOCOLO-OP.md). Avança por
-- fases (só para frente, nunca pula nem volta), carrega o regimento local
-- (parâmetros dentro das faixas comuns — "regra comum, número local") e o
-- envelope. O calendário é derivado das janelas do regimento, não persistido.

CREATE TABLE op_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'Rascunho'
    CHECK (phase IN ('Rascunho','Inscrições','Coleta','Votação','Consolidação','Institucionalização','Encerrado','Cancelado')),
  regimento JSONB NOT NULL,
  envelope_total BIGINT NOT NULL DEFAULT 0 CHECK (envelope_total >= 0),
  starts_at TIMESTAMPTZ,
  loa_deadline TIMESTAMPTZ,
  created_by UUID REFERENCES citizens(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_op_cycles_phase ON op_cycles(phase);

-- No máximo um ciclo ativo (não-terminal) por vez: a cidade roda um ciclo de OP
-- de cada vez. 'Encerrado' e 'Cancelado' liberam o slot para o próximo ciclo.
CREATE UNIQUE INDEX uq_op_single_active_cycle
  ON op_cycles ((TRUE))
  WHERE phase NOT IN ('Encerrado','Cancelado');

COMMENT ON COLUMN op_cycles.regimento IS
  'Snapshot do RegimentoLocal: parâmetros dentro das faixas comuns (PROTOCOLO-OP §1.2).';
COMMENT ON COLUMN op_cycles.envelope_total IS 'Envelope do ciclo, em centavos.';
