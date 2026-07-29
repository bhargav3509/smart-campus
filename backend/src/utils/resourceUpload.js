const multer = require('multer');
const path = require('path');

// Memory storage — files stream to S3 (same pattern as existing upload.js)
const storage = multer.memoryStorage();

const ALLOWED_EXTENSIONS = /pdf|doc|docx|ppt|pptx|zip|jpeg|jpg|png|gif|webp/;
const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const fileFilter = (req, file, cb) => {
  const extOk = ALLOWED_EXTENSIONS.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = ALLOWED_MIMETYPES.includes(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, ZIP, JPEG, PNG, GIF, WEBP'));
  }
};

const resourceUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

module.exports = resourceUpload;
