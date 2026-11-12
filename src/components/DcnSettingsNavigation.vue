<template>
  <!--
    The navigation an app shows instead of its own while its functional
    settings are open: one item per settings page, and a way back. The shell
    component (the one that renders NcContent) chooses between the two, so the
    rail, imported in its scoped block, styles this one too.
  -->
  <NcAppNavigation :aria-label="label ?? translate('Settings')">
    <!-- The header row, as in the app's own navigation: what the app keeps up
         there (a workspace switcher, say), then the rail toggle. -->
    <template #search>
      <slot name="header" />
      <DcnNavigationRailToggle :expand-label="expandLabel ?? translate('Expand menu')"
                               :collapse-label="collapseLabel ?? translate('Collapse menu')" />
    </template>

    <template #list>
      <NcAppNavigationItem v-for="tab in tabs"
                           :key="tab.id"
                           :name="tab.label"
                           :active="tab.id === active"
                           :to="tab.to"
                           @click="tab.to === undefined && emit('select', tab.id)">
        <template #icon>
          <component :is="tab.icon" :size="20" />
        </template>
      </NcAppNavigationItem>
    </template>

    <!-- The footer slot sits outside NcAppNavigationList, so it brings its own
         list element for the item's <li>. The padding is not decoration:
         flush against the navigation's bottom edge, which its container clips,
         a focused item loses the bottom of its outline. -->
    <template #footer>
      <ul class="dcn-settings-navigation__footer">
        <NcAppNavigationItem :name="backLabel ?? translate('Leave settings')"
                             :to="backTo"
                             @click="backTo === undefined && emit('back')">
          <template #icon>
            <ArrowLeft :size="20" />
          </template>
        </NcAppNavigationItem>
      </ul>
    </template>
  </NcAppNavigation>
</template>

<script setup lang="ts">
import { NcAppNavigation, NcAppNavigationItem } from '@nextcloud/vue'
import { ArrowLeft } from '@lucide/vue'
import { translate } from '../config'
import type { SettingsTab } from '../types'
import DcnNavigationRailToggle from './DcnNavigationRailToggle.vue'

/**
 * An app's functional settings as a place of their own: the app navigation
 * gives way to a list of settings pages, with "Leave settings" at the bottom,
 * as in DoCoNEXT Core, where this comes from.
 *
 * With a router, each tab and the way back carry a `to`; without one (an app
 * that switches views itself), leave `to` out and listen for `select` and
 * `back`. The words are the app's translations: `label`, `backLabel` and the
 * rail toggle's labels default to the package's own words, which go through
 * `configure({ t })`.
 */
withDefaults(defineProps<{
  tabs: SettingsTab[]
  /** The id of the settings page that is open. */
  active: string
  /** Where "Leave settings" goes, with a router. */
  backTo?: SettingsTab['to']
  /** The navigation's accessible name; "Settings". */
  label?: string
  /** "Leave settings". */
  backLabel?: string
  expandLabel?: string
  collapseLabel?: string
}>(), {
  backTo: undefined,
  label: undefined,
  backLabel: undefined,
  expandLabel: undefined,
  collapseLabel: undefined,
})

const emit = defineEmits<{
  /** A tab without a `to` was chosen. */
  select: [id: string]
  /** "Leave settings" was chosen, without a `backTo`. */
  back: []
}>()
</script>

<style scoped>
.dcn-settings-navigation__footer {
  list-style: none;
  margin: 0;
  padding: var(--app-navigation-padding, 8px);
}
</style>
