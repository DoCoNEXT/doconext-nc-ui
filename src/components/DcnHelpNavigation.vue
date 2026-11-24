<template>
  <!--
    The navigation an app shows instead of its own while the help page is
    open, as DcnSettingsNavigation does for settings: the manuals and their
    pages, a search over titles and headings, and a way back.
  -->
  <NcAppNavigation :aria-label="translate('Help')">
    <template #search>
      <NcAppNavigationSearch v-model="query" :label="translate('Search the help')">
        <template #actions>
          <DcnNavigationRailToggle :expand-label="translate('Expand menu')"
                                   :collapse-label="translate('Collapse menu')" />
        </template>
      </NcAppNavigationSearch>
    </template>

    <template #list>
      <template v-if="query.trim() === ''">
        <template v-for="manual in help.manuals.value" :key="manual.id">
          <NcAppNavigationCaption :name="manual.title" />
          <NcAppNavigationItem :name="translate('Start')"
                               :active="manual.start.id === activePage"
                               :to="to(manual.id)">
            <template #icon>
              <BookOpen :size="20" />
            </template>
          </NcAppNavigationItem>
          <NcAppNavigationItem v-for="page in manual.pages"
                               :key="page.id"
                               class="dcn-help-navigation__page"
                               :name="page.title"
                               :active="page.id === activePage"
                               :to="to(page.id)" />
        </template>
      </template>
      <template v-else>
        <NcAppNavigationItem v-for="hit in hits"
                             :key="hit.topic"
                             :name="hit.name"
                             :title="hit.where"
                             :to="to(hit.topic)">
          <template #icon>
            <Search :size="20" />
          </template>
        </NcAppNavigationItem>
        <li v-if="hits.length === 0" class="dcn-help-navigation__none">{{ translate('Nothing in the help matches.') }}</li>
      </template>
    </template>

    <template #footer>
      <ul class="dcn-help-navigation__footer">
        <NcAppNavigationItem :name="backLabel ?? translate('Leave help')" :to="backTo">
          <template #icon>
            <ArrowLeft :size="20" />
          </template>
        </NcAppNavigationItem>
      </ul>
    </template>
  </NcAppNavigation>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NcAppNavigation, NcAppNavigationCaption, NcAppNavigationItem, NcAppNavigationSearch } from '@nextcloud/vue'
import { ArrowLeft, BookOpen, Search } from '@lucide/vue'
import { translate } from '../config'
import { useHelp } from '../help/state'
import type { SettingsTab } from '../types'
import DcnNavigationRailToggle from './DcnNavigationRailToggle.vue'

/**
 * The help page's navigation. The app gives a `to` for a topic, which is how
 * its router addresses the help page, and where "Leave help" goes.
 */
withDefaults(defineProps<{
  /** The id of the page that is open, `Manual/Page`. */
  activePage: string
  /** The route for a topic: what vue-router takes as a `to`. */
  to: (topic: string) => SettingsTab['to']
  /** Where "Leave help" goes. */
  backTo: SettingsTab['to']
  /** "Leave help". */
  backLabel?: string
}>(), {
  backLabel: undefined,
})

const help = useHelp()
const query = ref('')

/** Pages whose title, and sections whose heading, holds every word typed. */
const hits = computed(() => {
  const words = query.value.toLocaleLowerCase().split(/\s+/).filter(Boolean)
  const matches = (text: string) => words.every((w) => text.toLocaleLowerCase().includes(w))
  const out: { topic: string, name: string, where: string }[] = []
  for (const manual of help.manuals.value) {
    for (const page of [manual.start, ...manual.pages]) {
      if (matches(page.title)) out.push({ topic: page.id, name: page.title, where: manual.title })
      for (const heading of page.headings) {
        if (matches(heading.text)) out.push({ topic: `${page.id}#${heading.id}`, name: heading.text, where: `${manual.title} › ${page.title}` })
      }
    }
  }
  return out.slice(0, 30)
})

</script>

<style scoped>
.dcn-help-navigation__page :deep(.app-navigation-entry__name) {
  padding-inline-start: calc(var(--default-grid-baseline) * 2);
}

.dcn-help-navigation__none {
  padding: calc(var(--default-grid-baseline) * 2) calc(var(--default-grid-baseline) * 4);
  color: var(--color-text-maxcontrast);
  list-style: none;
}

.dcn-help-navigation__footer {
  list-style: none;
  margin: 0;
  padding: var(--app-navigation-padding, 8px);
}
</style>
