<template>
  <!-- With a panel on the page the button opens it; without one (the Files
       sidebar, a settings page) it is a link to the help page, in a new tab. -->
  <NcButton v-if="shown && hasPanelHost"
            class="dcn-help-button"
            variant="tertiary"
            :aria-label="name"
            :title="name"
            :aria-expanded="isOpen ? 'true' : 'false'"
            @click="toggle">
    <template #icon>
      <CircleQuestionMark :size="size" />
    </template>
  </NcButton>
  <NcButton v-else-if="shown && url"
            class="dcn-help-button"
            variant="tertiary"
            :aria-label="name"
            :title="name"
            :href="url"
            target="_blank">
    <template #icon>
      <CircleQuestionMark :size="size" />
    </template>
  </NcButton>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NcButton } from '@nextcloud/vue'
import { CircleQuestionMark } from '@lucide/vue'
import { translate } from '../config'
import { hasPanelHost, helpUrl, useHelp } from '../help/state'

/**
 * The question mark that opens the help on one topic.
 *
 * Normally it is not placed by hand: `<DcnPageTitle help="…">` puts it beside
 * a screen's title. A lone one is for a screen without a title of its own, and
 * `checkHelpTopics` asks the app to list each with its reason; see the
 * README's "Help". It draws nothing when the reader is not shown the manual it
 * points into.
 */
const props = withDefaults(defineProps<{
  /** `Manual/Page#section`; written out, so the app's check can find it. */
  topic: string
  /** Its accessible name; "Help". */
  label?: string
  /** The icon's size, to match the buttons beside it. */
  size?: number
}>(), { label: undefined, size: 20 })

const help = useHelp()
const name = computed(() => props.label ?? translate('Help'))
const shown = computed(() => help.available(props.topic))
const isOpen = computed(() => help.topic.value === props.topic)
const url = computed(() => helpUrl(props.topic))

function toggle() {
  if (isOpen.value) help.close()
  else help.open(props.topic)
}
</script>
