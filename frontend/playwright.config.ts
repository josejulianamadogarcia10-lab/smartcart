import { defineConfig } from 'playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5173',
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 880 },
  },
  webServer: {
    command: 'npm run dev -- --host localhost',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
