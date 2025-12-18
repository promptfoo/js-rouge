import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/test/**/*.ts', '**/*.{spec,test}.ts'],
    exclude: ['**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['json', 'text', 'lcov', 'clover'],
    },
  },
});
