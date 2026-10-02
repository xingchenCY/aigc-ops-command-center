import { defineConfig, devices } from '@playwright/test'

const pagesPreview = process.env.PLAYWRIGHT_PAGES_PREVIEW === 'true'
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/').at(-1) ?? 'aigc-ops-command-center'
const serverOrigin = pagesPreview ? 'http://127.0.0.1:4176' : 'http://127.0.0.1:4175'
const baseURL = pagesPreview ? `${serverOrigin}/${repositoryName}/` : serverOrigin

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: pagesPreview ? [] : ['**/pages.spec.ts'],
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: pagesPreview ? `pnpm preview --host 127.0.0.1 --port 4176 --base /${repositoryName}/` : 'pnpm dev --host 127.0.0.1 --port 4175',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
