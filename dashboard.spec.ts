import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('loads the complete dashboard without horizontal overflow', async ({ page }) => {
  await expect(page.getByRole('heading', { name: '互动运营中枢', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: '核心指标' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '异常中心' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('resets site, date and anomaly filters together', async ({ page }) => {
  const participantValue = page.locator('.kpi-card').first().locator('.kpi-card__value')
  const allParticipants = await participantValue.textContent()
  await page.getByRole('checkbox', { name: '仅看异常点位' }).check()
  await expect(page.getByText(/异常点位视图/)).toBeVisible()
  await expect(participantValue).not.toHaveText(allParticipants ?? '')
  expect(await page.locator('.site-row').count()).toBeLessThan(5)

  await page.getByLabel('杭州湖滨店').check()
  await expect(page.getByText(/杭州 · 湖滨店 · 异常点位视图/)).toBeVisible()

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.getByLabel('杭州湖滨店')).not.toBeChecked()
  await expect(page.getByRole('checkbox', { name: '仅看异常点位' })).not.toBeChecked()
  await expect(page.locator('#start-date')).toHaveValue('2026-09-25')
  await expect(page.locator('#end-date')).toHaveValue('2026-10-01')
})

test('opens metric, site and anomaly details', async ({ page }) => {
  await page.getByRole('button', { name: '指标口径' }).click()
  await expect(page.getByText('让每个数字都可以被解释')).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.locator('.site-row').filter({ hasText: '杭州 · 湖滨店' }).click()
  await expect(page.getByText('杭州 · 湖滨店 · 点位详情')).toBeVisible()
  await expect(page.getByRole('heading', { name: '设备状态' })).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.locator('.anomaly-row').first().click()
  await expect(page.getByText('异常详情')).toBeVisible()
  await expect(page.getByRole('heading', { name: '影响范围' })).toBeVisible()
})

test('exposes every anomaly through an explicit expand action', async ({ page }) => {
  const total = Number((await page.locator('.anomaly-count').textContent())?.match(/\d+/)?.[0] ?? 0)
  const expand = page.getByRole('button', { name: /显示其余 \d+ 条异常/ })
  await expect(expand).toBeVisible()
  await expand.click()
  await expect(page.getByRole('button', { name: '收起异常列表' })).toBeVisible()
  await expect(page.locator('.anomaly-row')).toHaveCount(total)
})

test('shows a truthful empty state for dates without activity data', async ({ page }) => {
  await page.locator('#end-date').fill('2026-10-03')
  await page.locator('#end-date').press('Tab')
  await page.locator('#start-date').fill('2026-10-02')
  await page.locator('#start-date').press('Tab')

  await expect(page.getByRole('status')).toContainText('当前范围暂无互动数据')
  await expect(page.locator('.kpi-card').nth(1).locator('.kpi-card__value')).toHaveText('—')
  await expect(page.locator('.trend-empty')).toBeVisible()
  await expect(page.locator('.funnel-empty')).toBeVisible()
})
