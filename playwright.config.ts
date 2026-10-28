import { defineConfig, devices } from '@playwright/test'

const CI = process.env.CI !== undefined && process.env.CI !== ''

// Safety rails against hanging runs:
// - workers: 2 (WebGL tests crash browsers under contention).
// - timeout per test: 60s; expect: 5s. No test may wait silently.
// - reuseExistingServer: false (stale preview = nondeterministic failures).
// - Local loop: `e2e:quick` (chromium only). Full matrix runs in CI.
// - Server commands go through npx so they run under cmd on Windows and sh
//   on the Linux CI runner alike (`cmd /c` exits 127 on Linux).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: 2,
  timeout: 60000,
  expect: { timeout: 5000 },
  // CI uploads playwright-report/ on failure, so it needs the html reporter.
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // Responsive checks only: the mobile layout specs opt in by file.
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
      testMatch: /responsive\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: 'npx vite preview --port 4173 --strictPort --host 127.0.0.1',
      port: 4173,
      // Never reuse: a stale preview of the previous dist causes nondeterministic
      // failures. Always boot the current build. CI already behaves this way.
      reuseExistingServer: false,
    },
    {
      // Dev server exists only for DEV-gated routes (/dev/*) under test.
      command: 'npx vite --port 5174 --strictPort --host 127.0.0.1',
      port: 5174,
      reuseExistingServer: false,
    },
  ],
})
