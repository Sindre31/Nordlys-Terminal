import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // API-handler tests live in test/ (not api/) so Vercel doesn't treat them as serverless
    // functions and blow past the deployment's function limit.
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'test/**/*.test.js'],
  },
});
