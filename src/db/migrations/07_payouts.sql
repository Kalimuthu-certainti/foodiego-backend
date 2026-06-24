-- ============================================================================
-- 07_payouts.sql  (raw Postgres DDL — for LATER use; NOT run this phase)
-- Per-brand payout periods. Copied from FoodieGo_BrandOwner_DataModel.md.
-- ============================================================================

CREATE TABLE payouts (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id),
  period   text NOT NULL,
  gross    numeric(12,2),
  fee      numeric(12,2),
  net      numeric(12,2),
  status   text NOT NULL DEFAULT 'pending'
           CHECK (status IN ('pending','paid'))
);

CREATE INDEX idx_payouts_brand_period ON payouts(brand_id, period);
