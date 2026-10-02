<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { FunnelChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import type { EChartsOption } from 'echarts'
import VChart from 'vue-echarts'
import type { FunnelStep } from '@/types/domain'
import { formatNumber, formatPercent } from '@/utils/formatters'

use([CanvasRenderer, FunnelChart, LegendComponent, TooltipComponent])

const props = defineProps<{ funnel: FunnelStep[] }>()
const hasData = computed(() => props.funnel.some((item) => item.value > 0))
const chartOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 400,
  aria: { enabled: true },
  tooltip: { trigger: 'item', backgroundColor: '#142233', borderWidth: 0, textStyle: { color: '#fff', fontSize: 11 }, formatter: (params: unknown) => { const item = params as Record<string, unknown>; const name = String(item.name ?? ''); return `${name}<br/>人数：${formatNumber(Number(item.value))}<br/>环节转化：${formatPercent(props.funnel.find((step) => step.name === name)?.rate ?? 0)}` } },
  series: [{ type: 'funnel', left: '8%', top: 16, bottom: 12, width: '84%', min: 0, max: Math.max(...props.funnel.map((item) => item.value), 1), minSize: '22%', maxSize: '92%', sort: 'descending', gap: 5, label: { show: true, position: 'inside', color: '#fff', fontSize: 11, formatter: (item) => `${item.name}  ${formatNumber(Number(item.value))}` }, itemStyle: { borderColor: '#fff', borderWidth: 2 }, data: props.funnel.map((item) => ({ name: item.name, value: item.value, itemStyle: { color: item.color } })) }],
}))
</script>

<template>
  <div class="funnel-chart">
    <template v-if="hasData">
      <VChart class="chart" :option="chartOption" autoresize aria-label="互动转化漏斗图" />
    </template>
    <div v-else class="funnel-empty">当前筛选范围暂无可用的转化数据</div>
    <div v-if="hasData" class="funnel-legend">
      <div v-for="(item, index) in funnel" :key="item.name" class="funnel-step">
        <span class="funnel-step__dot" :style="{ backgroundColor: item.color }"></span>
        <span>{{ index ? `较上一步 ${formatPercent(item.rate, 0)}` : '基准人数' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.funnel-chart { min-width: 0; }
.chart { width: 100%; height: 286px; }
.funnel-empty { display: grid; place-items: center; height: 286px; color: var(--muted); font-size: 12px; }
.funnel-legend { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 14px; padding: 0 6px; }
.funnel-step { display: flex; align-items: center; gap: 7px; color: var(--muted); font-size: 10px; }
.funnel-step__dot { width: 7px; height: 7px; border-radius: 50%; }
@media (max-width: 640px) { .chart { height: 250px; } }
</style>
