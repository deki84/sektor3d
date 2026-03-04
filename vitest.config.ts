import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Pure Node environment – no DOM needed for validation function tests
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
