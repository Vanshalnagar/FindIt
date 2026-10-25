import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { getConfig } from '../config/index.js';
import { sanitizeValue } from './sanitize.js';
import { badRequest } from '../utils/HttpError.js';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

function sniff(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length >= 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

export function removeUploadedFile(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
  const file = path.join(getConfig().uploadDir, path.basename(imageUrl));
  fs.promises.unlink(file).catch(() => {});
}

/**
 * Accepts an optional `image` field in multipart bodies. Non-multipart requests pass through.
 * Validates declared mime type, size (2MB) and magic bytes; stores under a random filename.
 * Sets req.uploadedImageUrl when a file was saved.
 */
export function uploadImage(req, res, next) {
  if (!req.is('multipart/form-data')) return next();
  const dir = getConfig().uploadDir;
  fs.mkdirSync(dir, { recursive: true });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 20, fieldSize: 20 * 1024 },
    fileFilter(_req, file, cb) {
      if (file.fieldname !== 'image') return cb(badRequest(`Unexpected file field "${file.fieldname}"`));
      if (!EXT[file.mimetype]) return cb(badRequest('Image must be JPEG, PNG or WebP', [{ field: 'image', message: 'Image must be JPEG, PNG or WebP' }]));
      cb(null, true);
    },
  }).single('image');

  upload(req, res, async (err) => {
    if (err) return next(err);
    try {
      req.body = sanitizeValue(req.body || {});
      if (req.file) {
        const real = sniff(req.file.buffer);
        if (!real || real !== req.file.mimetype) {
          return next(badRequest('Image content does not match a valid JPEG, PNG or WebP file', [
            { field: 'image', message: 'Invalid image file' },
          ]));
        }
        const name = `${crypto.randomUUID()}${EXT[real]}`;
        await fs.promises.writeFile(path.join(dir, name), req.file.buffer, { flag: 'wx' });
        req.uploadedImageUrl = `/uploads/${name}`;
        delete req.file.buffer;
      }
      next();
    } catch (e) {
      next(e);
    }
  });
}
