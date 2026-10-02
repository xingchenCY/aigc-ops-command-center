<script setup lang="ts">
import { Filter, RotateCcw } from '@lucide/vue'
import type { Site } from '@/types/domain'
import { DEMO_END_DATE } from '@/data/mockData'
import { MAX_ANALYSIS_DAYS, shiftDate } from '@/utils/metrics'

defineProps<{
  sites: Site[]
  selectedSiteIds: string[]
  startDate: string
  endDate: string
  onlyAnomalies: boolean
}>()

const emit = defineEmits<{
  'update:selectedSiteIds': [value: string[]]
  'update:onlyAnomalies': [value: boolean]
  dateRangeChange: [value: [string, string]]
  presetChange: [days: number]
  reset: []
}>()

function onDateChange(kind: 'start' | 'end', event: Event, props: { startDate: string; endDate: string }) {
  const value = (event.target as HTMLInputElement).value
  emit('dateRangeChange', kind === 'start' ? [value, props.endDate] : [props.startDate, value])
}

function onSiteToggle(siteId: string, checked: boolean, selectedSiteIds: string[]) {
  const next = checked ? [...selectedSiteIds, siteId] : selectedSiteIds.filter((id) => id !== siteId)
  emit('update:selectedSiteIds', next)
}

function onSiteInput(siteId: string, event: Event, selectedSiteIds: string[]) {
  onSiteToggle(siteId, (event.target as HTMLInputElement).checked, selectedSiteIds)
}

function clearSites() {
  emit('update:selectedSiteIds', [])
}

function onAnomalyToggle(event: Event) {
  emit('update:onlyAnomalies', (event.target as HTMLInputElement).checked)
}

function isPresetActive(startDate: string, endDate: string, preset: number) {
  return endDate === DEMO_END_DATE && startDate === shiftDate(DEMO_END_DATE, -(preset - 1))
}
</script>

<template>
  <section class="filter-bar" aria-label="数据筛选">
    <div class="filter-bar__intro">
      <div class="filter-icon"><Filter :size="17" /></div>
      <div>
        <strong>筛选分析范围</strong>
        <span>所有模块会同步响应当前条件</span>
      </div>
    </div>

    <div class="filter-bar__controls">
      <div class="filter-field">
        <span class="filter-label">活动点位</span>
        <div class="site-checkboxes" aria-label="活动点位多选">
          <button type="button" class="site-chip" :class="{ active: !selectedSiteIds.length }" @click="clearSites">全部</button>
          <label v-for="site in sites" :key="site.id" class="site-chip" :class="{ active: selectedSiteIds.includes(site.id) }">
            <input
              :checked="selectedSiteIds.includes(site.id)"
              type="checkbox"
              @change="onSiteInput(site.id, $event, selectedSiteIds)"
            >
            {{ site.name.replace(' · ', '') }}
          </label>
        </div>
      </div>
      <div class="filter-field filter-field--date">
        <label for="start-date">日期范围</label>
        <div class="date-range">
          <input id="start-date" :value="startDate" type="date" :min="shiftDate(endDate, -(MAX_ANALYSIS_DAYS - 1))" :max="endDate" @change="onDateChange('start', $event, { startDate, endDate })">
          <span>至</span>
          <input id="end-date" aria-label="结束日期" :value="endDate" type="date" :min="startDate" :max="shiftDate(startDate, MAX_ANALYSIS_DAYS - 1)" @change="onDateChange('end', $event, { startDate, endDate })">
        </div>
      </div>
      <div class="preset-group" aria-label="快捷日期">
        <button v-for="preset in [7, 14, 30]" :key="preset" class="preset-button" type="button" :class="{ active: isPresetActive(startDate, endDate, preset) }" @click="emit('presetChange', preset)">
          近 {{ preset }} 天
        </button>
      </div>
      <label class="anomaly-toggle">
        <input :checked="onlyAnomalies" type="checkbox" @change="onAnomalyToggle">
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
        <span>仅看异常点位</span>
      </label>
      <button class="reset-button" type="button" @click="emit('reset')"><RotateCcw :size="14" />重置</button>
    </div>
  </section>
</template>

<style scoped>
.filter-bar { display: flex; align-items: center; justify-content: space-between; gap: 22px; padding: 15px 18px; border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow-sm); }
.filter-bar__intro { display: flex; align-items: center; flex: 0 0 auto; gap: 10px; }
.filter-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; color: var(--blue); background: var(--blue-soft); }
.filter-bar__intro strong, .filter-bar__intro span { display: block; }
.filter-bar__intro strong { color: var(--ink); font-size: 13px; }
.filter-bar__intro span { margin-top: 3px; color: var(--muted); font-size: 11px; }
.filter-bar__controls { display: flex; align-items: flex-end; justify-content: flex-end; flex-wrap: wrap; gap: 10px; }
.filter-field label, .filter-label { display: block; margin-bottom: 5px; color: var(--muted); font-size: 11px; }
.filter-field select, .filter-field input { height: 44px; border: 1px solid var(--line); border-radius: 7px; color: var(--ink); background: #fff; font-size: 12px; }
.filter-field select { min-width: 148px; padding: 0 10px; }
.filter-field input { width: 132px; padding: 0 9px; }
.site-checkboxes { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; max-width: 430px; }
.site-chip { display: inline-flex; align-items: center; min-height: 30px; padding: 0 8px; border: 1px solid var(--line); border-radius: 7px; color: var(--ink-soft); background: #fff; font-size: 11px; cursor: pointer; }
.site-chip input { width: 12px; height: 12px; margin: 0 4px 0 0; accent-color: var(--blue); }
.site-chip.active { border-color: rgba(45, 98, 206, .42); color: var(--blue); background: var(--blue-soft); }
.date-range { display: flex; align-items: center; gap: 6px; }
.date-range span { color: var(--muted); font-size: 12px; }
.preset-group { display: flex; gap: 4px; padding-bottom: 0; }
.preset-button { min-height: 44px; padding: 0 10px; border: 1px solid var(--line); border-radius: 7px; color: var(--ink-soft); background: var(--surface-soft); font-size: 12px; transition: all .2s ease; }
.preset-button:hover, .preset-button.active { border-color: rgba(45, 98, 206, .42); color: var(--blue); background: var(--blue-soft); }
.anomaly-toggle { display: inline-flex; align-items: center; gap: 7px; min-height: 44px; color: var(--ink-soft); font-size: 12px; cursor: pointer; }
.anomaly-toggle input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.anomaly-toggle input:focus-visible + .toggle-track { outline: 3px solid rgba(45, 98, 206, 0.32); outline-offset: 2px; }
.toggle-track { display: inline-flex; align-items: center; width: 32px; height: 18px; padding: 2px; border-radius: 999px; background: #cbd4de; transition: background .2s ease; }
.toggle-thumb { width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.18); transition: transform .2s ease; }
.anomaly-toggle input:checked + .toggle-track { background: var(--blue); }
.anomaly-toggle input:checked + .toggle-track .toggle-thumb { transform: translateX(14px); }
.reset-button { display: inline-flex; align-items: center; gap: 5px; min-height: 44px; padding: 0 8px; border: 0; color: var(--muted); background: transparent; font-size: 12px; }
.reset-button:hover { color: var(--blue); }
@media (max-width: 1080px) { .filter-bar { align-items: flex-start; flex-direction: column; } .filter-bar__controls { width: 100%; justify-content: flex-start; } }
@media (max-width: 640px) { .filter-bar__controls { display: grid; grid-template-columns: 1fr 1fr; align-items: end; } .filter-field, .filter-field--date, .preset-group { grid-column: 1 / -1; } .filter-field select, .filter-field input { width: 100%; min-width: 0; font-size: 16px; } .site-checkboxes { max-width: none; } .site-chip { min-height: 34px; } .preset-group { justify-content: space-between; } .preset-button { flex: 1; } .anomaly-toggle, .reset-button { margin-top: 3px; } }
</style>
