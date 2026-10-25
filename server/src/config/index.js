import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const serverRoot = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(serverRoot, '.env') });

/** Read config lazily so tests can adjust process.env before createApp(). */
export function getConfig() {
  const env = process.env;
  const nodeEnv = env.NODE_ENV || 'development';
  const uploadDir = env.UPLOAD_DIR || 'uploads';
  const sessionSecret = env.SESSION_SECRET || (nodeEnv === 'production' ? '' : 'dev-only-insecure-secret');
  if (!sessionSecret) throw new Error('SESSION_SECRET must be set in production');
  return {
    nodeEnv,
    isProd: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    port: Number(env.PORT) || 5000,
    mongoUri: env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findit',
    sessionSecret,
    clientOrigins: (env.CLIENT_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    cookieSecure: nodeEnv === 'production' && env.COOKIE_SECURE === 'true',
    uploadDir: path.isAbsolute(uploadDir) ? uploadDir : path.resolve(serverRoot, uploadDir),
  };
}
