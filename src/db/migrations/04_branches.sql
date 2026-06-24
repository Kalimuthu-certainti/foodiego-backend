-- ============================================================================
-- 04_branches.sql  (raw Postgres DDL — for LATER use; NOT run this phase)
-- working_hours is the JSONB day->[{open,close}] shape; cascade-deletes with
-- its restaurant. Copied from FoodieGo_BrandOwner_DataModel.md.
-- ============================================================================

CREATE TABLE branches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  lat           numeric(9,6) NOT NULL,
  lng           numeric(9,6) NOT NULL,
  working_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_open       boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_branches_restaurant ON branches(restaurant_id);
