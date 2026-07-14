import { defineConfig, devices } from '@playwright/test';

// Smoke-only Playwright setup: builds are served by `vite preview` (the production bundle), and
// the tests just drive the real UI to catch render crashes and "looks-real-but-fabricated"
// text (NaN / undefined) that unit tests and the type-checker can't see. Under preview there is
// no /api backend, so every live source is absent — which is exactly the honest empty/loading
// state we want to prove renders cleanly. Chromium is the one preinstalled in CI and locally
// (PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers), so we only run that project.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: undefined } }],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
