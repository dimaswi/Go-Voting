-- ============================================================
-- Migration 005: Create voters table
-- ============================================================

CREATE TYPE voter_status AS ENUM ('active', 'blocked');

CREATE TABLE IF NOT EXISTS voters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(200) NOT NULL,
    identity_number VARCHAR(50),
    phone           VARCHAR(20),
    email           VARCHAR(100),
    group_name      VARCHAR(200),
    unique_code     VARCHAR(64)  NOT NULL UNIQUE,
    qr_code_url     TEXT,
    is_anonymous    BOOLEAN      NOT NULL DEFAULT FALSE,
    status          voter_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voters_unique_code ON voters (unique_code);
CREATE INDEX IF NOT EXISTS idx_voters_status      ON voters (status);
CREATE INDEX IF NOT EXISTS idx_voters_full_name   ON voters (full_name);
