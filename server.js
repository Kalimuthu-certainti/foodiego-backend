require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/config/database');

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await sequelize.authenticate();
    console.log(' Database connected');

    app.listen(PORT, () => {
      console.log(`Diner Auth Service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
