<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, CheckCircle2, CircleGauge, ShieldCheck } from '@lucide/vue'
import type { Anomaly, DashboardMetrics } from '@/types/domain'
import { getInsight, THRESHOLDS } from '@/utils/metrics'
import { formatPercent } from '@/utils/formatters'

const props = defineProps<{ metrics: DashboardMetrics; anomalies: Anomaly[] }>()
const insight = computed(() => getInsight(props.metrics, props.anomalies))
const openAnomalyCount = computed(() => props.anomalies.filter((item) => item.status === 'open').length)
const moderationLabel = computed(() => props.metrics.reviewedCount ? formatPercent(props.metrics.moderationPassRate) : '—')
const iconMap = { teal: CheckCircle2, amber: CircleGauge, red: AlertTriangle }
</script>

<template>
  <section class="summary-panel" aria-labelledby="summary-title">
    <header class="summary-panel__header">
      <div>
        <h2 id="summary-title" class="summary-panel__title">运营摘要</h2>
        <p class="summary-panel__subtitle">指标背后的下一步动作</p>
      </div>
      <span class="summary-signal" :class="`summary-signal--${insight.tone}`"><component :is="iconMap[insight.tone as keyof typeof iconMap]" :size="15" /></span>
    </header>
    <div class="summary-panel__body">
      <div class="insight-callout" :class="`insight-callout--${insight.tone}`">
        <strong>{{ insight.title }}</strong>
        <p>{{ insight.body }}</p>
      </div>
      <div class="summary-list">
        <div class="summary-row"><span><ShieldCheck :size="15" />审核通过率</span><strong>{{ moderationLabel }}</strong></div>
        <div class="summary-row"><span><CircleGauge :size="15" />在线设备</span><strong>{{ metrics.onlineDevices }} / {{ metrics.totalDevices }}</strong></div>
        <div class="summary-row"><span><AlertTriangle :size="15" />待处理异常</span><strong>{{ openAnomalyCount }} 条</strong></div>
      </div>
      <div class="threshold-note">当前阈值：成功率 ≥ {{ THRESHOLDS.successRate }}% · 平均耗时 ≤ {{ THRESHOLDS.averageDuration }}s · 在线率 ≥ {{ THRESHOLDS.onlineRate }}%</div>
    </div>
  </section>
</template>

<style scoped>
.summary-panel { min-height: 100%; }
.summary-panel__body { padding: 20px 22px 22px; }
.summary-signal { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 7px; }
.summary-signal--teal { color: var(--teal); background: var(--teal-soft); }
.summary-signal--amber { color: var(--amber); background: var(--amber-soft); }
.summary-signal--red { color: var(--red); background: var(--red-soft); }
.insight-callout { padding: 15px; border-left: 3px solid var(--teal); border-radius: 7px; background: var(--teal-soft); }
.insight-callout--amber { border-left-color: var(--amber); background: var(--amber-soft); }
.insight-callout--red { border-left-color: var(--red); background: var(--red-soft); }
.insight-callout strong { color: var(--ink); font-size: 14px; }
.insight-callout p { margin: 8px 0 0; color: var(--ink-soft); font-size: 12px; line-height: 1.65; }
.summary-list { display: grid; gap: 0; margin-top: 18px; border-top: 1px solid var(--line-soft); }
.summary-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 13px 0; border-bottom: 1px solid var(--line-soft); color: var(--ink-soft); font-size: 12px; }
.summary-row span { display: inline-flex; align-items: center; gap: 8px; }
.summary-row svg { color: var(--muted); }
.summary-row strong { color: var(--ink); font-family: var(--mono); font-size: 13px; }
.threshold-note { margin-top: 16px; color: var(--muted); font-size: 10px; line-height: 1.5; }
@media (max-width: 640px) { .summary-panel__body { padding: 16px; } }
</style>
