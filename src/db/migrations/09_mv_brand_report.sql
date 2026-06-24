-- ============================================================================
-- 09_mv_brand_report.sql  (raw Postgres DDL — for LATER use; NOT run this phase)
--
-- Materialised view aggregating orders/revenue per brand per day, backing
-- GET /api/brands/:id/reports. Order data arrives from later phases, so the
-- view + endpoint ship returning empty now.
--
-- Refresh every ~15 min:  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_brand_report;
-- (CONCURRENTLY needs a UNIQUE index, created below.)
--
-- NOTE: this references an `orders` table that does not exist yet. The LEFT JOIN
-- against brands means it materialises one row per brand-day once orders exist;
-- until then it is simply empty. Adjust columns when the orders schema lands.
-- ============================================================================

CREATE MATERIALIZED VIEW mv_brand_report AS
SELECT
  b.id                                   AS brand_id,
  o.order_day                            AS report_date,
  COUNT(o.id)                            AS orders_count,
  COALESCE(SUM(o.total_amount), 0)::numeric(14,2) AS gross_revenue
FROM brands b
LEFT JOIN (
  SELECT
    id,
    brand_id,
    total_amount,
    (created_at AT TIME ZONE 'UTC')::date AS order_day
  FROM orders
) o ON o.brand_id = b.id
GROUP BY b.id, o.order_day
WITH NO DATA;

-- Required for REFRESH ... CONCURRENTLY.
CREATE UNIQUE INDEX idx_mv_brand_report_pk
  ON mv_brand_report(brand_id, report_date);
