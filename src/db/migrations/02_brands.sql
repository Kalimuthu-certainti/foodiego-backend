-- ============================================================================
-- 02_brands.sql  (raw Postgres DDL — for LATER use; NOT run this phase)
--
-- Auto-approve phase: status defaults to 'approved' and is_active to true. The
-- columns are kept so flipping REQUIRE_ADMIN_APPROVAL=true later needs no
-- migration. Copied from FoodieGo_BrandOwner_DataModel.md.
-- ============================================================================

CREATE TABLE brands (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES users(id),
  name          text NOT NULL,
  status        text NOT NULL DEFAULT 'approved'
                CHECK (status IN ('pending','approved','rejected')),
  is_active     boolean NOT NULL DEFAULT true,
  menu_locked   boolean NOT NULL DEFAULT false,
  reject_reason text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_brands_owner ON brands(owner_id);
