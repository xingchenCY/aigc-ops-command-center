<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import type { EChartsOption } from 'echarts'
import VChart from 'vue-echarts'
import type { HourlyTrendPoint, TrendPoint } from '@/types/domain'
import { dateLabel } from '@/utils/formatters'

use([CanvasRenderer, LineChart, GridComponent, LegendComponent, TooltipComponent])

const props = defineProps<{ trend: TrendPoint[]; hourlyTrend: HourlyTrendPoint[]; hourlyDate: string }>()
const mode = shallowRef<'day' | 'hour'>('day')
const hasData = computed(() => props.trend.some((item) => item.participants > 0 || item.successRate !== null || item.averageDuration !== null))
const hasHourlyData = computed(() => props.hourlyTrend.some((item) => item.participants > 0 || item.successRate !== null))
const activeHasData = computed(() => mode.value === 'day' ? hasData.value : hasHourlyData.value)

const chartOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 400,
  color: ['#2d62ce', '#159b79', '#c7831d'],
  aria: { enabled: true },
  grid: { left: 8, right: 30, top: 42, bottom: 8 },
  legend: { top: 0, right: 4, itemWidth: 14, itemHeight: 8, textStyle: { color: '#637284', fontSize: 11 } },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'line', lineStyle: { color: '#c9d4df' } },
    backgroundColor: '#142233',
    borderWidth: 0,
    textStyle: { color: '#fff', fontSize: 11 },
    formatter: (params: unknown) => {
      const items = (Array.isArray(params) ? params : [params]) as Array<Record<string, unknown>>
      const date = String(items[0]?.axisValue ?? '')
      const lines = items.map((item) => {
        const seriesName = String(item.seriesName ?? '')
        const value = seriesName === '参与人数' ? `${item.value} 人` : seriesName === '成功率' ? `${Number(item.value).toFixed(1)}%` : `${Number(item.value).toFixed(1)}s`
        return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${String(item.color)};margin-right:6px"></span>${seriesName}：${value}`
      })
      return `<div style="font-weight:600;margin-bottom:6px">${dateLabel(date)}</div>${lines.join('<br/>')}`
    },
  },
  xAxis: { type: 'category', boundaryGap: false, data: mode.value === 'day' ? props.trend.map((item) => item.date) : props.hourlyTrend.map((item) => item.hour), axisLine: { lineStyle: { color: '#dce3ea' } }, axisTick: { show: false }, axisLabel: { color: '#637284', fontSize: 10, formatter: (value: string) => mode.value === 'day' ? value.slice(5).replace('-', '/') : value } },
  yAxis: [
    { type: 'value', name: '人数', min: 0, splitLine: { lineStyle: { color: '#edf1f4' } }, axisLabel: { color: '#637284', fontSize: 10 } },
    { type: 'value', name: '%', min: 0, max: 100, position: 'right', splitLine: { show: false }, axisLabel: { color: '#637284', fontSize: 10, formatter: '{value}%' } },
    { type: 'value', name: 's', min: 0, max: 24, position: 'right', offset: 32, splitLine: { show: false }, axisLabel: { color: '#637284', fontSize: 10, formatter: '{value}s' } },
  ],
  series: [
    { name: '参与人数', type: 'line', smooth: true, yAxisIndex: 0, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2.5 }, areaStyle: { color: 'rgba(45,98,206,.08)' }, data: mode.value === 'day' ? props.trend.map((item) => item.participants) : props.hourlyTrend.map((item) => item.participants) },
    { name: '成功率', type: 'line', smooth: true, connectNulls: false, yAxisIndex: 1, symbol: 'none', lineStyle: { width: 2 }, data: mode.value === 'day' ? props.trend.map((item) => item.successRate === null ? null : Number(item.successRate.toFixed(1))) : props.hourlyTrend.map((item) => item.successRate === null ? null : Number(item.successRate.toFixed(1))) },
    ...(mode.value === 'day' ? [{ name: '平均耗时', type: 'line' as const, smooth: true, connectNulls: false, yAxisIndex: 2, symbol: 'none', lineStyle: { width: 2, type: 'dashed' as const }, data: props.trend.map((item) => item.averageDuration === null ? null : Number(item.averageDuration.toFixed(1))) }] : []),
  ],
}))

const chartSummary = computed(() => {
  const activePoints = props.trend.filter((item) => item.participants > 0)
  const first = activePoints[0]
  const last = activePoints.at(-1)
  if (!first || !last) return '当前筛选范围暂无趋势数据'
  const successRate = last.successRate === null ? '暂无数据' : `${last.successRate.toFixed(1)}%`
  return `从 ${dateLabel(first.date)} 到 ${dateLabel(last.date)}，末日参与人数为 ${last.participants}，生成成功率为 ${successRate}。`
})
</script>

<template>
  <div class="trend-chart">
    <div class="trend-switch" role="tablist" aria-label="趋势维度">
      <button type="button" :class="{ active: mode === 'day' }" @click="mode = 'day'">日视图</button>
      <button type="button" :class="{ active: mode === 'hour' }" @click="mode = 'hour'">小时视图</button>
    </div>
    <VChart v-if="activeHasData" class="chart" :option="chartOption" autoresize aria-label="活动参与人数、生成成功率和平均生成时长趋势图" />
    <div v-else class="trend-empty">当前筛选范围暂无趋势数据</div>
    <p class="chart-summary">{{ mode === 'day' ? chartSummary : `${dateLabel(hourlyDate)} 10:00-19:00 小时分布，便于查看现场高峰时段。` }}</p>
  </div>
</template>

<style scoped>
.trend-chart { min-width: 0; }
.trend-switch { display: inline-flex; gap: 4px; margin-bottom: 8px; padding: 3px; border: 1px solid var(--line); border-radius: 7px; background: var(--surface-soft); }
.trend-switch button { min-height: 28px; padding: 0 10px; border: 0; border-radius: 5px; color: var(--muted); background: transparent; font-size: 11px; }
.trend-switch button.active { color: var(--blue); background: #fff; box-shadow: var(--shadow-sm); }
.chart { width: 100%; height: 290px; }
.trend-empty { display: grid; place-items: center; height: 290px; color: var(--muted); font-size: 12px; }
.chart-summary { margin: 4px 0 0; color: var(--muted); font-size: 11px; line-height: 1.5; }
@media (max-width: 640px) { .chart, .trend-empty { height: 260px; } }
</style>
