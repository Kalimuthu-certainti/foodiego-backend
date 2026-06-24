-- ============================================================================
-- 05_restaurant_user_mapping.sql  (raw Postgres DDL — LATER use; NOT run now)
-- Role + scope (brand/restaurant/branch) for invited users.
-- Copied from FoodieGo_BrandOwner_DataModel.md.
-- ============================================================================

CREATE TABLE restaurant_user_mapping (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),
  role          text NOT NULL
                CHECK (role IN (
                  'RESTAURANT_MANAGER',
                  'RESTAURANT_OPERATOR',
                  'RESTAURANT_SUPPORT_STAFF'
                )),
  brand_id      uuid REFERENCES brands(id),
  restaurant_id uuid REFERENCES restaurants(id),
  branch_id     uuid REFERENCES branches(id),
  status        text NOT NULL DEFAULT 'invited'
                CHECK (status IN ('invited','active','removed')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rum_user  ON restaurant_user_mapping(user_id);
CREATE INDEX idx_rum_brand ON restaurant_user_mapping(brand_id);
