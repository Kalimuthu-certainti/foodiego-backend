const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { isAdminOrOwner } = require('../middlewares/authMiddleware');
const { validateUploadRequest, validateJobId, validatePagination } = require('../validators/bulkUploadValidator');
const {
  uploadFile,
  getJobStatus,
  getJobItems,
  getJobFailedRecords,
  getAllJobs,
  deleteJob,
  downloadTemplate,
  getRestaurants,
  getMenuItems,
} = require('../controllers/bulkUploadController');

router.get('/restaurants', isAdminOrOwner, getRestaurants);
router.get('/menu-items', isAdminOrOwner, getMenuItems);
router.post('/upload', isAdminOrOwner, upload.single('file'), validateUploadRequest, uploadFile);
router.get('/jobs', isAdminOrOwner, validatePagination, getAllJobs);
router.get('/jobs/:jobId', isAdminOrOwner, validateJobId, getJobStatus);
router.get('/jobs/:jobId/items', isAdminOrOwner, validateJobId, getJobItems);
router.get('/jobs/:jobId/failed-records', isAdminOrOwner, validateJobId, getJobFailedRecords);
router.delete('/jobs/:jobId', isAdminOrOwner, validateJobId, deleteJob);
router.get('/template', isAdminOrOwner, downloadTemplate);

module.exports = router;
