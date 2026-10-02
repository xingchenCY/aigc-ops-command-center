import { expect, test } from '@playwright/test'

test.skip(process.env.PLAYWRIGHT_PAGES_PREVIEW !== 'true', 'Only runs against the built Pages artifact')

test('loads the production build from the GitHub Pages project path', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  const response = await page.goto('./')
  expect(response?.ok()).toBe(true)
  await expect(page.getByRole('heading', { name: '互动运营中枢', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: '核心指标' })).toBeVisible()

  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/').at(-1) ?? 'aigc-ops-command-center'
  const assetPaths = await page.locator('script[src], link[rel="stylesheet"]').evaluateAll((elements) => elements.map((element) => (element as HTMLScriptElement | HTMLLinkElement).getAttribute('src') ?? (element as HTMLLinkElement).getAttribute('href')))
  expect(assetPaths.every((path) => path?.startsWith(`/${repositoryName}/`))).toBe(true)
  expect(consoleErrors).toEqual([])
})
