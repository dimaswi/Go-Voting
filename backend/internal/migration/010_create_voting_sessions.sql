CREATE TABLE IF NOT EXISTS voting_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token       VARCHAR(255) NOT NULL UNIQUE,
    voter_id    UUID NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    event_id    UUID NOT NULL REFERENCES voting_events(id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voting_sessions_token ON voting_sessions(token);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_voter_event ON voting_sessions(voter_id, event_id);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_expires ON voting_sessions(expires_at) WHERE used = FALSE;
