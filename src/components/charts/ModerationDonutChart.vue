<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import type { EChartsOption } from 'echarts'
import VChart from 'vue-echarts'
import type { DashboardMetrics } from '@/types/domain'
import { formatNumber, formatPercent } from '@/utils/formatters'
import { getModerationStatusSlices } from '@/utils/metrics'

use([CanvasRenderer, PieChart, LegendComponent, TooltipComponent])

const props = defineProps<{ metrics: DashboardMetrics }>()
const slices = computed(() => getModerationStatusSlices(props.metrics))
const total = computed(() => slices.value.reduce((sum, item) => sum + item.value, 0))
const hasData = computed(() => total.value > 0)

const chartOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 360,
  color: slices.value.map((item) => item.color),
  tooltip: {
    trigger: 'item',
    backgroundColor: '#142233',
    borderWidth: 0,
    textStyle: { color: '#fff', fontSize: 11 },
    formatter: (params: unknown) => {
      const item = params as Record<string, unknown>
      const value = Number(item.value ?? 0)
      return `${String(item.name)}<br/>数量：${formatNumber(value)}<br/>占比：${formatPercent(total.value ? (value / total.value) * 100 : 0)}`
    },
  },
  legend: { right: 0, top: 'middle', orient: 'vertical', itemWidth: 9, itemHeight: 9, textStyle: { color: '#637284', fontSize: 11 } },
  series: [{
    name: '审核状态',
    type: 'pie',
    radius: ['52%', '74%'],
    center: ['34%', '50%'],
    avoidLabelOverlap: true,
    label: { show: false },
    data: slices.value.map((item) => ({ name: item.name, value: item.value })),
  }],
}))
</script>

<template>
  <section class="moderation-donut" aria-label="内容审核状态占比">
    <header>
      <div>
        <h3>内容审核状态</h3>
        <p>通过 / 驳回 / 待审核三态分布</p>
      </div>
      <strong>{{ formatNumber(total) }}</strong>
    </header>
    <VChart v-if="hasData" class="moderation-donut__chart" :option="chartOption" autoresize />
    <div v-else class="moderation-donut__empty">当前筛选范围暂无审核数据</div>
  </section>
</template>

<style scoped>
.moderation-donut { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line-soft); }
.moderation-donut header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.moderation-donut h3 { margin: 0; color: var(--ink); font-size: 13px; }
.moderation-donut p { margin: 5px 0 0; color: var(--muted); font-size: 11px; }
.moderation-donut strong { color: var(--ink); font-family: var(--mono); font-size: 14px; }
.moderation-donut__chart, .moderation-donut__empty { width: 100%; height: 170px; }
.moderation-donut__empty { display: grid; place-items: center; color: var(--muted); font-size: 12px; }
</style>
