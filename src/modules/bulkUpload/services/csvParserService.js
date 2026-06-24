const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const path = require('path');
const validatorService = require('./validatorService');
const UPLOAD_CONSTANTS = require('../constants/uploadConstants');

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', (err) => reject(err));
  });
};

const parseXLSX = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rows;
};

const parseFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  let rows = [];

  if (ext === 'csv') {
    rows = await parseCSV(filePath);
  } else if (ext === 'xlsx' || ext === 'xls') {
    rows = parseXLSX(filePath);
  } else {
    throw new Error('INVALID_FILE_TYPE');
  }

  if (rows.length > UPLOAD_CONSTANTS.MAX_ROWS_PER_UPLOAD) {
    throw new Error(`File exceeds maximum row limit of ${UPLOAD_CONSTANTS.MAX_ROWS_PER_UPLOAD}`);
  }

  if (rows.length < UPLOAD_CONSTANTS.MIN_ROWS_PER_UPLOAD) {
    throw new Error('File is empty or has no data rows');
  }

  return { rows, totalRows: rows.length };
};

const validateRows = async (rows) => {
  const validRows = [];
  const invalidRows = [];
  const errors = [];

  // Track display_order usage per (category|sub_category) to catch duplicates within the upload
  const displayOrderTracker = new Map();

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; // row 1 = header
    const { isValid, error, sanitized } = validatorService.validateRow(rows[i], rowNumber);

    if (!isValid) {
      invalidRows.push(rows[i]);
      errors.push({ row: rowNumber, error });
      continue;
    }

    // Cross-row: display_order must be unique within the same category + sub_category
    if (sanitized.display_order !== null && sanitized.display_order !== undefined) {
      const subMenuKey = `${sanitized.category}|${sanitized.sub_category || ''}`;
      if (!displayOrderTracker.has(subMenuKey)) {
        displayOrderTracker.set(subMenuKey, new Set());
      }
      const usedOrders = displayOrderTracker.get(subMenuKey);
      if (usedOrders.has(sanitized.display_order)) {
        invalidRows.push(rows[i]);
        errors.push({
          row: rowNumber,
          error: `display_order ${sanitized.display_order} is already used by another item in the same category/sub-category`,
        });
        continue;
      }
      usedOrders.add(sanitized.display_order);
    }

    // Carry row metadata so the import service can log failures against original data
    validRows.push({ data: sanitized, rowNumber, rawData: rows[i] });
  }

  return { validRows, invalidRows, errors };
};

module.exports = { parseFile, validateRows };
