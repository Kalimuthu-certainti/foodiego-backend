
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: null,   // always present for frontend consistency
  });
};
const error = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors,         // moved after data for consistent field order
  });
};

const notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    message,
    data: null,
    errors: null,
  });
};

const validationError = (res, errors = [], message = 'Validation failed') => {
  return res.status(400).json({
    success: false,
    message,
    data: null,
    errors,         // always an array of validation messages
  });
};
const uploadSuccess = (res, data = {}) => {
  return res.status(200).json({
    success: true,
    message: 'File uploaded and processed successfully',
    data: {
      jobId:       data.jobId       ?? null,
      totalRows:   data.totalRows   ?? 0,
      validRows:   data.validRows   ?? 0,
      invalidRows: data.invalidRows ?? 0,
      errors:      data.errors      ?? [],    // default empty array not null
      preview:     data.preview     ?? [],    // default empty array not null
    },
    errors: null,
  });
};

// Bulk Import Completed Response
const importSuccess = (res, data = {}) => {
  return res.status(200).json({
    success: true,
    message: 'Bulk import completed successfully',
    data: {
      jobId:    data.jobId    ?? null,
      imported: data.imported ?? 0,     // default 0 not undefined
      skipped:  data.skipped  ?? 0,     // default 0 not undefined
      total:    data.total    ?? 0,     // default 0 not undefined
    },
    errors: null,
  });
};


const paginatedSuccess = (res, data = [], total = 0, limit = 20, offset = 0, message = 'Fetched successfully') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,                                        // total records in DB
      limit,                                        // records per page
      offset,                                       // records skipped
      currentPage: Math.floor(offset / limit) + 1, // current page number
      totalPages:  Math.ceil(total / limit),        // total number of pages
      hasMore:     offset + limit < total,          // is there a next page?
    },
    errors: null,
  });
};

module.exports = {
  success,
  error,
  notFound,
  validationError,
  uploadSuccess,
  importSuccess,
  paginatedSuccess,
};