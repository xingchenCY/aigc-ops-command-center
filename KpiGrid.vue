<script setup lang="ts">
import { Clock3, MonitorSmartphone, QrCode, Share2, Sparkles, Users } from '@lucide/vue'
import type { DashboardKpi, DashboardMetrics } from '@/types/domain'

defineProps<{ metrics: DashboardMetrics }>()

const iconMap = { users: Users, sparkles: Sparkles, qr: QrCode, share: Share2, clock: Clock3, monitor: MonitorSmartphone }

function isImprovement(kpi: DashboardKpi) {
  if (!kpi.hasBaseline || kpi.delta === 0) return false
  return kpi.key === 'averageDuration' ? kpi.delta < 0 : kpi.delta > 0
}

function isRegression(kpi: DashboardKpi) {
  if (!kpi.hasBaseline || kpi.delta === 0) return false
  return kpi.key === 'averageDuration' ? kpi.delta > 0 : kpi.delta < 0
}
</script>

<template>
  <section class="kpi-grid" aria-label="核心指标">
    <article v-for="kpi in metrics.kpis" :key="kpi.key" class="kpi-card" :class="`kpi-card--${kpi.tone}`">
      <div class="kpi-card__topline">
        <span class="kpi-card__label">{{ kpi.label }}</span>
        <span class="kpi-card__icon"><component :is="iconMap[kpi.icon as keyof typeof iconMap]" :size="16" /></span>
      </div>
      <div class="kpi-card__value">{{ kpi.displayValue }}<small v-if="kpi.unit">{{ kpi.unit }}</small></div>
      <div class="kpi-card__footer">
        <span class="kpi-delta" :class="{ positive: isImprovement(kpi), negative: isRegression(kpi), neutral: !kpi.hasBaseline }">
          {{ kpi.deltaLabel }}
          <span v-if="kpi.hasBaseline">较上一周期</span>
        </span>
        <span class="kpi-helper">{{ kpi.helper }}</span>
      </div>
    </article>
  </section>
</template>

<style scoped>
.kpi-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
.kpi-card { min-width: 0; padding: 17px 16px 15px; border: 1px solid var(--line); border-top: 3px solid var(--blue); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-sm); }
.kpi-card--teal { border-top-color: var(--teal); }
.kpi-card--amber { border-top-color: var(--amber); }
.kpi-card--red { border-top-color: var(--red); }
.kpi-card__topline, .kpi-card__footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.kpi-card__label { overflow: hidden; color: var(--ink-soft); font-size: 12px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.kpi-card__icon { display: grid; place-items: center; flex: 0 0 auto; width: 28px; height: 28px; border-radius: 7px; color: var(--blue); background: var(--blue-soft); }
.kpi-card--teal .kpi-card__icon { color: var(--teal); background: var(--teal-soft); }
.kpi-card--amber .kpi-card__icon { color: var(--amber); background: var(--amber-soft); }
.kpi-card--red .kpi-card__icon { color: var(--red); background: var(--red-soft); }
.kpi-card__value { margin: 15px 0 12px; color: var(--ink); font-family: var(--mono); font-size: 27px; font-weight: 700; letter-spacing: 0; line-height: 1; }
.kpi-card__value small { margin-left: 3px; font-family: inherit; font-size: 12px; font-weight: 600; }
.kpi-card__footer { align-items: flex-end; flex-direction: column; gap: 7px; }
.kpi-delta { align-self: flex-start; color: var(--muted); font-family: var(--mono); font-size: 11px; font-weight: 600; }
.kpi-delta span { color: var(--muted); font-family: inherit; font-size: 10px; font-weight: 400; }
.kpi-delta.positive { color: var(--teal); }
.kpi-delta.negative { color: var(--red); }
.kpi-helper { align-self: flex-start; overflow: hidden; width: 100%; color: var(--muted); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 1240px) { .kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 640px) { .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; margin-top: 14px; } .kpi-card { padding: 14px 12px 12px; } .kpi-card__value { margin: 13px 0 10px; font-size: 20px; } .kpi-helper { font-size: 10px; } }
</style>
