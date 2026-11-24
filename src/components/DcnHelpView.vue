<template>
  <div ref="root" class="dcn-help-view">
    <template v-if="resolved !== null">
      <article class="dcn-help-view__article">
        <p v-if="resolved.fallback" class="dcn-help-view__note">
          {{ translate('This help is not yet available in your language.') }}
        </p>
        <DcnPageTitle>{{ resolved.page.title }}</DcnPageTitle>
        <DcnHelpArticle :topic="topic" @navigate="(next) => emit('navigate', next)" />
      </article>
      <nav v-if="contents.length > 1" class="dcn-help-view__contents" :aria-label="translate('On this page')">
        <p class="dcn-help-view__contents-title">{{ translate('On this page') }}</p>
        <ul>
          <li v-for="heading in contents" :key="heading.id" :class="{ 'dcn-help-view__sub': heading.level > 2 }">
            <a :href="'#' + heading.id"
               :aria-current="heading.id === resolved.target.section ? 'location' : undefined"
               @click.prevent="emit('navigate', formatTopic({ ...resolved.target, section: heading.id }))">
              {{ heading.text }}
            </a>
          </li>
        </ul>
      </nav>
    </template>
    <p v-else class="dcn-help-view__missing">{{ translate('This page of the help could not be found.') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { translate } from '../config'
import { resolveTopic } from '../help/state'
import { formatTopic } from '../help/topic.mjs'
import DcnHelpArticle from './DcnHelpArticle.vue'
import DcnPageTitle from './DcnPageTitle.vue'

/**
 * The help as a page of its own: the manual page, and beside it what is on
 * it. The app gives it a route, and the topic from that route; a link inside
 * the page, or a heading in the contents, is emitted for the app's router, so
 * the address always says where the reader is and Back works.
 */
const props = defineProps<{
  /** `Manual/Page#section`. */
  topic: string
}>()

const emit = defineEmits<{
  navigate: [topic: string]
}>()

const resolved = computed(() => resolveTopic(props.topic))
const root = useTemplateRef<HTMLElement>('root')

// A page without a section opens at its title; one with a section is
// scrolled there by the article.
watch(() => resolved.value?.page.id, async () => {
  await nextTick()
  if (resolved.value?.target.section === null) root.value?.scrollIntoView?.({ block: 'start' })
})
const contents = computed(() => (resolved.value?.page.headings ?? []).filter((h) => h.level <= 3))
</script>

<style scoped>
.dcn-help-view {
  /* Text and contents together in the middle of the room. The text keeps a
     reading width: lines much past 80 characters are hard to follow back to
     their start, and a wide window would only make them longer. */
  display: grid;
  grid-template-columns: minmax(0, 80ch) 220px;
  justify-content: center;
  gap: calc(var(--default-grid-baseline) * 10);
  align-items: start;
  padding: calc(var(--default-grid-baseline) * 4) calc(var(--default-grid-baseline) * 7) calc(var(--default-grid-baseline) * 12);
}

.dcn-help-view__article {
  min-width: 0;
}

.dcn-help-view__article :deep(.dcn-page-title) {
  margin-bottom: calc(var(--default-grid-baseline) * 3);
}

.dcn-help-view__contents {
  position: sticky;
  top: calc(var(--default-grid-baseline) * 4);
  border-inline-start: 2px solid var(--color-border);
  padding-inline-start: calc(var(--default-grid-baseline) * 3);
  font-size: 13px;
}

.dcn-help-view__contents-title {
  margin: 0 0 var(--default-grid-baseline);
  color: var(--color-text-maxcontrast);
  font-weight: 600;
}

.dcn-help-view__contents ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.dcn-help-view__contents a {
  display: block;
  padding: 3px 0;
  color: var(--color-text-maxcontrast);
}

.dcn-help-view__contents a:hover,
.dcn-help-view__contents a[aria-current] {
  color: var(--color-primary-element);
}

.dcn-help-view__sub {
  padding-inline-start: calc(var(--default-grid-baseline) * 3);
}

.dcn-help-view__note {
  padding: calc(var(--default-grid-baseline) * 2) calc(var(--default-grid-baseline) * 3);
  background: var(--color-background-dark);
  border-radius: var(--border-radius-large, 10px);
  color: var(--color-text-maxcontrast);
  max-width: 68ch;
}

.dcn-help-view__missing {
  color: var(--color-text-maxcontrast);
}

@media (max-width: 900px) {
  .dcn-help-view {
    grid-template-columns: minmax(0, 1fr);
    padding-inline: calc(var(--default-grid-baseline) * 4);
  }

  .dcn-help-view__contents {
    display: none;
  }
}
</style>
