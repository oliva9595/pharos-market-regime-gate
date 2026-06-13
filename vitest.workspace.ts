import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      include: [
        'packages/*/test/**/*.test.ts',
        'services/*/test/**/*.test.ts',
        'web/test/**/*.test.js'
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/out/**'
      ]
    }
  }
]);
