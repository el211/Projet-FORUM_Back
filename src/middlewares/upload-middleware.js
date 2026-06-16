const fs = require('fs');
const path = require('path');
const multer = require('multer');

const { HttpError } = require('../errors/http-error');

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

// FTB-1: messages can carry an attached image. Files are stored on disk and
// served back statically; only the public URL is kept in the database.
function createUploadMiddleware(config) {
  const uploadDir = path.resolve(process.cwd(), config.app.uploads.dir);
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination(_request, _file, callback) {
      callback(null, uploadDir);
    },
    filename(_request, file, callback) {
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
      callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: (config.app.uploads.maxFileSizeMb || 5) * 1024 * 1024 },
    fileFilter(_request, file, callback) {
      if (ALLOWED_MIME.has(file.mimetype)) {
        callback(null, true);
        return;
      }
      callback(new HttpError(400, 'Only PNG, JPEG, GIF or WebP images are allowed'));
    }
  });

  return upload.single('image');
}

module.exports = {
  createUploadMiddleware
};
