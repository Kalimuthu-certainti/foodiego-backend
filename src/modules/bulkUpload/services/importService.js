const pool = require('../config/database');
const UPLOAD_CONSTANTS = require('../constants/uploadConstants');

const INSERT_QUERY = `
  INSERT INTO menu_items (
    user_id, restaurant_id, item_name, category, sub_category, description,
    price, discount_price, tax_percentage, image_url, food_type,
    spice_level, calories, allergens, status, available_from,
    available_to, packaging_charge, display_order, is_featured,
    is_bestseller, is_customizable, created_at, updated_at
  ) VALUES (
    $1, $2, $3, $4, $5, $6,
    $7, $8, $9, $10, $11,
    $12, $13, $14, $15, $16,
    $17, $18, $19, $20,
    $21, $22, NOW(), NOW()
  )
  ON CONFLICT (user_id, restaurant_id, item_name, category)
  DO UPDATE SET
    sub_category     = EXCLUDED.sub_category,
    description      = EXCLUDED.description,
    price            = EXCLUDED.price,
    discount_price   = EXCLUDED.discount_price,
    tax_percentage   = EXCLUDED.tax_percentage,
    image_url        = EXCLUDED.image_url,
    food_type        = EXCLUDED.food_type,
    spice_level      = EXCLUDED.spice_level,
    calories         = EXCLUDED.calories,
    allergens        = EXCLUDED.allergens,
    status           = EXCLUDED.status,
    available_from   = EXCLUDED.available_from,
    available_to     = EXCLUDED.available_to,
    packaging_charge = EXCLUDED.packaging_charge,
    display_order    = EXCLUDED.display_order,
    is_featured      = EXCLUDED.is_featured,
    is_bestseller    = EXCLUDED.is_bestseller,
    is_customizable  = EXCLUDED.is_customizable,
    updated_at       = NOW()
`;

const buildValues = (row, userId, restaurantId) => [
  userId, restaurantId,
  row.item_name, row.category, row.sub_category, row.description,
  row.price, row.discount_price, row.tax_percentage, row.image_url, row.food_type,
  row.spice_level, row.calories, row.allergens, row.status,
  row.available_from, row.available_to, row.packaging_charge, row.display_order,
  row.is_featured, row.is_bestseller, row.is_customizable,
];

// validRows: array of { data, rowNumber, rawData } from csvParserService
const importRows = async (validRows, userId, restaurantId) => {
  let importedRows = 0;
  let skippedRows = 0;
  const failedRecords = [];

  const chunkSize = UPLOAD_CONSTANTS.IMPORT_CHUNK_SIZE;

  for (let i = 0; i < validRows.length; i += chunkSize) {
    const chunk = validRows.slice(i, i + chunkSize);

    for (const { data, rowNumber, rawData } of chunk) {
      try {
        await pool.query(INSERT_QUERY, buildValues(data, userId, restaurantId));
        importedRows++;
      } catch (err) {
        skippedRows++;
        failedRecords.push({
          rowNumber,
          rawData,
          error: err.message,
          stage: 'import',
        });
      }
    }
  }

  // Reconciliation: importedRows + skippedRows must equal total valid rows processed
  const total = importedRows + skippedRows;
  if (total !== validRows.length) {
    throw new Error(`Reconciliation error: processed ${total} rows but expected ${validRows.length}`);
  }

  return { importedRows, skippedRows, failedRecords };
};

module.exports = { importRows };
