CREATE TABLE demand_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  demand_id UUID NOT NULL
    REFERENCES budget_demands(id)
    ON DELETE CASCADE,

  actor_id UUID,
  actor_type TEXT NOT NULL DEFAULT 'system'
    CHECK (actor_type IN ('citizen', 'management', 'admin', 'system')),

  event_type TEXT NOT NULL,

  from_state TEXT,
  to_state TEXT,

  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'internal', 'audit_only')),

  payload JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_demand_events_demand_created
  ON demand_events(demand_id, created_at ASC);

CREATE INDEX idx_demand_events_event_type
  ON demand_events(event_type);

CREATE INDEX idx_demand_events_visibility
  ON demand_events(visibility);
