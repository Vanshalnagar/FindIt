import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.js'],
    hookTimeout: 120000,
    testTimeout: 60000,
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
  },
});
