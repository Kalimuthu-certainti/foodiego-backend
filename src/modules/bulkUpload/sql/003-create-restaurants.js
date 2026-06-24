const pool = require('../config/database');

const up = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id            SERIAL PRIMARY KEY,
      restaurant_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
      user_id       UUID NOT NULL,
      name          VARCHAR(255) NOT NULL,
      address       TEXT,
      phone         VARCHAR(20),
      cuisine_type  VARCHAR(100),
      status        VARCHAR(50) NOT NULL DEFAULT 'active',
      created_at    TIMESTAMP DEFAULT NOW(),
      updated_at    TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('restaurants table created');

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_restaurants_user_id
    ON restaurants(user_id);
  `);
  console.log('index on restaurants.user_id created');

  await pool.query(`
    ALTER TABLE menu_items
    ADD COLUMN IF NOT EXISTS restaurant_id UUID;
  `);
  console.log('restaurant_id column added to menu_items');

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id
    ON menu_items(restaurant_id);
  `);
  console.log('index on menu_items.restaurant_id created');
};

const down = async () => {
  await pool.query(`ALTER TABLE menu_items DROP COLUMN IF EXISTS restaurant_id`);
  await pool.query(`DROP TABLE IF EXISTS restaurants`);
  console.log('restaurants table dropped and restaurant_id removed from menu_items');
};

module.exports = { up, down };
