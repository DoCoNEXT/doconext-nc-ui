<template>
  <NcDialog
    v-bind="$attrs"
    :name="name"
    :dialog-classes="dialogClasses === undefined ? 'dcn-dialog' : ['dcn-dialog', dialogClasses]"
    :content-classes="contentScrolls ? contentClasses : ['dcn-dialog__content--own-scroll', contentClasses ?? '']">
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
withDefaults(defineProps<{
  /** The dialog's title. */
  name: string
  /** Extra classes for the dialog, beside `dcn-dialog`. */
  dialogClasses?: string | string[] | Record<string, boolean>
  /** Extra classes for the content, as NcDialog takes them. */
  contentClasses?: string | string[] | Record<string, boolean>
  /**
   * Whether the dialog's content scrolls as a whole, as NcDialog's does.
   * False for content that scrolls a part of itself — the open tab of a
   * dialog with tabs — so the tabs stay in view: the content then only lays
   * out, and its root fills the room the modal leaves. Its own scrolling part
   * keeps `overflow-y: auto` and needs no height of its own; one beside the
   * modal's cap puts a second scrollbar around the first whenever the two
   * disagree.
   */
  contentScrolls?: boolean
}>(), {
  dialogClasses: undefined,
  contentClasses: undefined,
  contentScrolls: true,
})
</script>
