import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we load the .env inside the e2e folder (not repo root)
dotenv.config({ path: path.resolve(__dirname, '.env') });

const FRONTEND_PORT = 5173;
const BACKEND_PORT = 5000;

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',

  workers: process.env.CI ? 1 : 1,

  timeout: 60000, // 60 seconds per test

  expect: {
    timeout: 20000, // 20 seconds for UI waits
  },

  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['line']
  ],

  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: `npm run dev --prefix backend`,
      url: `http://localhost:${BACKEND_PORT}`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run dev --prefix Frontend`,
      url: `http://localhost:${FRONTEND_PORT}`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    }
  ],
});
