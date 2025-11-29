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

// Resolve absolute paths to backend & frontend (works whether CI runs from root or any cwd)
const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'Frontend');

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
      // Start backend via absolute path prefix (avoids e2e/ relative issues on CI)
      command: `npm run dev --prefix "${BACKEND_DIR}"`,
      url: `http://localhost:${BACKEND_PORT}`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      // In CI use preview (built assets); locally use dev for HMR speed
      command: process.env.CI
        ? `npm run preview --prefix "${FRONTEND_DIR}" -- --port ${FRONTEND_PORT}`
        : `npm run dev --prefix "${FRONTEND_DIR}"`,
      url: `http://localhost:${FRONTEND_PORT}`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    }
  ],
});
