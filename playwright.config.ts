import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  // No webServer block: this sandbox only permits network listeners started
  // through the dedicated preview infrastructure (see README) — start the
  // dev server with `npm run dev` yourself before running `npm run e2e`.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
