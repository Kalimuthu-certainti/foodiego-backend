const pool = require('../config/database');

const findByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT * FROM restaurants WHERE user_id = $1 AND status = 'active' ORDER BY name ASC`,
    [userId]
  );
  return rows;
};

const findByRestaurantId = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT * FROM restaurants WHERE restaurant_id = $1`,
    [restaurantId]
  );
  return rows[0] || null;
};

// Create the restaurant if it doesn't exist yet (keyed by its UUID), else refresh
// its name. The app's real restaurants live in the main (in-memory) backend, so
// this bridges a chosen restaurant into this module's Postgres on first upload.
const upsert = async (restaurantId, userId, name) => {
  const { rows } = await pool.query(
    `INSERT INTO restaurants (restaurant_id, user_id, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (restaurant_id)
       DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
     RETURNING *`,
    [restaurantId, userId, name]
  );
  return rows[0];
};

module.exports = { findByUserId, findByRestaurantId, upsert };
