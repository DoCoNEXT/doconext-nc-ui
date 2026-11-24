<template>
  <div v-if="help" class="dcn-page-title-row">
    <component :is="tag" class="dcn-page-title">
      <slot />
    </component>
    <DcnHelpButton :topic="help" :label="helpLabel" />
  </div>
  <component :is="tag" v-else class="dcn-page-title">
    <slot />
  </component>
</template>

<script setup lang="ts">
import DcnHelpButton from './DcnHelpButton.vue'

/**
 * A page's own title, at the top of the content: 24/32 semibold.
 *
 * With `help`, the screen's question mark sits beside it: this is where a
 * screen's help goes, one per screen. See the README's "Help".
 */
withDefaults(defineProps<{
  /** The heading level; a page's title is its h2 (Nextcloud's header holds the h1). */
  tag?: 'h1' | 'h2' | 'h3'
  /** The help topic for this screen, `Manual/Page#section`, written out. */
  help?: string
  /** The help button's accessible name; "Help". */
  helpLabel?: string
}>(), { tag: 'h2', help: undefined, helpLabel: undefined })
</script>
