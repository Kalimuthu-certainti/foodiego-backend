const multer = require('multer');
const path = require('path');
const { ensureUploadDir, generateFileName } = require('../utils/fileHelper');
const UPLOAD_CONSTANTS = require('../constants/uploadConstants');
require('dotenv').config();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateFileName(file.originalname);
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const isValidExt = UPLOAD_CONSTANTS.ALLOWED_FILE_TYPES.includes(ext);
  const isValidMime = UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES.includes(file.mimetype);

  // Extension is the authoritative check; MIME type is a secondary signal.
  // CSV MIME types vary across browsers/OS so we accept if extension is valid
  // OR if the MIME type is explicitly recognised.
  if (isValidExt || isValidMime) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE'), false);
  }
};
// Multer config
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES,
    files: 1,
  },
});

module.exports = upload;