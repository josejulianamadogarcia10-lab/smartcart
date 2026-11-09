import { defineConfig, devices } from 'playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e-artifacts/report', open: 'never' }],
  ],
  outputDir: 'e2e-artifacts/test-results',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:5180',
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 880 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node scripts/e2e-backend.mjs',
      url: 'http://127.0.0.1:8001/up',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5180',
      url: 'http://127.0.0.1:5180',
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        VITE_API_URL: 'http://127.0.0.1:8001/api/v1',
        VITE_DEMO_MODE: 'true',
      },
    },
  ],
})
