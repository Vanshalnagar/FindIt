import { User } from '../models/User.js';
import { unauthorized, forbidden } from '../utils/HttpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Attaches req.user when the session has a valid user (never errors). */
export const loadUser = asyncHandler(async (req, res, next) => {
  const id = req.session?.userId;
  if (id) {
    const user = await User.findById(id);
    if (user) req.user = user;
    else delete req.session.userId;
  }
  next();
});

export const requireAuth = (req, res, next) => (req.user ? next() : next(unauthorized()));

export const requireAdmin = (req, res, next) => {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== 'admin') return next(forbidden('Admin access required'));
  next();
};
