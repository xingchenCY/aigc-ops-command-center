<script setup lang="ts">
import { AlertTriangle, ArrowRight, CheckCircle2, Lightbulb, MapPin } from '@lucide/vue'
import type { Anomaly } from '@/types/domain'
import { formatPercent } from '@/utils/formatters'

defineProps<{ open: boolean; anomaly: Anomaly | null }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <a-drawer :open="open" title="异常详情" width="min(520px, 100vw)" :footer="null" placement="right" @close="$emit('close')">
    <div v-if="anomaly" class="anomaly-detail">
      <div class="detail-hero" :class="`detail-hero--${anomaly.severity}`">
        <div class="detail-hero__icon"><AlertTriangle :size="19" /></div>
        <div><span class="detail-status">{{ anomaly.severity === 'critical' ? '高优先级异常' : '运营提醒' }}</span><h3>{{ anomaly.title }}</h3><p><MapPin :size="13" />{{ anomaly.siteName }} · {{ anomaly.occurredAt }}</p></div>
      </div>
      <div class="detail-metric"><span>{{ anomaly.metricLabel }}</span><strong>{{ anomaly.triggeredValue }}</strong><em>阈值 {{ anomaly.threshold }}</em></div>
      <div v-if="anomaly.impact" class="impact-section">
        <h4>影响范围</h4>
        <div class="impact-grid">
          <div><strong>{{ anomaly.impact.sessions }}</strong><span>互动会话</span></div>
          <div><strong>{{ anomaly.impact.tasks }}</strong><span>生成任务</span></div>
          <div><strong>{{ anomaly.impact.devices }}</strong><span>关联设备</span></div>
        </div>
      </div>
      <div class="detail-section"><h4><ArrowRight :size="15" />可能原因</h4><p>{{ anomaly.cause }}</p></div>
      <div v-if="anomaly.details?.length" class="detail-breakdown">
        <section v-for="group in anomaly.details" :key="group.title" class="detail-breakdown__group">
          <h4>{{ group.title }}</h4>
          <div v-if="group.rows.length" class="detail-breakdown__rows">
            <div v-for="row in group.rows" :key="row.label" class="detail-breakdown__row">
              <span>{{ row.label }}</span>
              <strong>{{ row.value }}</strong>
              <i><b :style="{ width: `${Math.max(row.share, 4)}%` }"></b></i>
              <em>{{ formatPercent(row.share, 0) }}</em>
            </div>
          </div>
          <p v-else>当前筛选范围暂无对应明细。</p>
        </section>
      </div>
      <div class="detail-section detail-section--action"><h4><Lightbulb :size="15" />建议动作</h4><p>{{ anomaly.action }}</p></div>
      <div class="detail-footer"><CheckCircle2 :size="15" />已标记为{{ anomaly.status === 'open' ? '待处理' : '处理中' }}，建议在运营台完成闭环记录。</div>
    </div>
  </a-drawer>
</template>

<style scoped>
.anomaly-detail { color: var(--ink-soft); }
.detail-hero { display: flex; gap: 12px; padding: 16px; border-radius: 8px; background: var(--amber-soft); }
.detail-hero--critical { background: var(--red-soft); }
.detail-hero__icon { display: grid; place-items: center; flex: 0 0 auto; width: 36px; height: 36px; border-radius: 9px; color: var(--amber); background: rgba(199,131,29,.12); }
.detail-hero--critical .detail-hero__icon { color: var(--red); background: rgba(208,74,74,.12); }
.detail-status { color: var(--amber); font-size: 11px; font-weight: 700; }
.detail-hero--critical .detail-status { color: var(--red); }
.detail-hero h3 { margin: 5px 0 0; color: var(--ink); font-size: 16px; }
.detail-hero p { display: flex; align-items: center; gap: 5px; margin: 8px 0 0; color: var(--muted); font-size: 11px; }
.detail-metric { display: grid; grid-template-columns: 1fr auto; gap: 7px 12px; margin-top: 22px; padding-bottom: 18px; border-bottom: 1px solid var(--line); }
.detail-metric span { color: var(--muted); font-size: 12px; }
.detail-metric strong { color: var(--ink); font-family: var(--mono); font-size: 22px; }
.detail-metric em { grid-column: 1 / -1; color: var(--muted); font-size: 11px; font-style: normal; }
.impact-section { margin-top: 18px; }
.impact-section h4 { margin: 0 0 9px; color: var(--ink); font-size: 13px; }
.impact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.impact-grid > div { padding: 11px 10px; border: 1px solid var(--line); border-radius: 7px; background: var(--surface); }
.impact-grid strong, .impact-grid span { display: block; }
.impact-grid strong { color: var(--ink); font-family: var(--mono); font-size: 16px; }
.impact-grid span { margin-top: 4px; color: var(--muted); font-size: 10px; }
.detail-section { margin-top: 22px; padding: 15px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
.detail-section--action { border-color: rgba(21,155,121,.22); background: var(--teal-soft); }
.detail-section h4 { display: flex; align-items: center; gap: 7px; margin: 0; color: var(--ink); font-size: 13px; }
.detail-section h4 svg { color: var(--blue); }
.detail-section--action h4 svg { color: var(--teal); }
.detail-section p { margin: 9px 0 0; color: var(--ink-soft); font-size: 12px; line-height: 1.7; }
.detail-breakdown { margin-top: 22px; display: grid; gap: 10px; }
.detail-breakdown__group { padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
.detail-breakdown__group h4 { margin: 0 0 10px; color: var(--ink); font-size: 13px; }
.detail-breakdown__group p { margin: 0; color: var(--muted); font-size: 11px; }
.detail-breakdown__rows { display: grid; gap: 8px; }
.detail-breakdown__row { display: grid; grid-template-columns: minmax(0, 1fr) 32px 76px 38px; align-items: center; gap: 8px; color: var(--ink-soft); font-size: 11px; }
.detail-breakdown__row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.detail-breakdown__row strong, .detail-breakdown__row em { color: var(--ink); font-family: var(--mono); font-size: 11px; font-style: normal; text-align: right; }
.detail-breakdown__row i { overflow: hidden; height: 6px; border-radius: 999px; background: var(--line-soft); }
.detail-breakdown__row b { display: block; height: 100%; border-radius: inherit; background: var(--blue); }
.detail-footer { display: flex; align-items: flex-start; gap: 7px; margin-top: 18px; color: var(--muted); font-size: 11px; line-height: 1.55; }
.detail-footer svg { flex: 0 0 auto; color: var(--teal); }
</style>
