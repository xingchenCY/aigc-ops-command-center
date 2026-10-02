import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { DEMO_END_DATE, conversionEvents, devices, generationEvents, moderationEvents, sites } from '@/data/mockData'
import type { Anomaly, DateRange } from '@/types/domain'
import { DEMO_SNAPSHOT_TIME, attachDeviceMetrics, getAnomalies, getDashboardMetrics, getFunnel, getHourlyTrend, getSitePerformance, getTrend, normalizeDateRange, shiftDate } from '@/utils/metrics'

const DEMO_START_DATE = shiftDate(DEMO_END_DATE, -6)

export const useDashboardStore = defineStore('dashboard', () => {
  const selectedSiteIds = ref<string[]>([])
  const startDate = ref(DEMO_START_DATE)
  const endDate = ref(DEMO_END_DATE)
  const onlyAnomalies = ref(false)
  const lastUpdated = ref(DEMO_SNAPSHOT_TIME)
  const refreshing = ref(false)
  const selectedAnomaly = ref<Anomaly | null>(null)
  const anomalyDrawerOpen = ref(false)

  const range = computed<DateRange>(() => ({ start: startDate.value, end: endDate.value }))
  const siteFilter = computed(() => selectedSiteIds.value.length ? selectedSiteIds.value : 'all')
  const siteOptions = computed(() => sites)
  const data = { generations: generationEvents, conversions: conversionEvents, moderation: moderationEvents, devices }
  const anomalies = computed(() => getAnomalies(data, range.value, siteFilter.value, sites))
  const anomalySiteIds = computed(() => new Set(anomalies.value.map((item) => item.siteId)))
  const scopedData = computed(() => {
    if (!onlyAnomalies.value) return data
    const includeSite = (siteId: string) => anomalySiteIds.value.has(siteId)
    return {
      generations: data.generations.filter((item) => includeSite(item.siteId)),
      conversions: data.conversions.filter((item) => includeSite(item.siteId)),
      moderation: data.moderation.filter((item) => includeSite(item.siteId)),
      devices: data.devices.filter((item) => includeSite(item.siteId)),
    }
  })
  const dashboardMetrics = computed(() => getDashboardMetrics(scopedData.value, range.value, siteFilter.value))
  const trend = computed(() => getTrend(scopedData.value, range.value, siteFilter.value))
  const hourlyTrend = computed(() => getHourlyTrend(scopedData.value, range.value, siteFilter.value))
  const funnel = computed(() => getFunnel(dashboardMetrics.value))
  const scopedSites = computed(() => selectedSiteIds.value.length ? sites.filter((site) => selectedSiteIds.value.includes(site.id)) : sites)
  const sitePerformance = computed(() => {
    const rows = getSitePerformance(scopedData.value, range.value, scopedSites.value, anomalies.value)
    return onlyAnomalies.value ? rows.filter((row) => anomalySiteIds.value.has(row.site.id)) : rows
  })
  const displayedDevices = computed(() => {
    const selected = selectedSiteIds.value.length ? scopedData.value.devices.filter((device) => selectedSiteIds.value.includes(device.siteId)) : scopedData.value.devices
    const filtered = onlyAnomalies.value ? selected.filter((device) => anomalySiteIds.value.has(device.siteId)) : selected
    return attachDeviceMetrics(scopedData.value, range.value, filtered)
  })

  function setSites(siteIds: string[]) {
    selectedSiteIds.value = Array.from(new Set(siteIds.filter(Boolean)))
  }

  function setSite(siteId: string) {
    selectedSiteIds.value = siteId === 'all' ? [] : [siteId]
  }

  function setDateRange(next: [string, string]) {
    if (!next[0] || !next[1]) return
    const normalized = normalizeDateRange({ start: next[0], end: next[1] })
    startDate.value = normalized.start
    endDate.value = normalized.end
  }

  function setPreset(days: number) {
    startDate.value = shiftDate(DEMO_END_DATE, -(days - 1))
    endDate.value = DEMO_END_DATE
  }

  function resetFilters() {
    selectedSiteIds.value = []
    onlyAnomalies.value = false
    setPreset(7)
  }

  function setOnlyAnomalies(value: boolean) {
    onlyAnomalies.value = value
  }

  async function refreshData() {
    if (refreshing.value) return
    refreshing.value = true
    await new Promise((resolve) => window.setTimeout(resolve, 420))
    lastUpdated.value = `${DEMO_SNAPSHOT_TIME.slice(0, 14)}31:00`
    refreshing.value = false
  }

  function selectAnomaly(anomaly: Anomaly) {
    selectedAnomaly.value = anomaly
    anomalyDrawerOpen.value = true
  }

  function closeAnomaly() {
    anomalyDrawerOpen.value = false
  }

  return {
    sites: siteOptions,
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
    setSite,
    setSites,
    setDateRange,
    setPreset,
    resetFilters,
    setOnlyAnomalies,
    refreshData,
    selectAnomaly,
    closeAnomaly,
  }
})
