-- ============================================================
-- Migration 001: Create admins table
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    password_hash TEXT       NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins (username);

-- ============================================================
-- Seeder: Default admin account
-- Username: admin
-- Password: Admin123! (bcrypt hashed)
-- ============================================================
INSERT INTO admins (id, username, name, password_hash, role, is_active)
VALUES (
    gen_random_uuid(),
    'admin',
    'Super Admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAKY6xDHJKi',
    'superadmin',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- Note: The hash above is for password 'Admin123!'
-- Change this password immediately after first login!
