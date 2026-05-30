-- ============================================================
-- Migration 008: Create vote_details table
-- ============================================================

CREATE TABLE IF NOT EXISTS vote_details (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vote_id      UUID        NOT NULL REFERENCES votes(id)      ON DELETE CASCADE,
    candidate_id UUID        NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    event_id     UUID        NOT NULL REFERENCES voting_events(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vote_details_vote_id      ON vote_details (vote_id);
CREATE INDEX IF NOT EXISTS idx_vote_details_candidate_id ON vote_details (candidate_id);
CREATE INDEX IF NOT EXISTS idx_vote_details_event_id     ON vote_details (event_id);
