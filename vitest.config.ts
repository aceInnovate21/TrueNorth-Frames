import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// Unit tests target pure, framework-free logic (trust scoring, badges, message
// moderation helpers, config invariants). They run in Node with no DB, no Next
// runtime, and no network — fast enough to run on every commit.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
