<template>
  <component :is="element" class="dcn-card" :class="{ 'dcn-card--padded': padded }">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CARD_TAGS } from '../types'
import type { CardTag } from '../types'

/**
 * A raised surface on the page's canvas. Fields inside paint their floating
 * label with the card's colour, so they sit on it cleanly. A table that stands
 * on its own is its own card (`class="dcn-table"`); inside a card it drops its
 * border and shadow.
 */
const props = withDefaults(defineProps<{
  /** 16px around the content; leave it off for a card that holds a table or a list edge to edge. */
  padded?: boolean
  /** The element the card is: a `section` or an `article` where the card is one, an `li` in a list of cards. */
  tag?: CardTag
}>(), { padded: false, tag: 'div' })

/**
 * The element to render, checked again at run time: `<component :is>` makes
 * any element it is given, a `<script>` with the slot as its code included,
 * and a value that comes from data never passed the type check.
 */
const element = computed(() => (CARD_TAGS.includes(props.tag) ? props.tag : 'div'))
</script>
