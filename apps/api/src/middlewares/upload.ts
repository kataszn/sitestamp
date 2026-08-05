import multer from 'multer';
import { RequestHandler } from 'express';

const ALLOWED_IMAGE_MIMETYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
  'image/tiff',
]);

export const evidenceUpload: RequestHandler = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Only enforce the image type check on the 'image' field; audio is
    // handled separately (transcribed, never saved as an image).
    if (file.fieldname === 'image' && !ALLOWED_IMAGE_MIMETYPES.has(file.mimetype)) {
      const err = new Error(
        `Unsupported image type "${file.mimetype}". Allowed types: JPEG, PNG, WebP, GIF, AVIF, BMP, TIFF.`
      ) as multer.MulterError;
      err.name = 'MulterError';
      err.code = 'UNSUPPORTED_IMAGE_TYPE' as multer.MulterError['code'];
      return cb(err);
    }
    cb(null, true);
  },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);