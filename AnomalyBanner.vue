<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, ArrowDownRight, ShieldCheck } from '@lucide/vue'
import type { Anomaly } from '@/types/domain'

const props = defineProps<{ anomalies: Anomaly[] }>()
const emit = defineEmits<{ focusAnomalies: [] }>()

const critical = computed(() => props.anomalies.filter((item) => item.severity === 'critical'))
const tone = computed(() => critical.value.length ? 'critical' : props.anomalies.length ? 'warning' : 'healthy')
const summary = computed(() => {
  if (critical.value.length) {
    const labels = Array.from(new Set(critical.value.map((item) => item.title))).slice(0, 2).join(' / ')
    return `当前 ${critical.value.length} 条高优先级异常：${labels}`
  }
  if (props.anomalies.length) return `当前 ${props.anomalies.length} 条运营提醒，建议按异常中心优先级处理`
  return '当前筛选范围运行健康'
})
</script>

<template>
  <button v-if="anomalies.length" class="anomaly-banner" :class="`anomaly-banner--${tone}`" type="button" @click="emit('focusAnomalies')">
    <span class="anomaly-banner__icon">
      <AlertTriangle v-if="tone !== 'healthy'" :size="17" />
      <ShieldCheck v-else :size="17" />
    </span>
    <span>{{ summary }}</span>
    <strong>查看异常中心 <ArrowDownRight :size="14" /></strong>
  </button>
</template>

<style scoped>
.anomaly-banner { display: flex; align-items: center; width: 100%; gap: 10px; min-height: 46px; margin-top: 12px; padding: 11px 15px; border: 1px solid rgba(199,131,29,.26); border-radius: var(--radius); color: var(--amber); background: var(--amber-soft); text-align: left; }
.anomaly-banner--critical { border-color: rgba(208,74,74,.28); color: var(--red); background: var(--red-soft); }
.anomaly-banner__icon { display: grid; place-items: center; flex: 0 0 auto; width: 28px; height: 28px; border-radius: 7px; background: rgba(255,255,255,.62); }
.anomaly-banner span:nth-child(2) { flex: 1; color: var(--ink); font-size: 13px; font-weight: 650; }
.anomaly-banner strong { display: inline-flex; align-items: center; gap: 5px; color: currentColor; font-size: 11px; white-space: nowrap; }
@media (max-width: 640px) { .anomaly-banner { align-items: flex-start; } .anomaly-banner strong { display: none; } }
</style>
