-- ============================================================
-- Migration 007: Create votes table
-- ============================================================

CREATE TABLE IF NOT EXISTS votes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id     UUID        NOT NULL REFERENCES voting_events(id) ON DELETE CASCADE,
    voter_id     UUID        NOT NULL REFERENCES voters(id)        ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address   VARCHAR(45),
    user_agent   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_vote_event_voter UNIQUE (event_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_event_id ON votes (event_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON votes (voter_id);
