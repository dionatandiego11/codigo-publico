-- Migration 007: PR state machine transition audit log
-- Each row records one state transition of a civic PR, who triggered it, and why.

CREATE TABLE IF NOT EXISTS pr_transition_events (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    civic_pr_id     UUID        NOT NULL REFERENCES civic_prs(id) ON DELETE CASCADE,
    pr_public_id    TEXT        NOT NULL,
    from_status     TEXT,                     -- NULL on initial creation
    to_status       TEXT        NOT NULL,
    trigger_key     TEXT        NOT NULL,      -- machine trigger identifier (e.g. 'debate_aberto')
    actor_id        UUID,                      -- NULL for system-triggered transitions
    actor_name      TEXT,
    actor_role      TEXT,
    actor_type      TEXT        NOT NULL DEFAULT 'citizen', -- 'citizen' | 'institutional' | 'system'
    reason          TEXT,                      -- optional human description
    metadata        JSONB       NOT NULL DEFAULT '{}',
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pr_transition_events_civic_pr_id
    ON pr_transition_events(civic_pr_id);

CREATE INDEX IF NOT EXISTS idx_pr_transition_events_occurred_at
    ON pr_transition_events(occurred_at DESC);

COMMENT ON TABLE pr_transition_events IS
    'Append-only audit log of every status transition of a civic PR.';
COMMENT ON COLUMN pr_transition_events.from_status IS
    'Previous status. NULL means this is the initial creation transition.';
COMMENT ON COLUMN pr_transition_events.trigger_key IS
    'Semantic trigger key as defined by the PRStateMachine (e.g. criacao, debate_aberto, liberar_votacao).';
COMMENT ON COLUMN pr_transition_events.actor_type IS
    'citizen = regular citizen; institutional = institutional role; system = automated by the platform.';
