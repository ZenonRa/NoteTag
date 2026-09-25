import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/database.integration-spec.ts'],
    fileParallelism: false,
  },
});
