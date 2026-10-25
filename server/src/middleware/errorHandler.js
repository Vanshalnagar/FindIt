import { ZodError } from 'zod';
import mongoose from 'mongoose';
import multer from 'multer';
import { zodDetails } from './validate.js';
import { removeUploadedFile } from './upload.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl.split('?')[0]}` } });
}

export function errorHandler(err, req, res, _next) {
  // An upload may already have been stored before a later failure.
  if (req.uploadedImageUrl && !req.keepUpload) removeUploadedFile(req.uploadedImageUrl);

  let status = err.status || err.statusCode || 500;
  let message = err.message;
  let details = err.details;

  if (err instanceof ZodError) {
    status = 400; message = 'Validation failed'; details = zodDetails(err);
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 2MB or smaller' : `Upload error: ${err.message}`;
    details = [{ field: err.field || 'image', message }];
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400; message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 404; message = 'Not found';
  } else if (err?.code === 11000) {
    status = 409; message = 'Duplicate value';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400; message = 'Malformed JSON body';
  } else if (err?.type === 'entity.too.large') {
    status = 413; message = 'Request body too large';
  }

  if (status >= 500) {
    if (process.env.NODE_ENV !== 'test') console.error(err);
    message = 'Internal server error';
    details = undefined;
  }
  const error = { message };
  if (details && details.length) error.details = details;
  res.status(status).json({ error });
}
