<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/dashboard/AppHeader.vue'
import FilterBar from '@/components/dashboard/FilterBar.vue'
import KpiGrid from '@/components/dashboard/KpiGrid.vue'
import TrendChart from '@/components/charts/TrendChart.vue'
import FunnelChart from '@/components/charts/FunnelChart.vue'
import ModerationDonutChart from '@/components/charts/ModerationDonutChart.vue'
import SitePerformance from '@/components/dashboard/SitePerformance.vue'
import AnomalyBanner from '@/components/dashboard/AnomalyBanner.vue'
import AnomalyCenter from '@/components/anomalies/AnomalyCenter.vue'
import DeviceHealth from '@/components/devices/DeviceHealth.vue'
import SiteDetailDrawer from '@/components/dashboard/SiteDetailDrawer.vue'
import ExecutiveSummary from '@/components/dashboard/ExecutiveSummary.vue'
import MetricsDrawer from '@/components/dashboard/MetricsDrawer.vue'
import AnomalyDrawer from '@/components/anomalies/AnomalyDrawer.vue'
import PanelShell from '@/components/common/PanelShell.vue'
import { useDashboardStore } from '@/stores/dashboard'
import type { Anomaly } from '@/types/domain'

const store = useDashboardStore()
const {
  sites,
  selectedSiteIds,
  startDate,
  endDate,
  onlyAnomalies,
  lastUpdated,
  refreshing,
  dashboardMetrics,
  trend,
  hourlyTrend,
  funnel,
  sitePerformance,
  anomalies,
  displayedDevices,
  selectedAnomaly,
  anomalyDrawerOpen,
} = storeToRefs(store)

const metricsHelpOpen = ref(false)
const siteDrawerOpen = ref(false)
const siteDrawerSiteId = ref<string | null>(null)

const selectedSiteLabel = computed(() => {
  if (!selectedSiteIds.value.length) return '全部点位'
  if (selectedSiteIds.value.length === 1) return sites.value.find((site) => site.id === selectedSiteIds.value[0])?.name ?? '指定点位'
  return `${selectedSiteIds.value.length} 个点位`
})

const pageSubtitle = computed(() => {
  const anomalyScope = onlyAnomalies.value ? ' · 异常点位视图' : ''
  return `${selectedSiteLabel.value}${anomalyScope} · ${startDate.value} 至 ${endDate.value}`
})

const siteDrawerRow = computed(() => sitePerformance.value.find((row) => row.site.id === siteDrawerSiteId.value) ?? null)
const siteDrawerDevices = computed(() => displayedDevices.value.filter((item) => item.device.siteId === siteDrawerSiteId.value))
const siteDrawerAnomalies = computed(() => anomalies.value.filter((anomaly) => anomaly.siteId === siteDrawerSiteId.value))

function handleDateRangeChange(range: [string, string]) {
  store.setDateRange(range)
}

function openMetrics() {
  metricsHelpOpen.value = true
}

function selectAnomaly(anomaly: Anomaly) {
  store.selectAnomaly(anomaly)
}

function selectSite(siteId: string) {
  siteDrawerSiteId.value = siteId
  siteDrawerOpen.value = true
}

function closeSiteDrawer() {
  siteDrawerOpen.value = false
}

function selectSiteAnomaly(anomaly: Anomaly) {
  closeSiteDrawer()
  store.selectAnomaly(anomaly)
}

function focusAnomalyCenter() {
  document.getElementById('anomaly-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="app-shell">
    <AppHeader
      :last-updated="lastUpdated"
      :refreshing="refreshing"
      @open-metrics="openMetrics"
      @refresh="store.refreshData"
    />

    <main class="workspace">
      <section class="page-intro" aria-labelledby="page-title">
        <div>
          <p class="eyebrow">AIGC INTERACTIVE OPERATIONS</p>
          <h1 id="page-title">互动运营中枢</h1>
          <p class="page-subtitle">把活动效果、AI 稳定性与设备健康状态，收敛成一套可行动的运营视图。</p>
        </div>
        <div class="snapshot-summary">
          <span class="snapshot-dot" aria-hidden="true"></span>
          <div>
            <span class="snapshot-label">当前分析范围</span>
            <strong>{{ pageSubtitle }}</strong>
          </div>
        </div>
      </section>

      <FilterBar
        :sites="sites"
        :selected-site-ids="selectedSiteIds"
        :start-date="startDate"
        :end-date="endDate"
        :only-anomalies="onlyAnomalies"
        @update:selected-site-ids="store.setSites"
        @date-range-change="handleDateRangeChange"
        @preset-change="store.setPreset"
        @reset="store.resetFilters"
        @update:only-anomalies="store.setOnlyAnomalies"
      />

      <AnomalyBanner :anomalies="anomalies" @focus-anomalies="focusAnomalyCenter" />

      <div v-if="dashboardMetrics.attempts === 0" class="empty-data-banner" role="status">
        <span class="empty-data-banner__dot" aria-hidden="true"></span>
        <div><strong>当前范围暂无互动数据</strong><span>请扩大日期范围或恢复默认近 7 天；设备健康仍按当前快照展示。</span></div>
        <button type="button" @click="store.resetFilters">恢复近 7 天</button>
      </div>

      <KpiGrid :metrics="dashboardMetrics" />

      <section class="content-grid content-grid--primary" aria-label="趋势与运营摘要">
        <PanelShell
          class="panel--trend"
          title="活动与生成趋势"
          subtitle="参与规模、生成成功率与平均耗时的同周期变化"
        >
          <TrendChart :trend="trend" :hourly-trend="hourlyTrend" :hourly-date="endDate" />
        </PanelShell>
        <ExecutiveSummary :metrics="dashboardMetrics" :anomalies="anomalies" />
      </section>

      <section class="content-grid content-grid--secondary" aria-label="转化与点位表现">
        <PanelShell
          class="panel--funnel"
          title="互动转化漏斗"
          subtitle="从参与到分享，每一步都对应一个运营动作"
        >
          <FunnelChart :funnel="funnel" />
          <ModerationDonutChart :metrics="dashboardMetrics" />
        </PanelShell>
        <SitePerformance :rows="sitePerformance" @select-site="selectSite" />
      </section>

      <section class="content-grid content-grid--operations" aria-label="异常与设备状态">
        <AnomalyCenter :anomalies="anomalies" @select="selectAnomaly" />
        <DeviceHealth :devices="displayedDevices" :snapshot-time="lastUpdated" />
      </section>
    </main>

    <MetricsDrawer :open="metricsHelpOpen" @close="metricsHelpOpen = false" />
    <AnomalyDrawer
      :open="anomalyDrawerOpen"
      :anomaly="selectedAnomaly"
      @close="store.closeAnomaly"
    />
    <SiteDetailDrawer
      :open="siteDrawerOpen"
      :row="siteDrawerRow"
      :devices="siteDrawerDevices"
      :anomalies="siteDrawerAnomalies"
      @close="closeSiteDrawer"
      @select-anomaly="selectSiteAnomaly"
      @analyze-site="store.setSite"
    />
  </div>
</template>
