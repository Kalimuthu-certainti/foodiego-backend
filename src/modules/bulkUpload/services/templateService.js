const fs = require('fs');
const path = require('path');
const { stringify } = require('csv-stringify/sync');
const pool = require('../config/database');
const UPLOAD_CONSTANTS = require('../constants/uploadConstants');
const { ensureUploadDir } = require('../utils/fileHelper');

// EXTRACT — pull real data from DfB
const extractReferenceData = async () => {
  const categoriesResult = await pool.query(
    `SELECT DISTINCT name, sub_category FROM categories ORDER BY name`
  );

  return {
    categories: categoriesResult.rows,
  };
};

// TRANSFORM — build template rows from real data
const transformToTemplateRows = (categories) => {
  if (!categories.length) return [];

  return categories.map((cat, index) => ({
    item_name: '',
    category: cat.name,
    sub_category: cat.sub_category || '',
    description: '',
    price: '',
    discount_price: '',
    tax_percentage: UPLOAD_CONSTANTS.TAX_PERCENTAGES[0],
    image_url: '',
    food_type: UPLOAD_CONSTANTS.FOOD_TYPES[0],
    spice_level: UPLOAD_CONSTANTS.SPICE_LEVELS[0],
    calories: '',
    allergens: '',
    status: UPLOAD_CONSTANTS.ITEM_STATUS[0],
    available_from: '',
    available_to: '',
    packaging_charge: '',
    display_order: index + 1,
    is_featured: 'false',
    is_bestseller: 'false',
    is_customizable: 'false',
  }));
};

// LOAD — write to CSV file
const loadToCSV = (filePath, rows) => {
  const headers = UPLOAD_CONSTANTS.TEMPLATE_COLUMNS;

  const csvContent = stringify(rows, {
    header: true,
    columns: headers,
  });

  fs.writeFileSync(filePath, csvContent);
};

// Main ETL pipeline
const generateTemplate = async () => {
  const uploadDir = ensureUploadDir();
  
  const filePath = path.join(uploadDir, `bulk_upload_template_${Date.now()}.csv`);

  const { categories } = await extractReferenceData();
  const rows = transformToTemplateRows(categories);
  loadToCSV(filePath, rows);

  return filePath;
};

module.exports = { generateTemplate };
