-- ============================================================================
-- 03_restaurants.sql  (raw Postgres DDL — for LATER use; NOT run this phase)
-- gst_no is exactly 15 chars; cascade-deletes with its brand.
-- Copied from FoodieGo_BrandOwner_DataModel.md.
-- ============================================================================

CREATE TABLE restaurants (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id   uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name       text NOT NULL,
  gst_no     char(15) NOT NULL,
  email      text NOT NULL,
  phone      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_restaurants_brand ON restaurants(brand_id);
