<template>
  <NcDialog v-bind="$attrs" :name="name" :dialog-classes="dialogClasses === undefined ? 'dcn-dialog' : ['dcn-dialog', dialogClasses]">
    <template v-for="(_, slotName) in $slots" #[slotName]="scope">
      <slot :name="slotName" v-bind="scope ?? {}" />
    </template>
  </NcDialog>
</template>

<script setup lang="ts">
import { NcDialog } from '@nextcloud/vue'

/**
 * NcDialog in the layered arrangement: the title at the start, the content
 * with room around it, the actions in a footer of their own. Takes every prop,
 * event and slot of NcDialog. A dialog teleports to <body>, out of the app's
 * tree, so the look keys off the `dcn-dialog` class this adds; a dialog another
 * app opens on the same page keeps its own look.
 */
defineOptions({ inheritAttrs: false })
defineProps<{
  /** The dialog's title. */
  name: string
  /** Extra classes for the dialog, beside `dcn-dialog`. */
  dialogClasses?: string | string[] | Record<string, boolean>
}>()
</script>
