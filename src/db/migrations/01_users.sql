-- ============================================================================
-- 01_users.sql  (raw Postgres DDL — for LATER use; NOT run this phase)
--
-- Persistence is deferred: the app + tests run against an in-memory store now
-- (see src/config/database.js). These migrations capture the real schema so a
-- Postgres pool can be wired in later (run top-down, brands depend on users).
--
-- The users table is not in the data-model doc's DDL section but is referenced
-- by brands.owner_id and restaurant_user_mapping.user_id, so it is created first.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- provides gen_random_uuid()

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name          text,
  role          text NOT NULL DEFAULT 'BRAND_OWNER'
                CHECK (role IN (
                  'BRAND_OWNER',
                  'RESTAURANT_MANAGER',
                  'RESTAURANT_OPERATOR',
                  'RESTAURANT_SUPPORT_STAFF',
                  'ADMIN'
                )),
  phone         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
