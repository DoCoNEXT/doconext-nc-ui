<template>
  <div ref="root"
       class="dcn-segmented"
       :role="tabs ? 'tablist' : 'group'"
       :aria-label="label">
    <NcButton v-for="(option, index) in options"
              :key="String(option.value)"
              :variant="option.value === modelValue ? 'primary' : 'tertiary'"
              :role="tabs ? 'tab' : undefined"
              :aria-pressed="tabs ? undefined : option.value === modelValue"
              :aria-selected="tabs ? option.value === modelValue : undefined"
              :tabindex="tabs ? (index === focusable ? 0 : -1) : undefined"
              :disabled="option.disabled"
              @click="choose(option)"
              @keydown="onKeydown($event, index)">
      <template v-if="option.icon" #icon>
        <component :is="option.icon as Component" :size="20" />
      </template>
      <slot name="option" :option="option" :selected="option.value === modelValue">
        {{ option.label }}
      </slot>
      <DcnBadge v-if="option.count" class="dcn-segmented__count" :tone="option.countTone ?? 'neutral'">
        {{ option.count }}
      </DcnBadge>
    </NcButton>
  </div>
</template>

<script setup lang="ts" generic="V extends string | number">
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import { NcButton } from '@nextcloud/vue'
import DcnBadge from './DcnBadge.vue'
import { focusableTab, nextTab } from '../tablist'
import type { SegmentedOption } from '../types'

/**
 * A choice of views or filters, one of which is on: the chosen one is a raised
 * chip, not a second call to action. Built from NcButtons, so focus and theme
 * are Nextcloud's.
 *
 * As a filter (the default) the buttons are toggle buttons (`aria-pressed`),
 * each in the Tab order. With `tabs` they are the tabs of a tablist
 * (`aria-selected`), for switching what the page below shows: only the chosen
 * tab is in the Tab order, and the arrow keys, Home and End move between tabs
 * and choose as they go. Give the region the tabs switch `role="tabpanel"` and
 * an `aria-label` naming the chosen tab.
 */
const props = defineProps<{
  modelValue: V
  options: SegmentedOption<V>[]
  /** What is being chosen, for assistive technology ("Status", "Display"). */
  label: string
  tabs?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: V] }>()

const root = ref<HTMLElement | null>(null)

const disabled = computed(() => props.options.map((option) => option.disabled === true))
const focusable = computed(() => focusableTab(
  disabled.value,
  props.options.findIndex((option) => option.value === props.modelValue),
))

function choose(option: SegmentedOption<V>): void {
  if (option.value !== props.modelValue) {
    emit('update:modelValue', option.value)
  }
}

function onKeydown(event: KeyboardEvent, from: number): void {
  if (!props.tabs || !root.value) {
    return
  }
  const rtl = getComputedStyle(root.value).direction === 'rtl'
  const to = nextTab(disabled.value, from, event.key, rtl)
  const option = to === null ? undefined : props.options[to]
  if (to === null || option === undefined) {
    return
  }
  event.preventDefault()
  choose(option)
  root.value.querySelectorAll<HTMLElement>('[role="tab"]')[to]?.focus()
}
</script>
