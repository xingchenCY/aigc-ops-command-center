export type SiteStatus = 'active' | 'paused'
export type DeviceStatus = 'online' | 'offline' | 'maintenance'
export type GenerationStatus = 'success' | 'failed'
export type ModerationResult = 'approved' | 'rejected' | 'reviewing'
export type AnomalySeverity = 'critical' | 'warning' | 'info'
export type AnomalyStatus = 'open' | 'acknowledged' | 'resolved'

export interface DateRange {
  start: string
  end: string
}

export interface Site {
  id: string
  name: string
  city: string
  type: string
  status: SiteStatus
  accent: string
}

export interface Device {
  id: string
  name: string
  siteId: string
  status: DeviceStatus
  lastHeartbeat: string
  activeJobs: number
  modelVersion: string
  lastError?: string
}

export interface Campaign {
  id: string
  name: string
  modelVersion: string
  moderationPolicy: string
}

export interface GenerationEvent {
  id: string
  date: string
  time: string
  sessionId: string
  siteId: string
  deviceId: string
  campaignId: string
  status: GenerationStatus
  durationSec: number
}

export interface ConversionEvent {
  id: string
  date: string
  sessionId: string
  siteId: string
  type: 'scan' | 'share'
}

export interface ModerationEvent {
  id: string
  date: string
  sessionId: string
  siteId: string
  result: ModerationResult
  reason?: string
}

export interface DashboardKpi {
  key: string
  label: string
  value: number
  displayValue: string
  unit?: string
  delta: number
  deltaLabel: string
  hasBaseline?: boolean
  tone: 'blue' | 'teal' | 'amber' | 'red'
  icon: string
  helper: string
}

export interface DashboardMetrics {
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
  kpis: DashboardKpi[]
  deltas: Record<string, number>
}

export interface TrendPoint {
  date: string
  participants: number
  successRate: number | null
  averageDuration: number | null
}

export interface HourlyTrendPoint {
  hour: string
  participants: number
  successRate: number | null
}

export interface FunnelStep {
  name: string
  value: number
  rate: number
  color: string
}

export interface ModerationStatusCounts {
  approved: number
  rejected: number
  reviewing: number
}

export interface ModerationStatusSlice {
  key: keyof ModerationStatusCounts
  name: string
  value: number
  color: string
}

export interface DeviceMetric {
  deviceId: string
  generationCount: number
  successRate: number
  averageDuration: number
  hasLatencyRisk: boolean
}

export interface DeviceWithMetrics {
  device: Device
  metrics: DeviceMetric
}

export interface AnomalyDetailGroup {
  title: string
  rows: Array<{
    label: string
    value: number
    share: number
  }>
}

export interface SitePerformanceRow {
  site: Site
  participants: number
  successRate: number
  scanRate: number
  shareRate: number
  onlineRate: number
  anomalyCount: number
  status: 'healthy' | 'attention' | 'critical' | 'no-data'
}

export interface Anomaly {
  id: string
  type: string
  severity: AnomalySeverity
  status: AnomalyStatus
  title: string
  metricLabel: string
  siteId: string
  siteName: string
  triggeredValue: string
  threshold: string
  occurredAt: string
  cause: string
  action: string
  impact?: {
    sessions: number
    tasks: number
    devices: number
  }
  details?: AnomalyDetailGroup[]
}
