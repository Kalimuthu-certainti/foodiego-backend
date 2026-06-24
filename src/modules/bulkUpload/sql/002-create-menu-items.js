const pool = require('../config/database');

const up = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id                SERIAL PRIMARY KEY,
      user_id           UUID NOT NULL,
      item_name         VARCHAR(255) NOT NULL,
      category          VARCHAR(255) NOT NULL,
      sub_category      VARCHAR(255),
      description       TEXT,
      price             NUMERIC(10, 2) NOT NULL,
      discount_price    NUMERIC(10, 2),
      tax_percentage    NUMERIC(5, 2) NOT NULL,
      image_url         TEXT,
      food_type         VARCHAR(50) NOT NULL,
      spice_level       VARCHAR(50),
      calories          INTEGER,
      allergens         TEXT,
      status            VARCHAR(50) NOT NULL DEFAULT 'active',
      available_from    VARCHAR(10),
      available_to      VARCHAR(10),
      packaging_charge  NUMERIC(10, 2),
      display_order     INTEGER,
      is_featured       BOOLEAN DEFAULT false,
      is_bestseller     BOOLEAN DEFAULT false,
      is_customizable   BOOLEAN DEFAULT false,
      created_at        TIMESTAMP DEFAULT NOW(),
      updated_at        TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('menu_items table created');

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_menu_items_user_id
    ON menu_items(user_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_menu_items_category
    ON menu_items(category);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_menu_items_status
    ON menu_items(status);
  `);

  console.log('indexes on menu_items created');
};

const down = async () => {
  await pool.query(`DROP TABLE IF EXISTS menu_items`);
  console.log('menu_items table dropped');
};

module.exports = { up, down };
