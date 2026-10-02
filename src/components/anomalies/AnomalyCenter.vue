<script setup lang="ts">
import { computed, ref } from 'vue'
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, ShieldAlert, WifiOff } from '@lucide/vue'
import type { Anomaly } from '@/types/domain'

const emit = defineEmits<{ select: [anomaly: Anomaly] }>()

const iconMap = { generation: ShieldAlert, latency: Clock3, conversion: ArrowUpRight, moderation: AlertTriangle, trend: ArrowUpRight, device: WifiOff }
const severityLabel = { critical: '高优先级', warning: '需关注', info: '提示' }
const expanded = ref(false)
const props = defineProps<{ anomalies: Anomaly[] }>()
const expandedLimit = 20
const visibleAnomalies = computed(() => expanded.value ? props.anomalies.slice(0, expandedLimit) : props.anomalies.slice(0, 6))

function exportCsv() {
  const rows = [
    ['异常标题', '点位', '等级', '指标', '触发值', '阈值', '状态'],
    ...props.anomalies.map((item) => [item.title, item.siteName, item.severity, item.metricLabel, item.triggeredValue, item.threshold, item.status]),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'aigc-anomalies.csv'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <section class="anomaly-panel" aria-labelledby="anomaly-title">
    <header class="anomaly-panel__header">
      <div>
        <h2 id="anomaly-title" class="anomaly-panel__title">异常中心</h2>
        <p class="anomaly-panel__subtitle">由阈值和环比规则自动识别，点击查看处理建议</p>
      </div>
      <div class="anomaly-actions">
        <button v-if="anomalies.length" type="button" @click="exportCsv">导出 CSV</button>
        <span class="anomaly-count" :class="{ 'anomaly-count--alert': anomalies.length }">{{ anomalies.length }} 条</span>
      </div>
    </header>
    <div class="anomaly-list">
      <button v-for="anomaly in visibleAnomalies" :key="anomaly.id" class="anomaly-row" type="button" @click="emit('select', anomaly)">
        <span class="anomaly-icon" :class="`anomaly-icon--${anomaly.severity}`"><component :is="iconMap[anomaly.type as keyof typeof iconMap]" :size="16" /></span>
        <span class="anomaly-main"><span class="anomaly-title"><strong>{{ anomaly.title }}</strong><small>{{ anomaly.siteName }}</small></span><span class="anomaly-meta"><b :class="`severity-${anomaly.severity}`">{{ severityLabel[anomaly.severity as keyof typeof severityLabel] }}</b><span>{{ anomaly.triggeredValue }} · {{ anomaly.occurredAt.slice(5) }}</span></span></span>
        <ArrowUpRight class="anomaly-arrow" :size="16" />
      </button>
      <div v-if="!anomalies.length" class="anomaly-empty"><CheckCircle2 :size="20" /><strong>当前没有需要处理的异常</strong><span>继续保持点位和设备的健康状态。</span></div>
      <button v-else-if="anomalies.length > 6" class="anomaly-more" type="button" :aria-expanded="expanded" @click="expanded = !expanded">
        {{ expanded ? '收起异常列表' : `显示其余 ${anomalies.length - 6} 条异常` }}
      </button>
      <div v-if="expanded && anomalies.length > expandedLimit" class="anomaly-limit">已显示前 {{ expandedLimit }} 条，其余请按点位筛选查看。</div>
    </div>
  </section>
</template>

<style scoped>
.anomaly-panel { overflow: hidden; }
.anomaly-count { padding-top: 2px; color: var(--muted); font-family: var(--mono); font-size: 11px; }
.anomaly-count--alert { color: var(--red); }
.anomaly-actions { display: flex; align-items: center; gap: 8px; }
.anomaly-actions button { min-height: 30px; padding: 0 9px; border: 1px solid var(--line); border-radius: 7px; color: var(--blue); background: #fff; font-size: 11px; }
.anomaly-list { margin-top: 18px; }
.anomaly-row { display: flex; align-items: center; width: 100%; gap: 11px; padding: 14px 22px; border: 0; border-top: 1px solid var(--line-soft); color: var(--ink); background: transparent; text-align: left; transition: background .2s ease; }
.anomaly-row:hover { background: #fbfcfd; }
.anomaly-icon { display: grid; place-items: center; flex: 0 0 auto; width: 32px; height: 32px; border-radius: 8px; }
.anomaly-icon--critical { color: var(--red); background: var(--red-soft); }
.anomaly-icon--warning { color: var(--amber); background: var(--amber-soft); }
.anomaly-icon--info { color: var(--blue); background: var(--blue-soft); }
.anomaly-main { min-width: 0; flex: 1; }
.anomaly-title, .anomaly-meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.anomaly-title strong { overflow: hidden; color: var(--ink); font-size: 12px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.anomaly-title small, .anomaly-meta span { color: var(--muted); font-size: 10px; white-space: nowrap; }
.anomaly-meta { justify-content: flex-start; margin-top: 5px; }
.anomaly-meta b { padding: 2px 5px; border-radius: 4px; font-size: 10px; font-weight: 650; }
.severity-critical { color: var(--red); background: var(--red-soft); }
.severity-warning { color: var(--amber); background: var(--amber-soft); }
.severity-info { color: var(--blue); background: var(--blue-soft); }
.anomaly-arrow { flex: 0 0 auto; color: var(--muted); }
.anomaly-empty { display: flex; align-items: center; flex-direction: column; gap: 7px; padding: 50px 18px; color: var(--teal); text-align: center; }
.anomaly-empty strong { color: var(--ink); font-size: 13px; }
.anomaly-empty span { color: var(--muted); font-size: 11px; }
.anomaly-more { width: 100%; margin: 0; padding: 13px 22px 16px; border: 0; color: var(--blue); background: transparent; font-size: 11px; text-align: left; }
.anomaly-more:hover { background: var(--surface-soft); }
.anomaly-limit { padding: 0 22px 16px; color: var(--muted); font-size: 11px; }
@media (max-width: 640px) { .anomaly-row { padding: 13px 16px; } .anomaly-title { align-items: flex-start; flex-direction: column; gap: 3px; } .anomaly-title small { font-size: 10px; } }
</style>
