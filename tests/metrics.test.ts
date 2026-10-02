import { describe, expect, it } from 'vitest'
import { conversionEvents, devices, generationEvents, moderationEvents, sites } from '@/data/mockData'
import { getAnomalies, getDashboardMetrics, getEffectiveDeviceStatus, getFunnel, getInsight, getSitePerformance, getTrend, isHeartbeatStale, minutesSinceHeartbeat, normalizeDateRange } from '@/utils/metrics'

const data = { generations: generationEvents, conversions: conversionEvents, moderation: moderationEvents, devices }
const range = { start: '2026-09-25', end: '2026-10-01' }

describe('dashboard metrics', () => {
  it('calculates a reproducible dashboard snapshot', () => {
    const metrics = getDashboardMetrics(data, range, 'all')
    expect(metrics.participants).toBeGreaterThan(0)
    expect(metrics.attempts).toBeGreaterThan(metrics.successCount)
    expect(metrics.successRate).toBeGreaterThan(0)
    expect(metrics.scanRate).toBeCloseTo(25.2, 0)
    expect(metrics.shareRate).toBeCloseTo(5.5, 0)
    expect(metrics.moderationCounts.reviewing).toBeGreaterThan(0)
    expect(metrics.kpis).toHaveLength(6)
  })

  it('supports multi-site filtering with the same metric formulas', () => {
    const all = getDashboardMetrics(data, range, 'all')
    const selected = getDashboardMetrics(data, range, ['site-01', 'site-02'])
    const site01 = getDashboardMetrics(data, range, 'site-01')

    expect(selected.participants).toBeLessThan(all.participants)
    expect(selected.participants).toBeGreaterThan(site01.participants)
    expect(selected.scanRate).toBeGreaterThan(0)
  })

  it('changes the aggregate when a point is selected', () => {
    const all = getDashboardMetrics(data, range, 'all')
    const site = getDashboardMetrics(data, range, 'site-03')
    expect(site.participants).toBeLessThan(all.participants)
    expect(site.successRate).toBeLessThan(all.successRate)
  })

  it('produces a trend point for every selected day', () => {
    const trend = getTrend(data, range, 'all')
    expect(trend).toHaveLength(7)
    expect(trend[0]?.date).toBe('2026-09-25')
    expect(trend.at(-1)?.date).toBe('2026-10-01')
  })

  it('keeps funnel order and exposes conversion rates', () => {
    const funnel = getFunnel(getDashboardMetrics(data, range, 'all'))
    expect(funnel.map((item) => item.name)).toEqual(['参与互动', '生成成功', '扫码带走', '分享内容'])
    expect(funnel[0]?.rate).toBe(100)
  })

  it('flags the known device and generation anomalies', () => {
    const anomalies = getAnomalies(data, range, 'all', sites)
    expect(anomalies.some((item) => item.type === 'device' && item.siteId === 'site-03')).toBe(true)
    expect(anomalies.some((item) => item.type === 'generation' && item.siteId === 'site-03')).toBe(true)
  })

  it('keeps the known Guangzhou share-rate anomaly visible', () => {
    const metrics = getDashboardMetrics(data, range, 'site-04')
    const anomalies = getAnomalies(data, range, 'all', sites)

    expect(metrics.shareRate).toBeLessThan(8)
    expect(anomalies.some((item) => item.id === 'site-04-share')).toBe(true)
  })

  it('creates a visible single-day success-rate drop for Shanghai Wujiaochang', () => {
    const trend = getTrend(data, { start: '2026-09-18', end: '2026-10-01' }, 'site-01')
    const dropDay = trend.find((item) => item.date === '2026-09-27')
    const previousDay = trend.find((item) => item.date === '2026-09-26')

    expect(dropDay?.successRate).toBeLessThan(65)
    expect(dropDay?.participants).toBeGreaterThan(previousDay?.participants ?? 0)
  })

  it('flags a conversion drop when the current period falls over 20 percent', () => {
    const unstableData = {
      ...data,
      conversions: data.conversions.filter((item) => !(item.siteId === 'site-01' && item.type === 'share' && item.date >= range.start && item.date <= range.end)),
    }
    const anomalies = getAnomalies(unstableData, range, 'all', sites)
    expect(anomalies.some((item) => item.id === 'site-01-share-trend')).toBe(true)
  })

  it('filters point performance rows using the calculated anomaly list', () => {
    const anomalies = getAnomalies(data, range, 'all', sites)
    const rows = getSitePerformance(data, range, sites, anomalies)
    expect(rows).toHaveLength(sites.length)
    expect(rows.some((row) => row.site.id === 'site-03' && row.anomalyCount > 0)).toBe(true)
  })

  it('does not manufacture metric anomalies when the selected range has no activity data', () => {
    const emptyRange = { start: '2026-10-02', end: '2026-10-03' }
    const metrics = getDashboardMetrics(data, emptyRange, 'all')
    const anomalies = getAnomalies(data, emptyRange, 'all', sites)
    const rows = getSitePerformance(data, emptyRange, sites, anomalies)

    expect(metrics.attempts).toBe(0)
    expect(anomalies.some((item) => ['generation', 'conversion', 'latency', 'trend'].includes(item.type))).toBe(false)
    expect(rows.every((row) => row.status === 'no-data')).toBe(true)
    expect(getInsight(metrics, anomalies).title).toContain('稳定性和设备')
    expect(getInsight(metrics, anomalies.filter((item) => item.type !== 'device')).title).toContain('暂无互动数据')
  })

  it('deduplicates conversion sessions and excludes reviewing moderation items', () => {
    const firstScan = data.conversions.find((item) => item.type === 'scan')
    const duplicateData = {
      ...data,
      conversions: firstScan ? [...data.conversions, firstScan, firstScan] : data.conversions,
      moderation: [...data.moderation, { id: 'reviewing-1', date: range.end, sessionId: 'reviewing-session', siteId: 'site-01', result: 'reviewing' as const }],
    }
    const metrics = getDashboardMetrics(duplicateData, range, 'all')
    const original = getDashboardMetrics(data, range, 'all')

    expect(metrics.scanCount).toBe(original.scanCount)
    expect(metrics.moderationPassRate).toBe(original.moderationPassRate)
  })

  it('uses successful sessions for the funnel and respects the heartbeat threshold', () => {
    const minimalData = {
      generations: [
        { id: 'retry-1', date: range.end, time: '12:00', sessionId: 'same-session', siteId: 'site-01', deviceId: 'device-101', campaignId: 'campaign-spring', status: 'failed' as const, durationSec: 4 },
        { id: 'retry-2', date: range.end, time: '12:01', sessionId: 'same-session', siteId: 'site-01', deviceId: 'device-101', campaignId: 'campaign-spring', status: 'success' as const, durationSec: 8 },
      ],
      conversions: [{ id: 'scan-1', date: range.end, sessionId: 'same-session', siteId: 'site-01', type: 'scan' as const }],
      moderation: [],
      devices: [devices[0]],
    }
    const funnel = getFunnel(getDashboardMetrics(minimalData, range, 'all'))

    expect(funnel[0]?.value).toBe(1)
    expect(funnel[1]?.value).toBe(1)
    expect(funnel[2]?.value).toBe(1)
    expect(minutesSinceHeartbeat('2026-10-01 18:28:00')).toBe(2)
    expect(minutesSinceHeartbeat('2026-10-01 18:24:00')).toBe(6)
    expect(isHeartbeatStale('2026-10-01 18:27:00')).toBe(false)
    expect(isHeartbeatStale('2026-10-01 18:26:59')).toBe(true)
  })

  it('derives device health from heartbeat age and limits outage impact to post-heartbeat work', () => {
    const staleDevice = {
      ...devices[0],
      id: 'device-stale',
      status: 'online' as const,
      lastHeartbeat: '2026-10-01 18:20:00',
      activeJobs: 2,
      lastError: undefined,
    }
    const staleData = {
      generations: [
        { id: 'before-outage', date: range.end, time: '18:10', sessionId: 'before', siteId: 'site-01', deviceId: staleDevice.id, campaignId: 'campaign-spring', status: 'success' as const, durationSec: 8 },
        { id: 'after-outage', date: range.end, time: '18:25', sessionId: 'after', siteId: 'site-01', deviceId: staleDevice.id, campaignId: 'campaign-spring', status: 'failed' as const, durationSec: 14 },
      ],
      conversions: [],
      moderation: [],
      devices: [staleDevice],
    }
    const oneDay = { start: range.end, end: range.end }
    const metrics = getDashboardMetrics(staleData, oneDay, 'all')
    const anomaly = getAnomalies(staleData, oneDay, 'all', [sites[0]]).find((item) => item.id === 'device-stale-device')

    expect(getEffectiveDeviceStatus(staleDevice)).toBe('offline')
    expect(metrics.onlineRate).toBe(0)
    expect(anomaly?.impact).toEqual({ sessions: 1, tasks: 3, devices: 1 })
  })

  it('caps custom analysis ranges at 90 days', () => {
    const normalized = normalizeDateRange({ start: '2020-01-01', end: range.end })
    expect(normalized).toEqual({ start: '2026-07-04', end: '2026-10-01' })
    expect(getTrend(data, { start: '2020-01-01', end: range.end }, 'all')).toHaveLength(90)
  })
})
