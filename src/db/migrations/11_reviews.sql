-- ============================================================================
-- 11_reviews.sql  (raw Postgres DDL — for LATER use; NOT run this phase)
-- Customer reviews with owner-reply flow. Linked to orders and branches.
-- ============================================================================

CREATE TABLE reviews (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER REFERENCES orders(id),
  branch_id       INTEGER REFERENCES branches(id),
  customer_name   VARCHAR(100),
  customer_phone  VARCHAR(15),
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text     TEXT,
  status          VARCHAR(20) DEFAULT 'approved',
  owner_reply     TEXT,
  replied_at      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

ALTER TABLE reviews
  ADD CONSTRAINT reviews_status_check CHECK (
    status IN ('approved', 'hidden', 'flagged')
  );

CREATE INDEX idx_reviews_branch  ON reviews(branch_id);
CREATE INDEX idx_reviews_order   ON reviews(order_id);
CREATE INDEX idx_reviews_rating  ON reviews(rating);
CREATE INDEX idx_reviews_status  ON reviews(status);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);
