<template>
  <div class="dcn-segmented"
       :role="tabs ? 'tablist' : 'group'"
       :aria-label="label">
    <NcButton v-for="option in options"
              :key="String(option.value)"
              :variant="option.value === modelValue ? 'primary' : 'tertiary'"
              :role="tabs ? 'tab' : undefined"
              :aria-pressed="tabs ? undefined : option.value === modelValue"
              :aria-selected="tabs ? option.value === modelValue : undefined"
              :disabled="option.disabled"
              @click="choose(option)">
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
import { NcButton } from '@nextcloud/vue'
import DcnBadge from './DcnBadge.vue'
import type { SegmentedOption } from '../types'

/**
 * A choice of views or filters, one of which is on: the chosen one is a raised
 * chip, not a second call to action. Built from NcButtons, so focus, keyboard
 * and theme are Nextcloud's.
 *
 * As a filter (the default) the buttons are toggle buttons (`aria-pressed`);
 * with `tabs` they are the tabs of a tablist (`aria-selected`), for switching
 * what the page below shows.
 */
const props = defineProps<{
  modelValue: V
  options: SegmentedOption<V>[]
  /** What is being chosen, for assistive technology ("Status", "Display"). */
  label: string
  tabs?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: V] }>()

function choose(option: SegmentedOption<V>): void {
  if (option.value !== props.modelValue) {
    emit('update:modelValue', option.value)
  }
}
</script>
