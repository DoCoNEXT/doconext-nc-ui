import { defineConfig } from 'vitest/config'

/** Unit tests of the plain TypeScript: configuration and the composables' memory. No component rendering. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
