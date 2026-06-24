const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('./modules/diner-auth/routes/authRoutes');

const app = express();

// ── Security & parsing middleware ────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
app.use('/api/diner', authRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'diner-auth' }));

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Something went wrong. Please try again.';
  res.status(status).json({ error: message });
});

module.exports = app;
