-- ============================================================
-- Migration 009: Create audit_logs table
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    UUID        REFERENCES admins(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50)  NOT NULL,
    entity_id   VARCHAR(100),
    old_value   JSONB,
    new_value   JSONB,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id    ON audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action      ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON audit_logs (created_at DESC);

-- ============================================================
-- Migration 010: Create voting_sessions table
-- (Temporary session tokens after QR validation)
-- ============================================================

CREATE TABLE IF NOT EXISTS voting_sessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token      VARCHAR(128)  NOT NULL UNIQUE,
    voter_id   UUID          NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    event_id   UUID          NOT NULL REFERENCES voting_events(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ   NOT NULL,
    used       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voting_sessions_token     ON voting_sessions (token);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_expires   ON voting_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_voter_event ON voting_sessions (voter_id, event_id);
