const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes/index');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bulk Upload Service is running',
    version: '1.0.0',
    endpoints: {
      health:         'GET  /health',
      template:       'GET  /api/bulk-upload/template',
      upload:         'POST /api/bulk-upload/upload',
      jobs:           'GET  /api/bulk-upload/jobs',
      jobStatus:      'GET  /api/bulk-upload/jobs/:jobId',
      jobItems:       'GET  /api/bulk-upload/jobs/:jobId/items',
      jobFailedRows:  'GET  /api/bulk-upload/jobs/:jobId/failed-records',
      deleteJob:      'DELETE /api/bulk-upload/jobs/:jobId',
      restaurants:    'GET  /api/bulk-upload/restaurants',
      menuItems:      'GET  /api/bulk-upload/menu-items',
    },
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Bulk Upload Service is running' });
});

app.use(errorHandler);

module.exports = app;
