<template>
  <span class="dcn-badge"
        :class="[color ? 'dcn-badge--color' : `dcn-badge--${tone}`, dot !== 'none' && `dcn-badge--dot-${dot}`]"
        :style="color ? { '--dcn-badge-color': color } : undefined">
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
 *
 * `color` is for the categories Nextcloud has no pair for — a pipeline stage,
 * a priority, a record type: the text in that colour on a 13% tint of it, and
 * it replaces `tone`. The contrast is then the app's to keep, so pass a
 * variable the app defines for a light and a dark theme (`var(--crm-blue)`),
 * not a fixed hex that only holds in one of them.
 */
withDefaults(defineProps<{
  tone?: BadgeTone
  dot?: BadgeDot
  /** Any CSS colour, ideally a themed variable; replaces `tone`. */
  color?: string
}>(), { tone: 'neutral', dot: 'none', color: undefined })
</script>
