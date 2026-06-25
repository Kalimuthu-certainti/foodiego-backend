const pool = require('../config/database');

// The import upserts with ON CONFLICT (user_id, restaurant_id, item_name, category),
// which requires a UNIQUE index on exactly those columns — otherwise Postgres errors
// "there is no unique or exclusion constraint matching the ON CONFLICT specification"
// and every row fails at the import stage. This adds that unique index (idempotent),
// which also gives the intended behaviour: re-uploading the same item updates it.
const up = async () => {
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_items_user_restaurant_item_category
    ON menu_items (user_id, restaurant_id, item_name, category);
  `);
  console.log('unique index on menu_items (user_id, restaurant_id, item_name, category) created');
};

const down = async () => {
  await pool.query(`DROP INDEX IF EXISTS uq_menu_items_user_restaurant_item_category`);
  console.log('unique index on menu_items dropped');
};

module.exports = { up, down };
