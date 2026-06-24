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

module.exports = { findByUserId, findByRestaurantId };
