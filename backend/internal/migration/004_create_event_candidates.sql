-- ============================================================
-- Migration 004: Create event_candidates table
-- ============================================================

CREATE TABLE IF NOT EXISTS event_candidates (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id         UUID        NOT NULL REFERENCES voting_events(id) ON DELETE CASCADE,
    candidate_id     UUID        NOT NULL REFERENCES candidates(id)    ON DELETE CASCADE,
    candidate_number INTEGER     NOT NULL,
    sort_order       INTEGER     NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_event_candidate        UNIQUE (event_id, candidate_id),
    CONSTRAINT uq_event_candidate_number UNIQUE (event_id, candidate_number)
);

CREATE INDEX IF NOT EXISTS idx_event_candidates_event_id     ON event_candidates (event_id);
CREATE INDEX IF NOT EXISTS idx_event_candidates_candidate_id ON event_candidates (candidate_id);
