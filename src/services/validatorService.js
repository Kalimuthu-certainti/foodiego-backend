const UPLOAD_CONSTANTS = require('../constants/uploadConstants');

const validateRow = (row, rowNumber) => {
  const errors = [];
  const sanitized = {};

  // Check required columns
  for (const col of UPLOAD_CONSTANTS.REQUIRED_COLUMNS) {
    if (!row[col] || String(row[col]).trim() === '') {
      errors.push(`${col} is required`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, error: errors.join(', '), sanitized: null };
  }

  // item_name
  sanitized.item_name = String(row.item_name).trim();

  // category
  sanitized.category = String(row.category).trim();

  // sub_category
  sanitized.sub_category = row.sub_category ? String(row.sub_category).trim() : null;

  // description
  sanitized.description = row.description ? String(row.description).trim() : null;

  // price
  const price = parseFloat(row.price);
  if (isNaN(price) || price < 0) {
    errors.push('price must be a positive number');
  } else {
    sanitized.price = price;
  }

  // discount_price
  if (row.discount_price !== '' && row.discount_price !== undefined) {
    const discountPrice = parseFloat(row.discount_price);
    if (isNaN(discountPrice) || discountPrice < 0) {
      errors.push('discount_price must be a positive number');
    } else if (discountPrice >= price) {
      errors.push('discount_price must be less than price');
    } else {
      sanitized.discount_price = discountPrice;
    }
  } else {
    sanitized.discount_price = null;
  }

  // tax_percentage
  const tax = parseFloat(row.tax_percentage);
  if (!UPLOAD_CONSTANTS.TAX_PERCENTAGES.includes(tax)) {
    errors.push(`tax_percentage must be one of: ${UPLOAD_CONSTANTS.TAX_PERCENTAGES.join(', ')}`);
  } else {
    sanitized.tax_percentage = tax;
  }

  // food_type
  if (!UPLOAD_CONSTANTS.FOOD_TYPES.includes(row.food_type)) {
    errors.push(`food_type must be one of: ${UPLOAD_CONSTANTS.FOOD_TYPES.join(', ')}`);
  } else {
    sanitized.food_type = row.food_type;
  }

  // spice_level
  if (row.spice_level && !UPLOAD_CONSTANTS.SPICE_LEVELS.includes(row.spice_level)) {
    errors.push(`spice_level must be one of: ${UPLOAD_CONSTANTS.SPICE_LEVELS.join(', ')}`);
  } else {
    sanitized.spice_level = row.spice_level || null;
  }

  // status
  if (!UPLOAD_CONSTANTS.ITEM_STATUS.includes(row.status)) {
    errors.push(`status must be one of: ${UPLOAD_CONSTANTS.ITEM_STATUS.join(', ')}`);
  } else {
    sanitized.status = row.status;
  }

  // calories
  if (row.calories !== '' && row.calories !== undefined) {
    const calories = parseInt(row.calories);
    if (isNaN(calories) || calories < 0) {
      errors.push('calories must be a positive integer');
    } else {
      sanitized.calories = calories;
    }
  } else {
    sanitized.calories = null;
  }

  // image_url
  if (row.image_url && String(row.image_url).trim() !== '') {
    const url = String(row.image_url).trim();
    if (!UPLOAD_CONSTANTS.VALIDATION_RULES.URL_FORMAT.test(url)) {
      errors.push('image_url must be a valid http/https URL');
    } else {
      sanitized.image_url = url;
    }
  } else {
    sanitized.image_url = null;
  }

  // allergens
  sanitized.allergens = row.allergens ? String(row.allergens).trim() : null;

  // packaging_charge
  if (row.packaging_charge !== '' && row.packaging_charge !== undefined) {
    const charge = parseFloat(row.packaging_charge);
    if (isNaN(charge) || charge < 0) {
      errors.push('packaging_charge must be a positive number');
    } else {
      sanitized.packaging_charge = charge;
    }
  } else {
    sanitized.packaging_charge = null;
  }

  // display_order
  if (row.display_order !== '' && row.display_order !== undefined) {
    const order = parseInt(row.display_order);
    if (isNaN(order) || order < 0) {
      errors.push('display_order must be a positive integer');
    } else {
      sanitized.display_order = order;
    }
  } else {
    sanitized.display_order = null;
  }

  // boolean fields
  sanitized.is_featured = row.is_featured === 'true' || row.is_featured === true;
  sanitized.is_bestseller = row.is_bestseller === 'true' || row.is_bestseller === true;
  sanitized.is_customizable = row.is_customizable === 'true' || row.is_customizable === true;

  // available_from / available_to — must match HH:MM if provided
  if (row.available_from && String(row.available_from).trim() !== '') {
    const val = String(row.available_from).trim();
    if (!UPLOAD_CONSTANTS.VALIDATION_RULES.TIME_FORMAT.test(val)) {
      errors.push('available_from must be in HH:MM format (e.g. 09:00)');
    } else {
      sanitized.available_from = val;
    }
  } else {
    sanitized.available_from = null;
  }

  if (row.available_to && String(row.available_to).trim() !== '') {
    const val = String(row.available_to).trim();
    if (!UPLOAD_CONSTANTS.VALIDATION_RULES.TIME_FORMAT.test(val)) {
      errors.push('available_to must be in HH:MM format (e.g. 22:00)');
    } else {
      sanitized.available_to = val;
    }
  } else {
    sanitized.available_to = null;
  }

  if (errors.length > 0) {
    return { isValid: false, error: errors.join(', '), sanitized: null };
  }

  return { isValid: true, error: null, sanitized };
};

module.exports = { validateRow };
