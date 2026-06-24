const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Generate unique filename
const generateFileName = (originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  return `upload_${timestamp}_${uniqueId}${ext}`;
};

// Get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase().replace('.', '');
};

// Check if file exists
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Delete file
const deleteFile = (filePath) => {
  try {
    if (fileExists(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error deleting file:', err);
    return false;
  }
};

// Get file size in MB
const getFileSizeInMB = (filePath) => {
  const stats = fs.statSync(filePath);
  return (stats.size / (1024 * 1024)).toFixed(2);
};

// Create upload directory if not exists
const ensureUploadDir = () => {
  const uploadDir = process.env.UPLOAD_DIR || 'src/uploads';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// Get full file path
const getFilePath = (filename) => {
  const uploadDir = process.env.UPLOAD_DIR || 'src/uploads';
  return path.join(uploadDir, filename);
};

module.exports = {
  generateFileName,
  getFileExtension,
  fileExists,
  deleteFile,
  getFileSizeInMB,
  ensureUploadDir,
  getFilePath,
};