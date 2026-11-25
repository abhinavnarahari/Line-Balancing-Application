-- V69: Application user accounts for server-side authentication and role-based authorization.
-- Passwords are stored as BCrypt hashes only. The first SYSTEM_ADMIN is created at startup by
-- AdminBootstrap from APP_ADMIN_EMAIL / APP_ADMIN_PASSWORD (never seeded here with a known password).

CREATE TABLE IF NOT EXISTS app_users (
    id              BIGSERIAL       PRIMARY KEY,
    email           VARCHAR(150)    NOT NULL,
    full_name       VARCHAR(120)    NOT NULL,
    password_hash   VARCHAR(100)    NOT NULL,
    role            VARCHAR(30)     NOT NULL CHECK (role IN
                        ('SYSTEM_ADMIN', 'INDUSTRIAL_ENGINEER', 'PRODUCTION_MANAGER', 'LINE_SUPERVISOR')),
    department      VARCHAR(120),
    active          BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_app_users_email ON app_users (LOWER(email));
