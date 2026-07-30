import multer from 'multer';
import { RequestHandler } from 'express';

export const evidenceUpload: RequestHandler = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);