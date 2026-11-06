<template>
  <span class="dcn-badge" :class="[`dcn-badge--${tone}`, dot !== 'none' && `dcn-badge--dot-${dot}`]">
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { BadgeDot, BadgeTone } from '../types'

/**
 * A short label beside a value: a status, a type, a count. The tones come from
 * Nextcloud's own background + text pairs, which hold their contrast in every
 * theme. Give a status a dot, so it reads without colour being the only
 * difference between neighbours; a hollow dot says "not yet".
 */
withDefaults(defineProps<{
  tone?: BadgeTone
  dot?: BadgeDot
}>(), { tone: 'neutral', dot: 'none' })
</script>
