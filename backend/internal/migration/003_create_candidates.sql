-- ============================================================
-- Migration 003: Create candidates table
-- ============================================================

CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

CREATE TABLE IF NOT EXISTS candidates (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name               VARCHAR(200)  NOT NULL,
    candidate_number        INTEGER,
    nik                     VARCHAR(50),
    birth_place             VARCHAR(100),
    birth_date              DATE,
    gender                  gender_type,
    address                 TEXT,
    phone                   VARCHAR(20),
    email                   VARCHAR(100),
    photo_url               TEXT,
    education               TEXT,
    organization_experience TEXT,
    current_position        VARCHAR(200),
    vision                  TEXT,
    mission                 TEXT,
    work_program            TEXT,
    goals                   TEXT,
    motto                   VARCHAR(500),
    description             TEXT,
    is_active               BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_is_active ON candidates (is_active);
CREATE INDEX IF NOT EXISTS idx_candidates_full_name ON candidates (full_name);
