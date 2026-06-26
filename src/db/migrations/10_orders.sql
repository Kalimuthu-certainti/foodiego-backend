-- ============================================================================
-- 10_orders.sql  (raw Postgres DDL — for LATER use; NOT run this phase)
-- Orders placed by customers on the FoodieGo platform.
-- branch_id links to the physical outlet that prepared / fulfilled the order.
-- items is a JSONB array: [{ name, qty, unit_price, subtotal }, ...].
-- Timestamps track each lifecycle transition; nulls mean not yet reached.
-- ============================================================================

CREATE TABLE orders (
  id                    SERIAL PRIMARY KEY,
  order_number          VARCHAR(20)      NOT NULL UNIQUE,
  brand_id              UUID             REFERENCES brands(id),
  branch_id             INTEGER          REFERENCES branches(id),
  customer_name         VARCHAR(100),
  customer_phone        VARCHAR(15),
  customer_address      TEXT,
  items                 JSONB            NOT NULL,
  total_amount          DECIMAL(10,2)    NOT NULL,
  platform_fee          DECIMAL(10,2)    DEFAULT 0,
  delivery_fee          DECIMAL(10,2)    DEFAULT 0,
  net_amount            DECIMAL(10,2)    NOT NULL,
  payment_method        VARCHAR(50),
  payment_status        VARCHAR(20)      DEFAULT 'pending',
  status                VARCHAR(30)      DEFAULT 'placed',
  cancel_reason         TEXT,
  cancelled_by          VARCHAR(20),
  placed_at             TIMESTAMP        DEFAULT NOW(),
  confirmed_at          TIMESTAMP,
  preparing_at          TIMESTAMP,
  out_for_delivery_at   TIMESTAMP,
  delivered_at          TIMESTAMP,
  cancelled_at          TIMESTAMP,
  created_at            TIMESTAMP        DEFAULT NOW(),
  updated_at            TIMESTAMP        DEFAULT NOW()
);

-- status CHECK ensures only valid transitions are stored.
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check CHECK (
    status IN ('placed','confirmed','preparing','out_for_delivery','delivered','cancelled')
  );

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_check CHECK (
    payment_status IN ('pending','paid','failed')
  );

CREATE INDEX idx_orders_brand    ON orders(brand_id);
CREATE INDEX idx_orders_branch   ON orders(branch_id);
CREATE INDEX idx_orders_status   ON orders(status);
CREATE INDEX idx_orders_placed   ON orders(placed_at DESC);
