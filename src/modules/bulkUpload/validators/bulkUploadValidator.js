const { error } = require('../utils/responseFormatter');
const UPLOAD_CONSTANTS = require('../constants/uploadConstants');

const validateUploadRequest = (req, res, next) => {
  if (!req.file) {
    return error(res, 'No file uploaded', 400);
  }

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  if (!UPLOAD_CONSTANTS.ALLOWED_FILE_TYPES.includes(ext)) {
    return error(res, `Invalid file type. Allowed: ${UPLOAD_CONSTANTS.ALLOWED_FILE_TYPES.join(', ')}`, 400);
  }

  if (req.file.size > UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES) {
    return error(res, `File too large. Maximum size is ${UPLOAD_CONSTANTS.MAX_FILE_SIZE_MB}MB`, 400);
  }

  next();
};

const validateJobId = (req, res, next) => {
  const { jobId } = req.params;

  if (!jobId || jobId.trim() === '') {
    return error(res, 'Job ID is required', 400);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(jobId)) {
    return error(res, 'Invalid Job ID format', 400);
  }

  next();
};

const validatePagination = (req, res, next) => {
  const limit = parseInt(req.query.limit);
  const offset = parseInt(req.query.offset);

  if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 100)) {
    return error(res, 'limit must be a number between 1 and 100', 400);
  }

  if (req.query.offset && (isNaN(offset) || offset < 0)) {
    return error(res, 'offset must be a non-negative number', 400);
  }

  next();
};

module.exports = { validateUploadRequest, validateJobId, validatePagination };
