const BulkUploadJob = require('../models/BulkUploadJob');
const BulkUploadFailedRecord = require('../models/BulkUploadFailedRecord');
const Restaurant = require('../models/Restaurant');
const csvParserService = require('../services/csvParserService');
const importService = require('../services/importService');
const templateService = require('../services/templateService');
const { success, error } = require('../utils/responseFormatter');
const { deleteFile } = require('../utils/fileHelper');
const logger = require('../utils/logger');

const uploadFile = async (req, res, next) => {
  let filePath = null;
  try {
    filePath = req.file.path;
    const userId = req.user.id;
    const fileName = req.file.originalname;
    const restaurantId = req.body.restaurant_id;
    const restaurantName = req.body.restaurant_name;

    if (!restaurantId) {
      deleteFile(filePath);
      return error(res, 'Please select a restaurant before uploading', 400);
    }

    // The app's real restaurants live in the main (in-memory) backend, so the
    // frontend sends restaurant_id + name and we register it in this module's
    // Postgres on first use (idempotent). No more "restaurant not found".
    await Restaurant.upsert(restaurantId, userId, restaurantName || 'Restaurant');

    const { rows, totalRows } = await csvParserService.parseFile(filePath);

    const job = await BulkUploadJob.createJob(userId, restaurantId, fileName, totalRows);
    await BulkUploadJob.startProcessingJob(job.job_id);

    const { validRows, invalidRows, errors } = await csvParserService.validateRows(rows);

    // Reconciliation: valid + invalid must equal total rows parsed
    if (validRows.length + invalidRows.length !== totalRows) {
      logger.warn(`Reconciliation mismatch for job ${job.job_id}: valid(${validRows.length}) + invalid(${invalidRows.length}) != total(${totalRows})`);
    }

    // Store validation failures as failed records (stage: 'validation')
    const validationFailedRecords = errors.map((e) => ({
      rowNumber: e.row,
      rawData: rows[e.row - 2] || {},
      error: e.error,
      stage: 'validation',
    }));

    if (validRows.length === 0) {
      await BulkUploadJob.updateJobStatus(job.job_id, 'failed', 0, invalidRows.length);
      await BulkUploadFailedRecord.insertFailedRecords(job.job_id, validationFailedRecords);
      deleteFile(filePath);
      return error(res, 'No valid rows found', 400, errors);
    }

    const { importedRows, skippedRows, failedRecords } = await importService.importRows(validRows, userId, restaurantId);

    // Persist all failed records (validation + import) for troubleshooting and reprocessing
    await BulkUploadFailedRecord.insertFailedRecords(job.job_id, [
      ...validationFailedRecords,
      ...failedRecords,
    ]);

    if (importedRows === 0) {
      await BulkUploadJob.failJob(job.job_id, validRows.length, invalidRows.length, errors);
    } else if (invalidRows.length > 0 || skippedRows > 0) {
      await BulkUploadJob.partialJob(job.job_id, importedRows, skippedRows, validRows.length, invalidRows.length, errors);
    } else {
      await BulkUploadJob.completeJob(job.job_id, importedRows, skippedRows, validRows.length, invalidRows.length, errors);
    }

    deleteFile(filePath);

    return success(res, {
      importId: job.job_id,
      jobId: job.job_id,
      totalRows,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      importedRows,
      skippedRows,
      failedRecordCount: validationFailedRecords.length + failedRecords.length,
      errors,
    }, 'File uploaded and processed successfully');
  } catch (err) {
    if (filePath) deleteFile(filePath);
    next(err);
  }
};
const getJobStatus = async (req, res, next) => {
  try {
    const job = await BulkUploadJob.findByJobId(req.params.jobId);
    if (!job) return error(res, 'Job not found', 404);
    return success(res, job, 'Job fetched successfully');
  } catch (err) {
    next(err);
  }
};
const getAllJobs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const jobs = await BulkUploadJob.findAll(limit, offset);
    return success(res, jobs, 'Jobs fetched successfully');
  } catch (err) {
    next(err);
  }
};
const deleteJob = async (req, res, next) => {
  try {
    const job = await BulkUploadJob.findByJobId(req.params.jobId);
    if (!job) return error(res, 'Job not found', 404);
    await BulkUploadJob.deleteJob(req.params.jobId);
    return success(res, 'Job deleted successfully');
  } catch (err) {
    next(err);
  }
};
const getJobItems = async (req, res, next) => {
  try {
    const job = await BulkUploadJob.findByJobId(req.params.jobId);
    if (!job) return error(res, 'Job not found', 404);
    const pool = require('../config/database');
    const { rows } = await pool.query(
      `SELECT * FROM menu_items
       WHERE user_id = $1 AND restaurant_id = $2
       ORDER BY display_order ASC NULLS LAST, item_name ASC`,
      [job.user_id, job.restaurant_id]
    );
    return success(res, rows, 'Menu items fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getJobFailedRecords = async (req, res, next) => {
  try {
    const job = await BulkUploadJob.findByJobId(req.params.jobId);
    if (!job) return error(res, 'Job not found', 404);
    const records = await BulkUploadFailedRecord.findByJobId(req.params.jobId);
    return success(res, { importId: job.job_id, failedRecords: records }, 'Failed records fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.findByUserId(req.user.id);
    return success(res, restaurants, 'Restaurants fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getMenuItems = async (req, res, next) => {
  try {
    const pool = require('../config/database');
    const { restaurant_id, search, status } = req.query;
    const userId = req.user.id;

    // Always get the restaurant total (ignoring search/status filters)
    const totalParams = [userId];
    let totalQuery = `SELECT COUNT(*) AS total, COUNT(DISTINCT category) AS categories FROM menu_items WHERE user_id = $1`;
    if (restaurant_id) {
      totalParams.push(restaurant_id);
      totalQuery += ` AND restaurant_id = $2`;
    }
    const { rows: totalRows } = await pool.query(totalQuery, totalParams);
    const totalItems = parseInt(totalRows[0].total);
    const totalCategories = parseInt(totalRows[0].categories);

    // Filtered items (with search + status)
    let query = `SELECT * FROM menu_items WHERE user_id = $1`;
    const params = [userId];
    if (restaurant_id) {
      params.push(restaurant_id);
      query += ` AND restaurant_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND item_name ILIKE $${params.length}`;
    }
    query += ` ORDER BY display_order ASC NULLS LAST, item_name ASC`;
    const { rows: items } = await pool.query(query, params);

    return success(res, { items, totalItems, totalCategories, filteredCount: items.length }, 'Menu items fetched successfully');
  } catch (err) {
    next(err);
  }
};

const downloadTemplate = async (req, res, next) => {
  try {
    const filePath = await templateService.generateTemplate();
    res.download(filePath, 'bulk_upload_template.csv', (err) => {
      if (err) next(err);
      deleteFile(filePath);
    });
  } catch (err) {
    next(err);
  }
};
module.exports = { uploadFile, getJobStatus, getJobItems, getJobFailedRecords, getAllJobs, deleteJob, downloadTemplate, getRestaurants, getMenuItems };
