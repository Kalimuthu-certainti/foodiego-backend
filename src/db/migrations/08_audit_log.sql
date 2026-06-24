-- ============================================================================
-- 08_audit_log.sql  (raw Postgres DDL — for LATER use; NOT run this phase)
--
-- Append-only audit trail. Every mutating endpoint writes one row. The
-- BEFORE UPDATE/DELETE trigger enforces append-only at the database level so
-- history cannot be rewritten even by a buggy/malicious query.
-- Table copied from FoodieGo_BrandOwner_DataModel.md; the trigger is added here.
-- ============================================================================

CREATE TABLE audit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   uuid NOT NULL,
  action     text NOT NULL
             CHECK (action IN (
               'CREATE','UPDATE','DELETE','INVITE','REMOVE','SCOPE_DENIED'
             )),
  entity     text NOT NULL,
  entity_id  uuid,
  payload    jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_entity ON audit_log(entity, entity_id);

-- ---------------------------------------------------------------------------
-- Append-only enforcement: block any UPDATE or DELETE on audit_log.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_log_append_only()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();

CREATE TRIGGER trg_audit_log_no_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
