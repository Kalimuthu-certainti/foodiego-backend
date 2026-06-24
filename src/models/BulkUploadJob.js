const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const UPLOAD_CONSTANTS = require('../constants/uploadConstants');

// Create new job — job_id doubles as the human-facing import_id
const createJob = async (userId, restaurantId, fileName, totalRows) => {
  const jobId = uuidv4();
  const query = `
    INSERT INTO bulk_upload_jobs
    (job_id, user_id, restaurant_id, file_name, total_rows, valid_rows, invalid_rows, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, 0, 0, $6, NOW(), NOW())
    RETURNING *
  `;
  const { rows } = await pool.query(query, [
    jobId,
    userId,
    restaurantId,
    fileName,
    totalRows,
    UPLOAD_CONSTANTS.JOB_STATUS.PENDING,
  ]);
  return rows[0];
};

// Update job status to PROCESSING
const startProcessingJob = async (jobId) => {
  const query = `
    UPDATE bulk_upload_jobs
    SET status = $1,
        updated_at = NOW()
    WHERE job_id = $2
    RETURNING *
  `;
  const { rows } = await pool.query(query, [
    UPLOAD_CONSTANTS.JOB_STATUS.PROCESSING,
    jobId,
  ]);
  return rows[0];
};

// Update job status with valid/invalid row counts
const updateJobStatus = async (jobId, status, validRows, invalidRows) => {
  // Ensure only valid statuses are passed
  const allowedStatuses = Object.values(UPLOAD_CONSTANTS.JOB_STATUS);
  if (!allowedStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}. Allowed: ${allowedStatuses.join(', ')}`);
  }

  const query = `
    UPDATE bulk_upload_jobs
    SET status = $1,
        valid_rows = $2,
        invalid_rows = $3,
        updated_at = NOW()
    WHERE job_id = $4
    RETURNING *
  `;
  const { rows } = await pool.query(query, [status, validRows, invalidRows, jobId]);
  return rows[0];
};

// Update job to COMPLETED
const completeJob = async (jobId, importedRows, skippedRows, validRows, invalidRows, errorLog = []) => {
  const query = `
    UPDATE bulk_upload_jobs
    SET status = $1,
        imported_rows = $2,
        skipped_rows = $3,
        valid_rows = $4,
        invalid_rows = $5,
        error_log = $6,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE job_id = $7
    RETURNING *
  `;
  const { rows } = await pool.query(query, [
    UPLOAD_CONSTANTS.JOB_STATUS.COMPLETED,
    importedRows,
    skippedRows,
    validRows,
    invalidRows,
    JSON.stringify(errorLog),
    jobId,
  ]);
  return rows[0];
};

// Update job to FAILED
const failJob = async (jobId, validRows = 0, invalidRows = 0, errorLog = []) => {
  const query = `
    UPDATE bulk_upload_jobs
    SET status = $1,
        valid_rows = $2,
        invalid_rows = $3,
        error_log = $4,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE job_id = $5
    RETURNING *
  `;
  const { rows } = await pool.query(query, [
    UPLOAD_CONSTANTS.JOB_STATUS.FAILED,
    validRows,
    invalidRows,
    JSON.stringify(errorLog),
    jobId,
  ]);
  return rows[0];
};

// Update job to PARTIAL (some rows imported, some failed)
const partialJob = async (jobId, importedRows, skippedRows, validRows, invalidRows, errorLog = []) => {
  const query = `
    UPDATE bulk_upload_jobs
    SET status = $1,
        imported_rows = $2,
        skipped_rows = $3,
        valid_rows = $4,
        invalid_rows = $5,
        error_log = $6,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE job_id = $7
    RETURNING *
  `;
  const { rows } = await pool.query(query, [
    UPLOAD_CONSTANTS.JOB_STATUS.PARTIAL,
    importedRows,
    skippedRows,
    validRows,
    invalidRows,
    JSON.stringify(errorLog),
    jobId,
  ]);
  return rows[0];
};

// Get job by ID
const findByJobId = async (jobId) => {
  const query = `
    SELECT * FROM bulk_upload_jobs
    WHERE job_id = $1
  `;
  const { rows } = await pool.query(query, [jobId]);
  return rows[0] || null;
};

// Get all jobs with pagination
const findAll = async (limit = 20, offset = 0) => {
  const query = `
    SELECT * FROM bulk_upload_jobs
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await pool.query(query, [limit, offset]);
  return rows;
};

// Delete job
const deleteJob = async (jobId) => {
  const query = `
    DELETE FROM bulk_upload_jobs
    WHERE job_id = $1
  `;
  await pool.query(query, [jobId]);
};

module.exports = {
  createJob,
  startProcessingJob,
  updateJobStatus,
  completeJob,
  failJob,
  partialJob,
  findByJobId,
  findAll,
  deleteJob,
};