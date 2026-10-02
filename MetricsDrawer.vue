<script setup lang="ts">
import { BookOpen, CheckCircle2 } from '@lucide/vue'
import { metricDefinitionRows } from '@/utils/metrics'

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()
const rows = metricDefinitionRows()
</script>

<template>
  <a-drawer :open="open" title="指标口径" width="min(560px, 100vw)" placement="right" :footer="null" @close="$emit('close')">
    <div class="metrics-drawer">
      <div class="metrics-intro"><span class="intro-icon"><BookOpen :size="18" /></span><div><strong>让每个数字都可以被解释</strong><p>所有指标基于本地演示数据计算，筛选条件会同步作用于公式。</p></div></div>
      <div class="metric-list">
        <article v-for="row in rows" :key="row[0]" class="metric-item">
          <div class="metric-item__title"><CheckCircle2 :size="15" />{{ row[0] }}</div>
          <p>{{ row[1] }}</p>
          <span>{{ row[2] }}</span>
        </article>
      </div>
      <div class="metric-note">环比默认比较当前日期范围与前一个等长度日期范围。异常阈值以运营摘要中的目标为准。</div>
    </div>
  </a-drawer>
</template>

<style scoped>
.metrics-drawer { color: var(--ink-soft); }
.metrics-intro { display: flex; gap: 12px; padding: 16px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
.intro-icon { display: grid; place-items: center; flex: 0 0 auto; width: 34px; height: 34px; border-radius: 8px; color: var(--blue); background: var(--blue-soft); }
.metrics-intro strong { color: var(--ink); font-size: 14px; }
.metrics-intro p { margin: 6px 0 0; color: var(--muted); font-size: 12px; line-height: 1.55; }
.metric-list { margin-top: 18px; }
.metric-item { padding: 15px 0; border-bottom: 1px solid var(--line); }
.metric-item__title { display: flex; align-items: center; gap: 7px; color: var(--ink); font-size: 13px; font-weight: 700; }
.metric-item__title svg { color: var(--teal); }
.metric-item p { margin: 7px 0 5px 22px; color: var(--ink-soft); font-size: 12px; }
.metric-item span { display: block; margin-left: 22px; color: var(--muted); font-family: var(--mono); font-size: 10px; }
.metric-note { margin-top: 18px; padding: 12px; border-radius: 7px; color: var(--muted); background: var(--surface); font-size: 11px; line-height: 1.6; }
</style>
