<template>
  <component :is="tag" class="dcn-card" :class="{ 'dcn-card--padded': padded }">
    <slot />
  </component>
</template>

<script setup lang="ts">
/**
 * A raised surface on the page's canvas. Fields inside paint their floating
 * label with the card's colour, so they sit on it cleanly. A table that stands
 * on its own is its own card (`class="dcn-table"`); inside a card it drops its
 * border and shadow.
 */
withDefaults(defineProps<{
  /** 16px around the content; leave it off for a card that holds a table or a list edge to edge. */
  padded?: boolean
  tag?: string
}>(), { padded: false, tag: 'div' })
</script>
