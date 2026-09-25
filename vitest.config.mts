import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'frontend/src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: {
        statements: 95,
        branches: 80,
        functions: 95,
        lines: 95,
      },
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/database/data-source.ts',
        'src/database/seeds/**',
        'src/**/*.entity.ts',
        'src/auth/guards/**',
        'src/common/decorators/**',
        'src/common/enums/**',
        'src/common/interfaces/**',
      ],
    },
  },
});
