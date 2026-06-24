const app = require('./app');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./config/db');
require('./models');

dotenv.config();

const PORT = process.env.PORT || 4000;

const start = async () => {
  await connectDB();
  await sequelize.sync({ alter: true });
  console.log('✅ Tables synced');
  app.listen(PORT, () => {
    console.log(`🚀 FoodieGO backend running on http://localhost:${PORT}`);
  });
};

start();
