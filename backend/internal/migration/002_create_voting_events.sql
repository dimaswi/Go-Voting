-- ============================================================
-- Migration 002: Create voting_events table
-- ============================================================

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('draft', 'active', 'finished', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS voting_events (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  VARCHAR(255)  NOT NULL,
    slug                  VARCHAR(255)  NOT NULL UNIQUE,
    code                  VARCHAR(20)   NOT NULL UNIQUE,
    description           TEXT,
    banner_url            TEXT,
    start_at              TIMESTAMPTZ   NOT NULL,
    end_at                TIMESTAMPTZ   NOT NULL,
    status                event_status  NOT NULL DEFAULT 'draft',
    min_choices           INTEGER       NOT NULL DEFAULT 1 CHECK (min_choices >= 1),
    max_choices           INTEGER       NOT NULL DEFAULT 1 CHECK (max_choices >= 1),
    allow_multiple_choices BOOLEAN      NOT NULL DEFAULT FALSE,
    is_result_public      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT check_choices CHECK (min_choices <= max_choices),
    CONSTRAINT check_dates   CHECK (start_at < end_at)
);

CREATE INDEX IF NOT EXISTS idx_voting_events_slug   ON voting_events (slug);
CREATE INDEX IF NOT EXISTS idx_voting_events_code   ON voting_events (code);
CREATE INDEX IF NOT EXISTS idx_voting_events_status ON voting_events (status);
