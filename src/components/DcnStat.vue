<template>
  <div class="dcn-stat">
    <span class="dcn-stat__label">{{ label }}</span>
    <span class="dcn-stat__value">
      <slot>{{ value }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
/** A figure a page is about, its caption above it. Digits are tabular, so a row of them lines up. */
defineProps<{
  label: string
  /** The figure, already formatted; or put it in the default slot. */
  value?: string
}>()
</script>
