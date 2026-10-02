<script setup lang="ts">
import { ArrowUpRight, MapPin } from '@lucide/vue'
import type { SitePerformanceRow } from '@/types/domain'
import { formatNumber, formatPercent } from '@/utils/formatters'
import { THRESHOLDS } from '@/utils/metrics'

defineProps<{ rows: SitePerformanceRow[] }>()
const emit = defineEmits<{ selectSite: [siteId: string] }>()
</script>

<template>
  <section class="site-panel" aria-labelledby="site-title">
    <header class="site-panel__header">
      <div>
        <h2 id="site-title" class="site-panel__title">点位表现</h2>
        <p class="site-panel__subtitle">按参与规模排序，点击点位查看详情</p>
      </div>
      <span class="panel-count">{{ rows.length }} 个点位</span>
    </header>
    <div class="site-table" aria-label="点位表现排行">
      <div class="site-table__head" aria-hidden="true">
        <span>点位</span><span>参与人数</span><span>成功率</span><span>扫码 / 分享</span><span>设备</span><span>状态</span>
      </div>
      <ul v-if="rows.length" class="site-list">
        <li v-for="row in rows" :key="row.site.id">
          <button
            class="site-row"
            type="button"
            :aria-label="`查看${row.site.name}详情：参与人数 ${row.participants}，生成成功率 ${formatPercent(row.successRate)}，设备在线率 ${formatPercent(row.onlineRate)}`"
            @click="emit('selectSite', row.site.id)"
          >
            <span class="site-name"><i :style="{ backgroundColor: row.site.accent }"></i><span><strong>{{ row.site.name }}</strong><small>{{ row.site.type }} · {{ row.site.status === 'paused' ? '暂停活动' : '进行中' }}</small></span></span>
            <span class="site-value">{{ formatNumber(row.participants) }}</span>
            <span class="site-value" :class="{ 'value-alert': row.successRate < THRESHOLDS.successRate }">{{ formatPercent(row.successRate) }}</span>
            <span class="site-value site-conversion"><span>{{ formatPercent(row.scanRate, 0) }}</span><b>/</b><span :class="{ 'value-alert': row.shareRate < THRESHOLDS.shareRate }">{{ formatPercent(row.shareRate, 0) }}</span></span>
            <span class="site-value" :class="{ 'value-alert': row.onlineRate < THRESHOLDS.onlineRate }">{{ formatPercent(row.onlineRate, 0) }}</span>
            <span class="site-status" :class="`site-status--${row.status}`"><span class="status-marker"></span>{{ row.status === 'healthy' ? '健康' : row.status === 'critical' ? '需处理' : row.status === 'no-data' ? '暂无数据' : '需关注' }}<ArrowUpRight v-if="row.status !== 'no-data'" :size="14" /></span>
          </button>
        </li>
      </ul>
      <div v-if="!rows.length" class="empty-state"><MapPin :size="18" />当前筛选下暂无异常点位</div>
    </div>
  </section>
</template>

<style scoped>
.site-panel { overflow: hidden; }
.panel-count { padding-top: 2px; color: var(--muted); font-family: var(--mono); font-size: 10px; }
.site-table { margin-top: 18px; }
.site-list { margin: 0; padding: 0; list-style: none; }
.site-table__head, .site-row { display: grid; grid-template-columns: minmax(165px, 1.5fr) .8fr .8fr 1fr .7fr 1fr; align-items: center; gap: 10px; padding: 11px 22px; }
.site-table__head { border-top: 1px solid var(--line-soft); border-bottom: 1px solid var(--line-soft); color: var(--muted); font-size: 10px; }
.site-row { width: 100%; border: 0; border-bottom: 1px solid var(--line-soft); color: var(--ink-soft); background: transparent; text-align: left; transition: background .2s ease; }
.site-row:hover { background: var(--surface-soft); }
.site-name { display: flex; align-items: center; min-width: 0; gap: 9px; }
.site-name i { flex: 0 0 auto; width: 7px; height: 28px; border-radius: 4px; }
.site-name span { min-width: 0; }
.site-name strong, .site-name small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.site-name strong { color: var(--ink); font-size: 12px; font-weight: 650; }
.site-name small { margin-top: 3px; color: var(--muted); font-size: 10px; }
.site-value { color: var(--ink); font-family: var(--mono); font-size: 11px; }
.site-conversion { display: flex; gap: 4px; }
.site-conversion b { color: var(--muted); font-family: inherit; font-weight: 400; }
.value-alert { color: var(--red); }
.site-status { display: inline-flex; align-items: center; gap: 5px; color: var(--teal); font-size: 11px; }
.site-status--attention { color: var(--amber); }
.site-status--critical { color: var(--red); }
.site-status--no-data { color: var(--muted); }
.status-marker { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.site-status svg { margin-left: auto; opacity: .65; }
.empty-state { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 150px; color: var(--muted); font-size: 12px; }
@media (max-width: 720px) { .site-table__head { display: none; } .site-row { grid-template-columns: minmax(0, 1fr) auto; gap: 10px; padding: 14px 16px; } .site-row > :nth-child(3), .site-row > :nth-child(4), .site-row > :nth-child(5) { display: none; } .site-value { text-align: right; } .site-status { grid-column: 1 / -1; justify-content: flex-end; font-size: 10px; } }
</style>
