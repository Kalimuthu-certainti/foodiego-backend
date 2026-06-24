const pool = require('../config/database');

// The template generator (GET /api/bulk-upload/template) reads reference
// categories from this table. Create it and seed a few common ones so the
// downloaded CSV template has sensible category options.
const up = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(100) NOT NULL,
      sub_category  VARCHAR(100),
      created_at    TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('categories table created');

  // Seed once (only if empty) so re-running the migration stays idempotent.
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM categories`);
  if (rows[0].count === 0) {
    await pool.query(`
      INSERT INTO categories (name, sub_category) VALUES
        ('Starters', 'Vegetarian'),
        ('Starters', 'Non-Vegetarian'),
        ('Main Course', 'Vegetarian'),
        ('Main Course', 'Non-Vegetarian'),
        ('Breads', NULL),
        ('Rice & Biryani', NULL),
        ('Desserts', NULL),
        ('Beverages', NULL);
    `);
    console.log('categories seeded');
  } else {
    console.log('categories already present — skipping seed');
  }
};

const down = async () => {
  await pool.query(`DROP TABLE IF EXISTS categories`);
  console.log('categories table dropped');
};

module.exports = { up, down };
