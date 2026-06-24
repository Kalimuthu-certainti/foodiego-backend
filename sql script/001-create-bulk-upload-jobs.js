const pool = require('../src/config/database');

const up = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bulk_upload_jobs (
      id                SERIAL PRIMARY KEY,
      job_id            UUID NOT NULL UNIQUE,
      user_id           INTEGER NOT NULL,
      restaurant_id     UUID,
      file_name         VARCHAR(255) NOT NULL,
      total_rows        INTEGER DEFAULT 0,
      valid_rows        INTEGER DEFAULT 0,
      invalid_rows      INTEGER DEFAULT 0,
      imported_rows     INTEGER DEFAULT 0,
      skipped_rows      INTEGER DEFAULT 0,
      status            VARCHAR(50) NOT NULL DEFAULT 'pending',
      error_log         JSONB,
      completed_at      TIMESTAMP,
      created_at        TIMESTAMP DEFAULT NOW(),
      updated_at        TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log(' bulk_upload_jobs table created');

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bulk_upload_jobs_job_id
    ON bulk_upload_jobs(job_id);
  `);
  console.log(' index on job_id created');

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bulk_upload_jobs_user_id
    ON bulk_upload_jobs(user_id);
  `);
  console.log(' index on user_id created');

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bulk_upload_jobs_status
    ON bulk_upload_jobs(status);
  `);
  console.log(' index on status created');
};

const down = async () => {
  await pool.query(`DROP TABLE IF EXISTS bulk_upload_jobs`);
  console.log('bulk_upload_jobs table dropped');
};

module.exports = { up, down };