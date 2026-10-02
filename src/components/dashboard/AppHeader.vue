<script setup lang="ts">
import { Activity, BookOpen, Database, RefreshCw } from '@lucide/vue'

defineProps<{
  lastUpdated: string
  refreshing: boolean
}>()

const emit = defineEmits<{
  openMetrics: []
  refresh: []
}>()
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="brand-lockup">
        <div class="brand-mark" aria-hidden="true"><Activity :size="20" :stroke-width="2.2" /></div>
        <div>
          <p class="brand-name">AIGC 互动运营中枢</p>
          <p class="brand-caption">INTERACTIVE OPERATIONS CENTER</p>
        </div>
      </div>

      <div class="header-status">
        <span class="status-pill"><Database :size="14" />演示数据</span>
        <span class="status-meta">最后更新 {{ lastUpdated }}</span>
        <button class="header-button" type="button" @click="emit('openMetrics')">
          <BookOpen :size="16" />
          <span>指标口径</span>
        </button>
        <button class="header-button header-button--quiet" type="button" :disabled="refreshing" @click="emit('refresh')">
          <RefreshCw :class="{ 'is-spinning': refreshing }" :size="16" />
          <span>{{ refreshing ? '刷新中' : '刷新快照' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header { color: #fff; background: var(--navy); }
.app-header__inner { width: min(1500px, calc(100% - 48px)); min-height: 72px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.brand-lockup { display: flex; align-items: center; gap: 12px; }
.brand-mark { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid rgba(255,255,255,.2); border-radius: 10px; color: #8ec6ff; background: #1a2b43; }
.brand-name { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: 0; }
.brand-caption { margin: 4px 0 0; color: rgba(255,255,255,.58); font-size: 10px; letter-spacing: 0; }
.header-status { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 12px; }
.status-pill { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 1px solid rgba(122, 217, 188, .24); border-radius: 999px; color: #a4ebd2; background: rgba(21, 155, 121, .15); font-size: 12px; font-weight: 600; }
.status-meta { color: rgba(255,255,255,.55); font-family: var(--mono); font-size: 11px; }
.header-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 44px; padding: 0 12px; border: 1px solid rgba(255,255,255,.17); border-radius: 7px; color: #fff; background: rgba(255,255,255,.08); font-size: 12px; font-weight: 600; transition: background .2s ease, border-color .2s ease; }
.header-button:hover { border-color: rgba(255,255,255,.34); background: rgba(255,255,255,.14); }
.header-button:disabled { cursor: wait; opacity: .65; }
.header-button--quiet { color: rgba(255,255,255,.72); background: transparent; }
.is-spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 720px) {
  .app-header__inner { width: min(100% - 24px, 580px); min-height: 66px; align-items: flex-start; flex-direction: column; padding: 14px 0; }
  .header-status { width: 100%; justify-content: flex-start; gap: 8px; }
  .status-meta { order: 3; width: 100%; }
  .header-button { min-height: 44px; }
}
</style>
