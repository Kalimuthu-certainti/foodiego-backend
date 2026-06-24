const pool = require('../config/database');

// Insert all failed records for a job in a single transaction
const insertFailedRecords = async (jobId, failedRecords) => {
  if (!failedRecords.length) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const record of failedRecords) {
      await client.query(
        `INSERT INTO bulk_upload_failed_records
           (job_id, row_number, raw_data, error_message, stage)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          jobId,
          record.rowNumber,
          JSON.stringify(record.rawData),
          record.error,
          record.stage || 'import',
        ]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Fetch all failed records for a job, ordered by row number
const findByJobId = async (jobId) => {
  const { rows } = await pool.query(
    `SELECT id, job_id, row_number, raw_data, error_message, stage, created_at
     FROM bulk_upload_failed_records
     WHERE job_id = $1
     ORDER BY row_number ASC`,
    [jobId]
  );
  return rows;
};

module.exports = { insertFailedRecords, findByJobId };
