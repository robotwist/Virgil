import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    // Take screenshot on test failure
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        permissions: ['microphone'],
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        permissions: ['microphone'],
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        permissions: ['microphone'],
      },
    },
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        permissions: ['microphone'],
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        permissions: ['microphone'],
      },
    },
  ],
  webServer: {
    command: 'cd frontend/frontend && npm run dev',
    port: 5174,
    reuseExistingServer: !process.env.CI,
  },
}); 