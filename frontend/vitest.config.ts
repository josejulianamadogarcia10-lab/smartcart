import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
  plugins: [react()],
})
