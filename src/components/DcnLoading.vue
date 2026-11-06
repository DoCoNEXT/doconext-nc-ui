<template>
  <div :class="['dcn-loading', { 'dcn-loading--compact': compact }]" role="status">
    <NcLoadingIcon aria-hidden="true" :size="compact ? 16 : 20" />
    <span>{{ label ?? translate('Loading…') }}</span>
  </div>
</template>

<script setup lang="ts">
import { NcLoadingIcon } from '@nextcloud/vue'
import { translate } from '../config'

/**
 * The one way a page, tab, list, section or dialog says it is still loading:
 * the spinner and a line of text. The text is what a screen reader announces,
 * so there always is one — "Loading…" in the app's language, or what is
 * loading when that says more.
 *
 * Centred when it stands in for a whole page, tab, list or dialog. `compact`
 * under a section heading, between the fields of a form, or in a narrow panel
 * such as the sidebar: there it starts where the text around it starts and
 * matches its size, so the column still reads as one column while it loads.
 *
 * A button that is busy shows a bare NcLoadingIcon in its icon slot instead;
 * this is for the place the content will appear. Both turn in the accent
 * colour inside `.dcn-app` (see the styles).
 *
 * From DoCoNEXT Core's LoadingState, which Time had copied.
 */
withDefaults(defineProps<{
  /** What is loading, when that says more than "Loading…". */
  label?: string
  /** Start-aligned and in the small text of a section, not centred. */
  compact?: boolean
}>(), { label: undefined, compact: false })
</script>

<style scoped>
.dcn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: var(--color-text-maxcontrast);
}

.dcn-loading--compact {
  justify-content: flex-start;
  gap: 6px;
  padding: 8px 0;
  font-size: 13px;
}
</style>
