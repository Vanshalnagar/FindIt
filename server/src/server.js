import mongoose from 'mongoose';
import { getConfig } from './config/index.js';
import { createApp } from './app.js';

const config = getConfig();

try {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
} catch (err) {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
}

const app = createApp();
const server = app.listen(config.port, () => console.log(`FindIt API listening on :${config.port} (${config.nodeEnv})`));

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
