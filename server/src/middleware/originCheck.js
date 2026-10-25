import { forbidden } from '../utils/HttpError.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF mitigation (in addition to sameSite=lax): for state-changing requests that
 * carry an Origin header, it must be an allowed client origin or the request's own host.
 */
export function originCheck(allowedOrigins) {
  const allowed = new Set(allowedOrigins);
  return (req, res, next) => {
    if (SAFE.has(req.method)) return next();
    const origin = req.get('origin');
    if (!origin) return next();
    if (allowed.has(origin)) return next();
    try {
      if (new URL(origin).host === req.get('host')) return next();
    } catch {
      /* fall through */
    }
    next(forbidden('Origin not allowed'));
  };
}
