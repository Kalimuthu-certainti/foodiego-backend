require('dotenv').config();
const migration1 = require('./001-create-bulk-upload-jobs');
const migration2 = require('./002-create-menu-items');
const migration3 = require('./003-create-restaurants');
const migration4 = require('./004-create-bulk-upload-failed-records');

async function runMigrations() {
  try {
    console.log('Running migrations...');
    await migration1.up();
    await migration2.up();
    await migration3.up();
    await migration4.up();
    console.log('All migrations completed!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigrations();