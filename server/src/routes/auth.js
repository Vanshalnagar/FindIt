import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../controllers/schemas.js';
import * as c from '../controllers/authController.js';

export function authRouter({ isTest }) {
  const r = Router();
  if (!isTest) {
    r.use(rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => res.status(429).json({ error: { message: 'Too many attempts, please try again later' } }),
    }));
  }
  r.post('/register', validate(registerSchema), c.register);
  r.post('/login', validate(loginSchema), c.login);
  r.post('/logout', c.logout);
  r.get('/me', requireAuth, c.me);
  return r;
}
