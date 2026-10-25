import mongoose from 'mongoose';
import { badRequest, notFound } from '../utils/HttpError.js';

export function zodDetails(error) {
  return error.issues.map((i) => ({
    field: i.path.join('.') || '_',
    message: i.message,
  }));
}

export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) return next(badRequest('Validation failed', zodDetails(result.error)));
  req.valid = { ...(req.valid || {}), [source]: result.data };
  next();
};

/** Invalid ObjectIds on :id routes are treated as "not found". */
export const validateObjectId = (param = 'id') => (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value) || String(value).length !== 24) return next(notFound('Not found'));
  next();
};
