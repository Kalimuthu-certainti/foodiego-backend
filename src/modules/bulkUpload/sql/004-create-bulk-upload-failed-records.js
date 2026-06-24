const pool = require('../config/database');

const up = async () => {
  // Add restaurant_id to bulk_upload_jobs if the column was added after initial migration
  await pool.query(`
    ALTER TABLE bulk_upload_jobs
    ADD COLUMN IF NOT EXISTS restaurant_id UUID;
  `);
  console.log(' restaurant_id column ensured on bulk_upload_jobs');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bulk_upload_failed_records (
      id            SERIAL PRIMARY KEY,
      job_id        UUID NOT NULL REFERENCES bulk_upload_jobs(job_id) ON DELETE CASCADE,
      row_number    INTEGER NOT NULL,
      raw_data      JSONB NOT NULL,
      error_message TEXT NOT NULL,
      stage         VARCHAR(50) NOT NULL DEFAULT 'import',
      created_at    TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log(' bulk_upload_failed_records table created');

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_failed_records_job_id
    ON bulk_upload_failed_records(job_id);
  `);
  console.log(' index on job_id created');
};

const down = async () => {
  await pool.query(`DROP TABLE IF EXISTS bulk_upload_failed_records`);
  console.log('bulk_upload_failed_records table dropped');
};

module.exports = { up, down };
