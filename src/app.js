const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'https://diner.foodiego.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(require('./middleware/requestLogger'));
app.use('/api', require('./middleware/rateLimiter').globalLimiter);

app.use('/api/diner',             require('./modules/diner-auth/routes/authRoutes'));
app.use('/api/diner/banners',     require('./routes/banners'));
app.use('/api/diner/cuisines',    require('./routes/cuisines'));
app.use('/api/diner/restaurants', require('./routes/restaurants'));
app.use('/api/diner/location',    require('./routes/location'));
app.use('/api/diner/orders',      require('./routes/orders'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(require('./middleware/errorHandler'));

module.exports = app;
