-- ============================================================================
-- 06_menu_change_requests.sql  (raw Postgres DDL — LATER use; NOT run now)
-- Proposed menu changes after the brand menu is locked.
-- Copied from FoodieGo_BrandOwner_DataModel.md.
-- ============================================================================

CREATE TABLE menu_change_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id   uuid NOT NULL REFERENCES brands(id),
  items      jsonb NOT NULL,
  status     text NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','approved','rejected')),
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mcr_brand ON menu_change_requests(brand_id);
