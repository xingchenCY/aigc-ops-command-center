<script setup lang="ts">
import { Activity, CheckCircle2, Clock3, Settings2, WifiOff } from '@lucide/vue'
import type { Device, DeviceWithMetrics } from '@/types/domain'
import { getEffectiveDeviceStatus } from '@/utils/metrics'
import { formatNumber, formatPercent, formatSeconds } from '@/utils/formatters'

defineProps<{ devices: DeviceWithMetrics[]; snapshotTime: string }>()
const statusLabel = { online: '在线', offline: '离线', maintenance: '维护中' }
const statusIcon = { online: CheckCircle2, offline: WifiOff, maintenance: Settings2 }

function deviceIssue(device: Device) {
  if (device.lastError) return device.lastError
  return device.status === 'online' && getEffectiveDeviceStatus(device) === 'offline' ? '心跳超过 3 分钟' : undefined
}
</script>

<template>
  <section class="device-panel" aria-labelledby="device-title">
    <header class="device-panel__header">
      <div>
        <h2 id="device-title" class="device-panel__title">设备健康</h2>
        <p class="device-panel__subtitle">当前设备快照（截至 {{ snapshotTime }}）</p>
      </div>
      <span class="device-total"><Activity :size="14" />{{ devices.length }} 台</span>
    </header>
    <div class="device-list">
      <article v-for="item in devices" :key="item.device.id" class="device-row" :class="[`device-row--${getEffectiveDeviceStatus(item.device)}`, { 'device-row--metric-risk': item.metrics.hasLatencyRisk }]">
        <div class="device-status-icon"><component :is="statusIcon[getEffectiveDeviceStatus(item.device)]" :size="16" /></div>
        <div class="device-info"><strong>{{ item.device.name }}</strong><span>{{ item.device.modelVersion }} · 最近心跳 {{ item.device.lastHeartbeat.slice(11) }}</span><small v-if="deviceIssue(item.device)" class="device-error">{{ deviceIssue(item.device) }}</small></div>
        <div class="device-metric"><span>生成量</span><strong>{{ formatNumber(item.metrics.generationCount) }}</strong></div>
        <div class="device-metric"><span>成功率</span><strong>{{ item.metrics.generationCount ? formatPercent(item.metrics.successRate, 0) : '—' }}</strong></div>
        <div class="device-metric" :class="{ 'device-metric--risk': item.metrics.hasLatencyRisk }"><span>平均时长</span><strong>{{ item.metrics.generationCount ? formatSeconds(item.metrics.averageDuration) : '—' }}</strong></div>
        <div class="device-task"><span>进行中</span><strong>{{ item.device.activeJobs }}</strong></div>
        <div class="device-state"><span class="device-state__dot"></span>{{ statusLabel[getEffectiveDeviceStatus(item.device)] }}</div>
      </article>
      <div v-if="!devices.length" class="device-empty"><Clock3 :size="18" />当前筛选下暂无设备数据</div>
    </div>
  </section>
</template>

<style scoped>
.device-panel { overflow: hidden; }
.device-total { display: inline-flex; align-items: center; gap: 5px; padding-top: 2px; color: var(--muted); font-family: var(--mono); font-size: 10px; }
.device-list { margin-top: 18px; }
.device-row { display: grid; grid-template-columns: 32px minmax(0, 1fr) 58px 58px 68px 42px 60px; align-items: center; gap: 10px; padding: 13px 22px; border-top: 1px solid var(--line-soft); }
.device-row--metric-risk { background: linear-gradient(90deg, rgba(199,131,29,.08), transparent 42%); }
.device-status-icon { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; color: var(--teal); background: var(--teal-soft); }
.device-row--offline .device-status-icon { color: var(--red); background: var(--red-soft); }
.device-row--maintenance .device-status-icon { color: var(--amber); background: var(--amber-soft); }
.device-info { min-width: 0; }
.device-info strong, .device-info span, .device-info small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.device-info strong { color: var(--ink); font-size: 12px; font-weight: 650; }
.device-info span { margin-top: 4px; color: var(--muted); font-family: var(--mono); font-size: 10px; }
.device-error { margin-top: 4px; color: var(--red); font-size: 10px; }
.device-row--maintenance .device-error { color: var(--amber); }
.device-task { text-align: right; }
.device-task span, .device-metric span { display: block; color: var(--muted); font-size: 10px; }
.device-task strong, .device-metric strong { display: block; margin-top: 4px; color: var(--ink); font-family: var(--mono); font-size: 12px; }
.device-metric { text-align: right; }
.device-metric--risk strong { color: var(--amber); }
.device-state { display: flex; align-items: center; gap: 5px; color: var(--teal); font-size: 10px; white-space: nowrap; }
.device-row--offline .device-state { color: var(--red); }
.device-row--maintenance .device-state { color: var(--amber); }
.device-state__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.device-empty { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 160px; color: var(--muted); font-size: 12px; }
@media (max-width: 980px) { .device-row { grid-template-columns: 30px minmax(0, 1fr) 58px 58px; } .device-task, .device-state, .device-metric:nth-of-type(3) { display: none; } }
@media (max-width: 640px) { .device-row { grid-template-columns: 30px minmax(0, 1fr) 55px; padding: 13px 16px; } .device-metric:nth-of-type(2) { display: none; } }
</style>
