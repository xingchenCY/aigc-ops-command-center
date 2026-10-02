import type {
  Anomaly,
  AnomalySeverity,
  ConversionEvent,
  DashboardKpi,
  DashboardMetrics,
  DateRange,
  DeviceMetric,
  DeviceWithMetrics,
  Device,
  FunnelStep,
  GenerationEvent,
  HourlyTrendPoint,
  ModerationEvent,
  ModerationStatusCounts,
  ModerationStatusSlice,
  Site,
  SitePerformanceRow,
  TrendPoint,
} from '@/types/domain'
import { formatNumber, formatPercent, formatSeconds } from './formatters'

export const THRESHOLDS = {
  successRate: 90,
  averageDuration: 15,
  shareRate: 8,
  moderationRejectRate: 5,
  onlineRate: 98,
  trendDrop: -20,
} as const

export const DEMO_SNAPSHOT_TIME = '2026-10-01 18:30:00'
export const MAX_ANALYSIS_DAYS = 90
export type SiteFilter = string | string[]

interface DataSet {
  generations: GenerationEvent[]
  conversions: ConversionEvent[]
  moderation: ModerationEvent[]
  devices: Device[]
}

interface Aggregate {
  participants: number
  attempts: number
  successCount: number
  successfulParticipants: number
  successRate: number
  scanCount: number
  scanRate: number
  shareCount: number
  shareRate: number
  averageDuration: number
  reviewedCount: number
  rejectedCount: number
  moderationCounts: ModerationStatusCounts
  moderationPassRate: number
  onlineDevices: number
  totalDevices: number
  onlineRate: number
}

function inRange(date: string, range: DateRange) {
  return date >= range.start && date <= range.end
}

function isAllSites(siteId: SiteFilter) {
  return siteId === 'all' || (Array.isArray(siteId) && siteId.length === 0)
}

function siteMatches(siteId: string, filter: SiteFilter) {
  if (isAllSites(filter)) return true
  return Array.isArray(filter) ? filter.includes(siteId) : siteId === filter
}

function dateToKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function shiftDate(date: string, amount: number) {
  const result = new Date(`${date}T00:00:00`)
  result.setDate(result.getDate() + amount)
  return dateToKey(result)
}

export function normalizeDateRange(range: DateRange): DateRange {
  if (range.start > range.end) return normalizeDateRange({ start: range.end, end: range.start })
  const earliestStart = shiftDate(range.end, -(MAX_ANALYSIS_DAYS - 1))
  return { start: range.start < earliestStart ? earliestStart : range.start, end: range.end }
}

export function getRangeDays(range: DateRange) {
  const normalized = normalizeDateRange(range)
  const start = new Date(`${normalized.start}T00:00:00`)
  const end = new Date(`${normalized.end}T00:00:00`)
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
}

export function getPreviousRange(range: DateRange): DateRange {
  const normalized = normalizeDateRange(range)
  const days = getRangeDays(normalized)
  return { start: shiftDate(normalized.start, -days), end: shiftDate(normalized.end, -days) }
}

function aggregate(data: DataSet, range: DateRange, siteId: SiteFilter): Aggregate {
  const normalized = normalizeDateRange(range)
  const generations = data.generations.filter((item) => inRange(item.date, normalized) && siteMatches(item.siteId, siteId))
  const conversions = data.conversions.filter((item) => inRange(item.date, normalized) && siteMatches(item.siteId, siteId))
  const moderation = data.moderation.filter((item) => inRange(item.date, normalized) && siteMatches(item.siteId, siteId))
  const activeDevices = data.devices.filter((item) => siteMatches(item.siteId, siteId))
  const successful = generations.filter((item) => item.status === 'success')
  const successfulSessionIds = new Set(successful.map((item) => item.sessionId))
  const successfulParticipants = successfulSessionIds.size
  const scans = new Set(conversions.filter((item) => item.type === 'scan' && successfulSessionIds.has(item.sessionId)).map((item) => item.sessionId))
  const shares = new Set(conversions.filter((item) => item.type === 'share' && successfulSessionIds.has(item.sessionId) && scans.has(item.sessionId)).map((item) => item.sessionId))
  const reviewed = moderation.filter((item) => item.result === 'approved' || item.result === 'rejected')
  const rejected = reviewed.filter((item) => item.result === 'rejected')
  const moderationCounts = {
    approved: moderation.filter((item) => item.result === 'approved').length,
    rejected: moderation.filter((item) => item.result === 'rejected').length,
    reviewing: moderation.filter((item) => item.result === 'reviewing').length,
  }
  const duration = successful.reduce((sum, item) => sum + item.durationSec, 0)

  return {
    participants: new Set(generations.map((item) => item.sessionId)).size,
    attempts: generations.length,
    successCount: successful.length,
    successfulParticipants: new Set(successful.map((item) => item.sessionId)).size,
    successRate: generations.length ? (successful.length / generations.length) * 100 : 0,
    scanCount: scans.size,
    scanRate: successfulParticipants ? (scans.size / successfulParticipants) * 100 : 0,
    shareCount: shares.size,
    shareRate: successfulParticipants ? (shares.size / successfulParticipants) * 100 : 0,
    averageDuration: successful.length ? duration / successful.length : 0,
    reviewedCount: reviewed.length,
    rejectedCount: rejected.length,
    moderationCounts,
    moderationPassRate: reviewed.length ? ((reviewed.length - rejected.length) / reviewed.length) * 100 : 0,
    onlineDevices: activeDevices.filter((item) => getEffectiveDeviceStatus(item) === 'online').length,
    totalDevices: activeDevices.length,
    onlineRate: activeDevices.length ? (activeDevices.filter((item) => getEffectiveDeviceStatus(item) === 'online').length / activeDevices.length) * 100 : 0,
  }
}

function delta(current: number, previous: number) {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}

function kpiDeltaLabel(value: number, type: 'percent' | 'pp' = 'percent', hasBaseline = true) {
  if (!hasBaseline) return '— 暂无基线'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}${type === 'pp' ? 'pp' : '%'}`
}

function buildKpis(current: Aggregate, previous: Aggregate): DashboardKpi[] {
  const hasBaseline = {
    participants: current.attempts > 0 && previous.participants > 0,
    successRate: current.attempts > 0 && previous.attempts > 0,
    scanRate: current.successfulParticipants > 0 && previous.successfulParticipants > 0,
    shareRate: current.successfulParticipants > 0 && previous.successfulParticipants > 0,
    averageDuration: current.successCount > 0 && previous.successCount > 0,
    onlineRate: false,
  }
  const deltas = {
    participants: delta(current.participants, previous.participants),
    successRate: current.successRate - previous.successRate,
    scanRate: current.scanRate - previous.scanRate,
    shareRate: current.shareRate - previous.shareRate,
    averageDuration: delta(current.averageDuration, previous.averageDuration),
    onlineRate: 0,
  }
  return [
    { key: 'participants', label: '参与人数', value: current.participants, displayValue: formatNumber(current.participants), delta: deltas.participants, deltaLabel: kpiDeltaLabel(deltas.participants, 'percent', hasBaseline.participants), hasBaseline: hasBaseline.participants, tone: 'blue', icon: 'users', helper: '去重后的有效互动会话' },
    { key: 'successRate', label: '生成成功率', value: current.successRate, displayValue: current.attempts ? formatPercent(current.successRate) : '—', delta: deltas.successRate, deltaLabel: kpiDeltaLabel(deltas.successRate, 'pp', hasBaseline.successRate), hasBaseline: hasBaseline.successRate, tone: current.attempts && current.successRate < THRESHOLDS.successRate ? 'red' : current.attempts ? 'teal' : 'blue', icon: 'sparkles', helper: current.attempts ? `${current.successCount} / ${current.attempts} 次任务成功` : '当前范围暂无生成任务' },
    { key: 'scanRate', label: '扫码转化率', value: current.scanRate, displayValue: current.successfulParticipants ? formatPercent(current.scanRate) : '—', delta: deltas.scanRate, deltaLabel: kpiDeltaLabel(deltas.scanRate, 'pp', hasBaseline.scanRate), hasBaseline: hasBaseline.scanRate, tone: 'blue', icon: 'qr', helper: current.successfulParticipants ? `${current.scanCount} 人完成扫码` : '当前范围暂无成功生成' },
    { key: 'shareRate', label: '分享转化率', value: current.shareRate, displayValue: current.successfulParticipants ? formatPercent(current.shareRate) : '—', delta: deltas.shareRate, deltaLabel: kpiDeltaLabel(deltas.shareRate, 'pp', hasBaseline.shareRate), hasBaseline: hasBaseline.shareRate, tone: current.successCount && current.shareRate < THRESHOLDS.shareRate ? 'amber' : current.successCount ? 'teal' : 'blue', icon: 'share', helper: current.successfulParticipants ? `${current.shareCount} 人完成分享` : '当前范围暂无成功生成' },
    { key: 'averageDuration', label: '平均生成时长', value: current.averageDuration, displayValue: current.successCount ? formatSeconds(current.averageDuration) : '—', delta: deltas.averageDuration, deltaLabel: kpiDeltaLabel(deltas.averageDuration, 'percent', hasBaseline.averageDuration), hasBaseline: hasBaseline.averageDuration, tone: current.successCount && current.averageDuration > THRESHOLDS.averageDuration ? 'amber' : 'blue', icon: 'clock', helper: current.successCount ? '仅统计生成成功任务' : '当前范围暂无成功任务' },
    { key: 'onlineRate', label: '设备在线率', value: current.onlineRate, displayValue: formatPercent(current.onlineRate), delta: deltas.onlineRate, deltaLabel: '当前快照', hasBaseline: false, tone: current.totalDevices && current.onlineRate < THRESHOLDS.onlineRate ? 'red' : 'teal', icon: 'monitor', helper: `${current.onlineDevices} / ${current.totalDevices} 台在线` },
  ]
}

export function getDashboardMetrics(data: DataSet, range: DateRange, siteId: SiteFilter): DashboardMetrics {
  const normalized = normalizeDateRange(range)
  const current = aggregate(data, normalized, siteId)
  const previous = aggregate(data, getPreviousRange(normalized), siteId)
  const kpis = buildKpis(current, previous)
  return { ...current, kpis, deltas: Object.fromEntries(kpis.map((item) => [item.key, item.delta])) }
}

export function getTrend(data: DataSet, range: DateRange, siteId: SiteFilter): TrendPoint[] {
  const normalized = normalizeDateRange(range)
  const points: TrendPoint[] = []
  for (let index = 0; index < getRangeDays(normalized); index += 1) {
    const date = shiftDate(normalized.start, index)
    const day = { start: date, end: date }
    const item = aggregate(data, day, siteId)
    points.push({
      date,
      participants: item.participants,
      successRate: item.attempts ? item.successRate : null,
      averageDuration: item.successCount ? item.averageDuration : null,
    })
  }
  return points
}

export function getFunnel(metrics: DashboardMetrics): FunnelStep[] {
  return [
    { name: '参与互动', value: metrics.participants, rate: 100, color: '#2d62ce' },
    { name: '生成成功', value: metrics.successfulParticipants, rate: metrics.participants ? (metrics.successfulParticipants / metrics.participants) * 100 : 0, color: '#3e7be4' },
    { name: '扫码带走', value: metrics.scanCount, rate: metrics.successfulParticipants ? (metrics.scanCount / metrics.successfulParticipants) * 100 : 0, color: '#159b79' },
    { name: '分享内容', value: metrics.shareCount, rate: metrics.scanCount ? (metrics.shareCount / metrics.scanCount) * 100 : 0, color: '#c7831d' },
  ]
}

export function getHourlyTrend(data: DataSet, range: DateRange, siteId: SiteFilter): HourlyTrendPoint[] {
  const normalized = normalizeDateRange(range)
  const targetDate = normalized.end
  return Array.from({ length: 10 }, (_, index) => {
    const hour = String(10 + index).padStart(2, '0')
    const generations = data.generations.filter((item) => item.date === targetDate && item.time.startsWith(`${hour}:`) && siteMatches(item.siteId, siteId))
    const successful = generations.filter((item) => item.status === 'success')
    return {
      hour: `${hour}:00`,
      participants: new Set(generations.map((item) => item.sessionId)).size,
      successRate: generations.length ? (successful.length / generations.length) * 100 : null,
    }
  })
}

export function getModerationStatusSlices(metrics: DashboardMetrics): ModerationStatusSlice[] {
  return [
    { key: 'approved', name: '通过', value: metrics.moderationCounts.approved, color: '#159b79' },
    { key: 'rejected', name: '驳回', value: metrics.moderationCounts.rejected, color: '#d04a4a' },
    { key: 'reviewing', name: '待审核', value: metrics.moderationCounts.reviewing, color: '#c7831d' },
  ]
}

export function getDeviceMetrics(data: DataSet, range: DateRange, deviceId: string): DeviceMetric {
  const normalized = normalizeDateRange(range)
  const generations = data.generations.filter((item) => item.deviceId === deviceId && inRange(item.date, normalized))
  const successful = generations.filter((item) => item.status === 'success')
  const duration = successful.reduce((sum, item) => sum + item.durationSec, 0)
  const averageDuration = successful.length ? duration / successful.length : 0
  return {
    deviceId,
    generationCount: generations.length,
    successRate: generations.length ? (successful.length / generations.length) * 100 : 0,
    averageDuration,
    hasLatencyRisk: successful.length > 0 && averageDuration > THRESHOLDS.averageDuration,
  }
}

export function attachDeviceMetrics(data: DataSet, range: DateRange, devices: Device[]): DeviceWithMetrics[] {
  return devices.map((device) => ({ device, metrics: getDeviceMetrics(data, range, device.id) }))
}

function severityFor(value: number, limit: number, criticalFactor = 0.8): AnomalySeverity {
  return value < limit * criticalFactor ? 'critical' : 'warning'
}

export function minutesSinceHeartbeat(lastHeartbeat: string, snapshotTime = DEMO_SNAPSHOT_TIME) {
  const elapsed = heartbeatAgeMs(lastHeartbeat, snapshotTime)
  if (!Number.isFinite(elapsed)) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.floor(elapsed / 60000))
}

function heartbeatAgeMs(lastHeartbeat: string, snapshotTime = DEMO_SNAPSHOT_TIME) {
  const snapshot = new Date(snapshotTime.replace(' ', 'T')).getTime()
  const heartbeat = new Date(lastHeartbeat.replace(' ', 'T')).getTime()
  if (!Number.isFinite(snapshot) || !Number.isFinite(heartbeat)) return Number.POSITIVE_INFINITY
  return Math.max(0, snapshot - heartbeat)
}

export function isHeartbeatStale(lastHeartbeat: string, snapshotTime = DEMO_SNAPSHOT_TIME) {
  return heartbeatAgeMs(lastHeartbeat, snapshotTime) > 3 * 60000
}

export function getEffectiveDeviceStatus(device: Device): Device['status'] {
  if (device.status === 'maintenance') return 'maintenance'
  return device.status === 'offline' || isHeartbeatStale(device.lastHeartbeat) ? 'offline' : 'online'
}

function impactFor(data: DataSet, range: DateRange, anomaly: Anomaly) {
  const siteGenerations = data.generations.filter((item) => inRange(item.date, range) && item.siteId === anomaly.siteId)
  let affected = siteGenerations

  if (anomaly.type === 'generation') {
    affected = siteGenerations.filter((item) => item.status === 'failed')
  } else if (anomaly.type === 'latency') {
    affected = siteGenerations.filter((item) => item.status === 'success' && item.durationSec > THRESHOLDS.averageDuration)
  } else if (anomaly.type === 'moderation') {
    const rejectedSessions = new Set(data.moderation.filter((item) => inRange(item.date, range) && item.siteId === anomaly.siteId && item.result === 'rejected').map((item) => item.sessionId))
    affected = siteGenerations.filter((item) => rejectedSessions.has(item.sessionId))
  } else if (anomaly.type === 'conversion') {
    const sharedSessions = new Set(data.conversions.filter((item) => inRange(item.date, range) && item.siteId === anomaly.siteId && item.type === 'share').map((item) => item.sessionId))
    affected = siteGenerations.filter((item) => item.status === 'success' && !sharedSessions.has(item.sessionId))
  } else if (anomaly.type === 'device') {
    const deviceId = anomaly.id.replace(/-device$/, '')
    const device = data.devices.find((item) => item.id === deviceId)
    const heartbeat = device ? new Date(device.lastHeartbeat.replace(' ', 'T')).getTime() : Number.POSITIVE_INFINITY
    affected = siteGenerations.filter((item) => {
      if (item.deviceId !== deviceId) return false
      const occurredAt = new Date(`${item.date}T${item.time}:00`).getTime()
      return Number.isFinite(occurredAt) && occurredAt > heartbeat
    })
  }

  const affectedDevice = anomaly.type === 'device'
    ? data.devices.find((item) => item.id === anomaly.id.replace(/-device$/, ''))
    : undefined
  return {
    sessions: new Set(affected.map((item) => item.sessionId)).size,
    tasks: affected.length + (affectedDevice?.activeJobs ?? 0),
    devices: anomaly.type === 'device' ? 1 : new Set(affected.map((item) => item.deviceId)).size,
  }
}

function countRows(rows: string[]) {
  const counts = new Map<string, number>()
  rows.forEach((row) => counts.set(row, (counts.get(row) ?? 0) + 1))
  const total = rows.length || 1
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value, share: (value / total) * 100 }))
    .sort((a, b) => b.value - a.value)
}

function detailsFor(data: DataSet, range: DateRange, anomaly: Anomaly) {
  const siteGenerations = data.generations.filter((item) => inRange(item.date, range) && item.siteId === anomaly.siteId)
  const groups = []
  if (anomaly.type === 'generation') {
    const failed = siteGenerations.filter((item) => item.status === 'failed')
    groups.push({
      title: '失败请求分布',
      rows: countRows(failed.map((item) => item.durationSec > THRESHOLDS.averageDuration ? '模型响应超时' : item.deviceId.includes('2') ? '设备链路波动' : '备用模型未命中')),
    })
    groups.push({
      title: '失败日期分布',
      rows: countRows(failed.map((item) => item.date)),
    })
  }
  if (anomaly.type === 'moderation') {
    const rejected = data.moderation.filter((item) => inRange(item.date, range) && item.siteId === anomaly.siteId && item.result === 'rejected')
    groups.push({
      title: '驳回内容统计',
      rows: countRows(rejected.map((item) => item.reason ?? '未标注原因')),
    })
  }
  if (anomaly.type === 'latency') {
    const slow = siteGenerations.filter((item) => item.status === 'success' && item.durationSec > THRESHOLDS.averageDuration)
    groups.push({
      title: '慢请求分布',
      rows: countRows(slow.map((item) => item.durationSec > 18 ? '超过 18 秒' : '15-18 秒')),
    })
  }
  return groups
}

export function getAnomalies(data: DataSet, range: DateRange, siteId: SiteFilter, siteList: Site[]): Anomaly[] {
  const normalized = normalizeDateRange(range)
  const previousRange = getPreviousRange(normalized)
  const rows: Anomaly[] = []
  const scopedSites = siteList.filter((site) => siteMatches(site.id, siteId))

  scopedSites.forEach((site) => {
    const current = aggregate(data, normalized, site.id)
    const previous = aggregate(data, previousRange, site.id)
    const siteEvents = data.generations.filter((item) => inRange(item.date, normalized) && item.siteId === site.id)
    const latestDate = siteEvents.at(-1)?.date ?? normalized.end

    if (current.attempts > 0 && current.successRate < THRESHOLDS.successRate) {
      rows.push({ id: `${site.id}-success`, type: 'generation', severity: severityFor(current.successRate, THRESHOLDS.successRate), status: 'open', title: '生成成功率低于目标', metricLabel: '生成成功率', siteId: site.id, siteName: site.name, triggeredValue: formatPercent(current.successRate), threshold: `目标 ≥ ${THRESHOLDS.successRate}%`, occurredAt: latestDate, cause: `${site.name} 的生成失败集中在模型响应超时，建议检查 StyleMix 3.2 的请求耗时与备用策略。`, action: '查看失败任务，优先切换备用模型并检查设备网络。' })
    }
    if (current.successCount > 0 && current.averageDuration > THRESHOLDS.averageDuration) {
      rows.push({ id: `${site.id}-duration`, type: 'latency', severity: current.averageDuration > 16 ? 'critical' : 'warning', status: 'acknowledged', title: '平均生成时长偏高', metricLabel: '平均生成时长', siteId: site.id, siteName: site.name, triggeredValue: formatSeconds(current.averageDuration), threshold: `目标 ≤ ${THRESHOLDS.averageDuration}s`, occurredAt: latestDate, cause: '高峰期任务排队，且该点位存在较多高分辨率生成请求。', action: '降低输出尺寸并观察队列长度，必要时临时限流。' })
    }
    if (current.successCount > 0 && current.shareRate < THRESHOLDS.shareRate) {
      rows.push({ id: `${site.id}-share`, type: 'conversion', severity: 'warning', status: 'open', title: '分享转化需要关注', metricLabel: '分享转化率', siteId: site.id, siteName: site.name, triggeredValue: formatPercent(current.shareRate), threshold: `目标 ≥ ${THRESHOLDS.shareRate}%`, occurredAt: latestDate, cause: '用户完成生成后没有继续分享，可能与二维码承接页的分享引导弱有关。', action: '优化生成完成页的分享入口，并补充会员权益提示。' })
    }
    if (current.reviewedCount && ((current.reviewedCount - current.rejectedCount) / current.reviewedCount) * 100 < 100 - THRESHOLDS.moderationRejectRate) {
      rows.push({ id: `${site.id}-moderation`, type: 'moderation', severity: 'warning', status: 'open', title: '内容审核拒绝率偏高', metricLabel: '审核拒绝率', siteId: site.id, siteName: site.name, triggeredValue: formatPercent((current.rejectedCount / current.reviewedCount) * 100), threshold: `目标 ≤ ${THRESHOLDS.moderationRejectRate}%`, occurredAt: latestDate, cause: '近期内容中出现较多边界构图和品牌元素，审核策略需要进一步校准。', action: '抽样复核拒绝内容，更新提示词和审核规则。' })
    }
    const trendDrop = delta(current.participants, previous.participants)
    if (current.attempts > 0 && previous.participants > 0 && trendDrop < THRESHOLDS.trendDrop) {
      rows.push({ id: `${site.id}-trend`, type: 'trend', severity: 'warning', status: 'open', title: '参与人数较上一周期下降', metricLabel: '参与人数环比', siteId: site.id, siteName: site.name, triggeredValue: `${trendDrop.toFixed(1)}%`, threshold: `需关注 < ${THRESHOLDS.trendDrop}%`, occurredAt: latestDate, cause: '活动曝光或点位客流发生变化，需要结合现场客流和活动排期判断。', action: '核对点位客流与活动曝光，必要时调整屏幕引导内容。' })
    }
    const shareRateDrop = delta(current.shareRate, previous.shareRate)
    if (current.successCount > 0 && previous.shareRate > 0 && shareRateDrop < THRESHOLDS.trendDrop) {
      rows.push({ id: `${site.id}-share-trend`, type: 'trend', severity: 'warning', status: 'open', title: '分享转化较上一周期下降', metricLabel: '分享转化环比', siteId: site.id, siteName: site.name, triggeredValue: `${shareRateDrop.toFixed(1)}%`, threshold: `需关注 < ${THRESHOLDS.trendDrop}%`, occurredAt: latestDate, cause: '成功生成后的传播意愿下降，可能与内容承接页、分享入口或活动激励有关。', action: '对比上一周期的完成页曝光和分享按钮点击，优化分享引导。' })
    }
  })

  data.devices.filter((device) => siteMatches(device.siteId, siteId)).forEach((device) => {
    const site = siteList.find((item) => item.id === device.siteId)
    if (!site) return
    const effectiveStatus = getEffectiveDeviceStatus(device)
    const isOffline = effectiveStatus === 'offline'
    if (effectiveStatus === 'maintenance' || isOffline) {
      rows.push({ id: `${device.id}-device`, type: 'device', severity: isOffline ? 'critical' : 'warning', status: isOffline ? 'open' : 'acknowledged', title: isOffline ? '设备离线超过 3 分钟' : '设备处于维护状态', metricLabel: '设备在线状态', siteId: device.siteId, siteName: site.name, triggeredValue: isOffline ? `离线 ${minutesSinceHeartbeat(device.lastHeartbeat)} 分钟` : '维护中', threshold: isOffline ? '心跳间隔 ≤ 3 分钟' : '目标：在线', occurredAt: device.lastHeartbeat, cause: device.lastError ?? (isOffline ? '设备状态或心跳快照异常，当前无法确认设备在线。' : '现场设备正在维护，暂不承接新的生成任务。'), action: isOffline ? '检查网络和设备电源，恢复心跳后再重新放量。' : '确认维护窗口，完成校准后恢复设备。' })
    }
  })

  return rows
    .map((row) => ({ ...row, impact: impactFor(data, normalized, row), details: detailsFor(data, normalized, row) }))
    .sort((a, b) => (a.severity === 'critical' ? -1 : b.severity === 'critical' ? 1 : 0))
}

export function getSitePerformance(data: DataSet, range: DateRange, siteList: Site[], anomalyList: Anomaly[]): SitePerformanceRow[] {
  return siteList.map((site) => {
    const metrics = getDashboardMetrics(data, range, site.id)
    const siteAnomalies = anomalyList.filter((item) => item.siteId === site.id)
    const status: SitePerformanceRow['status'] = metrics.attempts === 0 && metrics.reviewedCount === 0
      ? 'no-data'
      : siteAnomalies.some((item) => item.severity === 'critical')
        ? 'critical'
        : siteAnomalies.length
          ? 'attention'
          : 'healthy'
    return { site, participants: metrics.participants, successRate: metrics.successRate, scanRate: metrics.scanRate, shareRate: metrics.shareRate, onlineRate: metrics.onlineRate, anomalyCount: siteAnomalies.length, status }
  }).sort((a, b) => b.participants - a.participants)
}

export function getInsight(metrics: DashboardMetrics, anomalies: Anomaly[]) {
  if (anomalies.some((item) => item.severity === 'critical')) return { tone: 'red' as const, title: '先处理稳定性和设备问题', body: `当前有 ${anomalies.filter((item) => item.severity === 'critical').length} 条高优先级异常，建议先恢复离线设备并检查生成队列。` }
  if (metrics.attempts === 0) return { tone: 'amber' as const, title: '当前范围暂无互动数据', body: '请扩大日期范围或恢复默认近 7 天，设备快照仍会单独展示。' }
  if (metrics.shareRate < THRESHOLDS.shareRate) return { tone: 'amber' as const, title: '互动完成了，传播还差一步', body: '生成成功后的分享动作偏弱，优先优化完成页的内容预览和分享引导。' }
  return { tone: 'teal' as const, title: '活动运行在健康区间', body: '当前没有高优先级异常，可以把运营精力放在提升分享率和点位复用率上。' }
}

export function metricDefinitionRows() {
  return [
    ['参与人数', '去重后的有效互动会话数', '生成事件中的 sessionId 去重'],
    ['生成成功率', '成功任务 ÷ 总任务', '按日期和点位筛选 generationEvents'],
    ['扫码转化率', '去重扫码会话数 ÷ 成功生成会话数', '衡量生成成功后的内容带走效率，统计 conversionEvents.scan 并去重'],
    ['分享转化率', '去重分享会话数 ÷ 成功生成会话数', '衡量生成成功后的传播效率，分享必须发生在扫码之后'],
    ['平均生成时长', '成功任务总耗时 ÷ 成功任务数', '只计算 status=success 的任务'],
    ['审核通过率', '通过数 ÷ 已审核内容数', '只统计 approved / rejected，排除 reviewing；环图单独展示待审核'],
    ['设备在线率', '有效在线设备数 ÷ 设备总数', '上报在线且最近心跳未超过 3 分钟；当前快照不参与日期环比'],
  ]
}
