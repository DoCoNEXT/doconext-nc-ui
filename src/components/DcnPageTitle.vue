<template>
  <component :is="tag" class="dcn-page-title">
    <slot />
  </component>
</template>

<script setup lang="ts">
/** A page's own title, at the top of the content: 24/32 semibold. */
withDefaults(defineProps<{
  /** The heading level; a page's title is its h2 (Nextcloud's header holds the h1). */
  tag?: 'h1' | 'h2' | 'h3'
}>(), { tag: 'h2' })
</script>
