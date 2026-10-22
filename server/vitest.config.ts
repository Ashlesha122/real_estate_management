import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgresql://estateflow:estateflow_dev@localhost:5432/estateflow',
      JWT_SECRET: 'test-secret-key-123456789012345678901234567890-super-key',
      NODE_ENV: 'test',
      PORT: '3000',
      CLIENT_URL: 'http://localhost:5173',
      UPLOAD_DIR: './uploads',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'db/'],
    },
  },
});
