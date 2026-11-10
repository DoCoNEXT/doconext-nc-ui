import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

/**
 * Unit tests: the configuration, the composables, the tablist's keys, and the
 * components.
 *
 * The default environment stays `node`, as in DoCoNEXT Core: most of these
 * test plain TypeScript, and a DOM they never touch only costs time. A file
 * that mounts a component asks for one itself with `// @vitest-environment
 * jsdom` on its first line; see tests/DcnSegmented.test.ts. The Vue plugin is
 * what lets such a test mount a single-file component.
 */
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    // @nextcloud/vue imports its own stylesheets, and so do the @nextcloud/*
    // libraries it needs since 9.14: Node cannot load those, so Vite
    // transforms them like the app's own code.
    server: { deps: { inline: [/@nextcloud\//] } },
  },
})
