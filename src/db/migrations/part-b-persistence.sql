-- Part B persistence — restaurants, users (incl. invited staff), and staff mappings.
-- Run once against the Render Postgres (the same DB the bulk-upload module uses):
--   psql "$DATABASE_URL?sslmode=require" -f src/db/migrations/part-b-persistence.sql
-- Idempotent (IF NOT EXISTS), so re-running is safe.

-- Users: brand owners + staff members invited by name. No FK (brands are seeded
-- in-memory with stable ids), so this table stands alone.
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  name          VARCHAR(255),
  role          VARCHAR(50) NOT NULL,
  phone         VARCHAR(20),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Staff: which user has which role on which brand/restaurant/branch.
CREATE TABLE IF NOT EXISTS restaurant_user_mapping (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL,
  role          VARCHAR(50) NOT NULL,
  brand_id      UUID,
  restaurant_id UUID,
  branch_id     UUID,
  status        VARCHAR(50) NOT NULL DEFAULT 'invited',
  created_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rum_brand_id ON restaurant_user_mapping(brand_id);

-- Restaurants: the bulk-upload module already created this table. Extend it so the
-- main backend can persist its restaurants too (its restaurant.id == restaurant_id).
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS brand_id UUID;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS gst_no   VARCHAR(20);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS email    VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_restaurants_brand_id ON restaurants(brand_id);
