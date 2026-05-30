-- ============================================================
-- Migration 006: Create event_voters table
-- ============================================================

CREATE TYPE event_voter_status AS ENUM ('active', 'blocked');

CREATE TABLE IF NOT EXISTS event_voters (
    id          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    UUID               NOT NULL REFERENCES voting_events(id) ON DELETE CASCADE,
    voter_id    UUID               NOT NULL REFERENCES voters(id)        ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    has_voted   BOOLEAN            NOT NULL DEFAULT FALSE,
    voted_at    TIMESTAMPTZ,
    status      event_voter_status NOT NULL DEFAULT 'active',

    CONSTRAINT uq_event_voter UNIQUE (event_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_event_voters_event_id  ON event_voters (event_id);
CREATE INDEX IF NOT EXISTS idx_event_voters_voter_id  ON event_voters (voter_id);
CREATE INDEX IF NOT EXISTS idx_event_voters_has_voted ON event_voters (has_voted);
CREATE INDEX IF NOT EXISTS idx_event_voters_status    ON event_voters (status);
