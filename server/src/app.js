import fs from 'node:fs';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { getConfig } from './config/index.js';
import { sanitize } from './middleware/sanitize.js';
import { originCheck } from './middleware/originCheck.js';
import { loadUser } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import itemsRouter from './routes/items.js';
import claimsRouter from './routes/claims.js';
import adminRouter from './routes/admin.js';
import healthRouter from './routes/health.js';

/**
 * Builds the Express app. Mongoose must already be connected when not in test mode
 * (the session store reuses its client), unless `sessionStore` is supplied.
 */
export function createApp({ sessionStore } = {}) {
  const config = getConfig();
  const app = express();
  
  app.set('query parser', 'simple');
  app.disable('x-powered-by');
  if (config.isProd) app.set('trust proxy', 1);

  fs.mkdirSync(config.uploadDir, { recursive: true });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.clientOrigins, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(sanitize);

  app.use('/uploads', express.static(config.uploadDir, { index: false, dotfiles: 'ignore', maxAge: '7d' }));

  const store = sessionStore
    ? sessionStore
    : config.isTest
      ? undefined // express-session MemoryStore
      : MongoStore.create({ client: mongoose.connection.getClient(), collectionName: 'sessions' });

  app.use(
    session({
      name: 'findit.sid',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store,
      cookie: { httpOnly: true, sameSite: 'lax', secure: config.cookieSecure, maxAge: 7 * 24 * 3600 * 1000 },
    })
  );

  app.use('/api', originCheck(config.clientOrigins));
  app.use('/api', loadUser);

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter({ isTest: config.isTest }));
  app.use('/api/items', itemsRouter);
  app.use('/api/claims', claimsRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
