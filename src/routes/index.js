const express = require('express');
const router = express.Router();
const bulkUploadRoutes = require('./bulkUploadRoutes');
const supersetRoutes = require('./supersetRoutes');

router.use('/bulk-upload', bulkUploadRoutes);
router.use('/superset', supersetRoutes);

module.exports = router;
