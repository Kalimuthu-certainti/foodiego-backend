-- ============================================================================
-- seed.sql — fixture data for the FUTURE real Postgres database.
--
-- NOT RUN NOW. Persistence is an in-memory store this phase (DB deferred); the
-- runtime equivalent is src/db/seeds/seed.js. This file exists so that when a
-- real database is wired in (see src/db/migrations/), the same demo users can
-- be loaded with `psql -f seed.sql`.
--
-- password_hash below is a bcrypt hash of the demo password "Password123!".
-- Demo credentials (all share the same password):
--   owner1@foodiego.test / Password123!  (BRAND_OWNER)
--   owner2@foodiego.test / Password123!  (BRAND_OWNER)
--   staff1@foodiego.test / Password123!  (RESTAURANT_MANAGER)
-- ============================================================================

INSERT INTO users (id, email, password_hash, name, role, phone) VALUES
  ('11111111-1111-1111-1111-111111111111',
   'owner1@foodiego.test',
   '$2a$10$C6UzMDM.H6dfI/f/IKcEeO3pYJyJzD8K6r0xqJ1pQ8oF8nqg7bA1S',
   'Owner One',
   'BRAND_OWNER',
   NULL),
  ('22222222-2222-2222-2222-222222222222',
   'owner2@foodiego.test',
   '$2a$10$C6UzMDM.H6dfI/f/IKcEeO3pYJyJzD8K6r0xqJ1pQ8oF8nqg7bA1S',
   'Owner Two',
   'BRAND_OWNER',
   NULL),
  ('33333333-3333-3333-3333-333333333333',
   'staff1@foodiego.test',
   '$2a$10$C6UzMDM.H6dfI/f/IKcEeO3pYJyJzD8K6r0xqJ1pQ8oF8nqg7bA1S',
   'Staff One',
   'RESTAURANT_MANAGER',
   '9999999999')
ON CONFLICT (id) DO NOTHING;
