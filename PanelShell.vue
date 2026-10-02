<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
}>()
</script>

<template>
  <section class="panel-shell">
    <header class="panel-shell__header">
      <div>
        <h2 class="panel-shell__title">{{ title }}</h2>
        <p class="panel-shell__subtitle">{{ subtitle }}</p>
      </div>
      <slot name="header-action" />
    </header>
    <div class="panel-shell__body">
      <slot />
    </div>
  </section>
</template>
