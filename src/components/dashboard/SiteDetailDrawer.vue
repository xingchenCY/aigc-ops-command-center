<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Clock3, MonitorSmartphone, Users, WifiOff } from '@lucide/vue'
import type { Anomaly, Device, DeviceWithMetrics, SitePerformanceRow } from '@/types/domain'
import { formatNumber, formatPercent, formatSeconds } from '@/utils/formatters'
import { getEffectiveDeviceStatus } from '@/utils/metrics'

defineProps<{
  open: boolean
  row: SitePerformanceRow | null
  devices: DeviceWithMetrics[]
  anomalies: Anomaly[]
}>()

const emit = defineEmits<{
  close: []
  selectAnomaly: [anomaly: Anomaly]
  analyzeSite: [siteId: string]
}>()

const statusLabel = { healthy: '健康', attention: '需关注', critical: '需处理', 'no-data': '暂无数据' }
const statusIcon = { healthy: CheckCircle2, attention: Clock3, critical: AlertTriangle, 'no-data': Clock3 }
const deviceLabel = { online: '在线', offline: '离线', maintenance: '维护中' }
const deviceIcon = { online: CheckCircle2, offline: WifiOff, maintenance: MonitorSmartphone }

function deviceIssue(device: Device) {
  if (device.lastError) return device.lastError
  return device.status === 'online' && getEffectiveDeviceStatus(device) === 'offline' ? '心跳超过 3 分钟' : undefined
}
</script>

<template>
  <a-drawer :open="open" :title="row ? `${row.site.name} · 点位详情` : '点位详情'" width="min(560px, 100vw)" :footer="null" placement="right" @close="emit('close')">
    <div v-if="row" class="site-detail">
      <div class="site-detail__hero" :class="`site-detail__hero--${row.status}`">
        <span class="site-detail__mark" :style="{ backgroundColor: row.site.accent }"></span>
        <div>
          <span class="site-detail__eyebrow">{{ row.site.city }} · {{ row.site.type }}</span>
          <h3>{{ row.site.name }}</h3>
          <p><component :is="statusIcon[row.status]" :size="14" />{{ statusLabel[row.status] }} · 当前筛选范围</p>
          <button class="site-detail__analyze" type="button" @click="emit('analyzeSite', row.site.id)">查看该点位分析</button>
        </div>
      </div>

      <div class="site-detail__metrics">
        <div><Users :size="15" /><span>参与人数</span><strong>{{ formatNumber(row.participants) }}</strong></div>
        <div><CheckCircle2 :size="15" /><span>生成成功率</span><strong>{{ formatPercent(row.successRate) }}</strong></div>
        <div><Clock3 :size="15" /><span>扫码 / 分享</span><strong>{{ formatPercent(row.scanRate, 0) }} / {{ formatPercent(row.shareRate, 0) }}</strong></div>
        <div><MonitorSmartphone :size="15" /><span>设备在线率</span><strong>{{ formatPercent(row.onlineRate, 0) }}</strong></div>
      </div>

      <section class="site-detail__section">
        <header><h4>设备状态</h4><span>{{ devices.length }} 台</span></header>
        <div v-if="devices.length" class="site-detail__devices">
          <div v-for="item in devices" :key="item.device.id" class="site-detail__device">
            <span class="device-detail__icon" :class="`device-detail__icon--${getEffectiveDeviceStatus(item.device)}`"><component :is="deviceIcon[getEffectiveDeviceStatus(item.device)]" :size="15" /></span>
            <div><strong>{{ item.device.name }}</strong><span>{{ item.device.modelVersion }} · {{ item.device.lastHeartbeat.slice(11) }}</span><small v-if="deviceIssue(item.device)">{{ deviceIssue(item.device) }}</small></div>
            <span class="device-detail__metric"><strong>{{ formatNumber(item.metrics.generationCount) }}</strong><small>生成</small></span>
            <span class="device-detail__metric" :class="{ 'device-detail__metric--risk': item.metrics.hasLatencyRisk }"><strong>{{ item.metrics.generationCount ? formatSeconds(item.metrics.averageDuration) : '—' }}</strong><small>平均</small></span>
            <b :class="`device-detail__status--${getEffectiveDeviceStatus(item.device)}`">{{ deviceLabel[getEffectiveDeviceStatus(item.device)] }}</b>
          </div>
        </div>
        <div v-else class="site-detail__empty">当前筛选下暂无设备数据</div>
      </section>

      <section class="site-detail__section">
        <header><h4>相关异常</h4><span>{{ anomalies.length }} 条</span></header>
        <div v-if="anomalies.length" class="site-detail__anomalies">
          <button v-for="anomaly in anomalies" :key="anomaly.id" type="button" @click="emit('selectAnomaly', anomaly)">
            <AlertTriangle :size="15" />
            <span><strong>{{ anomaly.title }}</strong><small>{{ anomaly.triggeredValue }} · {{ anomaly.status === 'open' ? '待处理' : '处理中' }}</small></span>
          </button>
        </div>
        <div v-else class="site-detail__empty">当前点位没有触发异常规则</div>
      </section>
    </div>
  </a-drawer>
</template>

<style scoped>
.site-detail { color: var(--ink-soft); }
.site-detail__hero { display: flex; gap: 12px; padding: 16px; border-radius: 8px; background: var(--surface); border: 1px solid var(--line); }
.site-detail__hero--critical { border-color: rgba(178,60,60,.24); background: var(--red-soft); }
.site-detail__hero--attention { border-color: rgba(169,101,18,.24); background: var(--amber-soft); }
.site-detail__mark { flex: 0 0 auto; width: 7px; height: 52px; border-radius: 4px; }
.site-detail__eyebrow { color: var(--muted); font-size: 11px; }
.site-detail__hero h3 { margin: 5px 0 0; color: var(--ink); font-size: 18px; }
.site-detail__hero p { display: flex; align-items: center; gap: 5px; margin: 8px 0 0; color: var(--muted); font-size: 11px; }
.site-detail__hero--critical p { color: var(--red); }
.site-detail__hero--attention p { color: var(--amber); }
.site-detail__analyze { min-height: 32px; margin-top: 12px; padding: 0 10px; border: 1px solid rgba(45,98,206,.25); border-radius: 7px; color: var(--blue); background: #fff; font-size: 11px; }
.site-detail__analyze:hover { background: var(--blue-soft); }
.site-detail__metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 9px; margin-top: 18px; }
.site-detail__metrics > div { display: grid; grid-template-columns: 18px 1fr; gap: 4px 7px; padding: 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
.site-detail__metrics svg { grid-row: span 2; color: var(--blue); }
.site-detail__metrics span { color: var(--muted); font-size: 10px; }
.site-detail__metrics strong { color: var(--ink); font-family: var(--mono); font-size: 15px; }
.site-detail__section { margin-top: 22px; }
.site-detail__section header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }
.site-detail__section h4 { margin: 0; color: var(--ink); font-size: 13px; }
.site-detail__section header span { color: var(--muted); font-family: var(--mono); font-size: 10px; }
.site-detail__devices { border-top: 1px solid var(--line); }
.site-detail__device { display: flex; align-items: center; gap: 9px; padding: 11px 0; border-bottom: 1px solid var(--line-soft); }
.device-detail__icon { display: grid; place-items: center; flex: 0 0 auto; width: 30px; height: 30px; border-radius: 7px; color: var(--teal); background: var(--teal-soft); }
.device-detail__icon--offline { color: var(--red); background: var(--red-soft); }
.device-detail__icon--maintenance { color: var(--amber); background: var(--amber-soft); }
.site-detail__device > div { min-width: 0; flex: 1; }
.site-detail__device strong, .site-detail__device span, .site-detail__device small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.site-detail__device strong { color: var(--ink); font-size: 12px; }
.site-detail__device span { margin-top: 3px; color: var(--muted); font-family: var(--mono); font-size: 10px; }
.site-detail__device small { margin-top: 3px; color: var(--red); font-size: 10px; }
.site-detail__device b { flex: 0 0 auto; font-size: 10px; font-weight: 650; }
.device-detail__metric { flex: 0 0 auto; text-align: right; }
.device-detail__metric strong, .device-detail__metric small { display: block; font-family: var(--mono); }
.device-detail__metric strong { color: var(--ink); font-size: 11px; }
.device-detail__metric small { margin-top: 2px; color: var(--muted); font-size: 9px; }
.device-detail__metric--risk strong { color: var(--amber); }
.device-detail__status--online { color: var(--teal); }
.device-detail__status--offline { color: var(--red); }
.device-detail__status--maintenance { color: var(--amber); }
.site-detail__anomalies { border-top: 1px solid var(--line); }
.site-detail__anomalies button { display: flex; align-items: flex-start; width: 100%; gap: 8px; padding: 11px 0; border: 0; border-bottom: 1px solid var(--line-soft); color: var(--amber); background: transparent; text-align: left; }
.site-detail__anomalies button:hover { color: var(--red); }
.site-detail__anomalies span { min-width: 0; }
.site-detail__anomalies strong, .site-detail__anomalies small { display: block; }
.site-detail__anomalies strong { color: var(--ink); font-size: 12px; }
.site-detail__anomalies small { margin-top: 4px; color: var(--muted); font-size: 10px; }
.site-detail__empty { padding: 20px 0; color: var(--muted); font-size: 11px; }
@media (max-width: 640px) { .site-detail__metrics strong { font-size: 13px; } }
</style>
