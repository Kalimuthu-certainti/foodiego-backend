const UPLOAD_CONSTANTS = {

  // Allowed file types
  ALLOWED_FILE_TYPES: ['csv', 'xlsx'],
  ALLOWED_MIME_TYPES: [
    // CSV variants — browsers report these inconsistently
    'text/csv',
    'text/plain',
    'application/csv',
    'application/octet-stream',
    // Excel variants
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/excel',
    'application/x-excel',
  ],

  // File size limit
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB

  // Row limits
  MAX_ROWS_PER_UPLOAD: 500,
  MIN_ROWS_PER_UPLOAD: 1,

  // Job status
  JOB_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PARTIAL: 'partial',
  },

  // Food types
  FOOD_TYPES: ['Veg', 'Non-Veg', 'Egg'],

  // Spice levels
  SPICE_LEVELS: ['Mild', 'Medium', 'Spicy', 'Extra Spicy'],

  // Tax percentages
  TAX_PERCENTAGES: [0, 5, 12, 18, 28],

  // Item status
  ITEM_STATUS: ['active', 'inactive'],

  // CSV template columns
  TEMPLATE_COLUMNS: [
    'item_name',
    'category',
    'sub_category',
    'description',
    'price',
    'discount_price',
    'tax_percentage',
    'image_url',
    'food_type',
    'spice_level',
    'calories',
    'allergens',
    'status',
    'available_from',
    'available_to',
    'packaging_charge',
    'display_order',
    'is_featured',
    'is_bestseller',
    'is_customizable',
  ],

  // Required columns
  REQUIRED_COLUMNS: [
    'item_name',
    'category',
    'price',
    'food_type',
    'tax_percentage',
    'status',
  ],

  // Chunk size for batch DB inserts
  IMPORT_CHUNK_SIZE: 50,

  // Configurable validation rules
  VALIDATION_RULES: {
    TIME_FORMAT: /^([01]\d|2[0-3]):([0-5]\d)$/,           // HH:MM
    URL_FORMAT: /^https?:\/\/[^\s$.?#].[^\s]*$/i,          // http/https URL
    MAX_ITEM_NAME_LENGTH: 255,
    MAX_DESCRIPTION_LENGTH: 1000,
    MAX_ALLERGENS_LENGTH: 500,
  },

};

module.exports = UPLOAD_CONSTANTS;