<template>
  <div class="dcn-help-article">
    <DcnLoading v-if="state === 'loading'" />
    <p v-else-if="state === 'missing'" class="dcn-help-article__missing">
      {{ translate('This page of the help could not be loaded.') }}
    </p>
    <!-- eslint-disable-next-line vue/no-v-html -- the app's own manuals, compiled from its repository at build time; raw HTML in them is not passed through -->
    <div v-else ref="body" class="dcn-help-article__body" @click="follow" v-html="html" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { translate } from '../config'
import { loadTopicHtml, resolveTopic } from '../help/state'
import DcnLoading from './DcnLoading.vue'

/**
 * One page of a manual, opened at the section a topic names: the section is
 * scrolled to and lit for a moment, so the reader sees what the button meant.
 * A link to another page does not leave: it is emitted, and whoever shows the
 * article decides where it opens.
 */
const props = defineProps<{
  /** `Manual/Page#section`. */
  topic: string
}>()

const emit = defineEmits<{
  navigate: [topic: string]
}>()

const state = ref<'loading' | 'shown' | 'missing'>('loading')
const html = ref('')
const body = useTemplateRef<HTMLElement>('body')
let loadedPage: string | null = null

watch(() => props.topic, async (topic) => {
  const resolved = resolveTopic(topic)
  if (resolved === null) {
    state.value = 'missing'
    loadedPage = null
    return
  }
  if (loadedPage !== resolved.page.id) {
    state.value = 'loading'
    const loaded = await loadTopicHtml(resolved).catch(() => null)
    // A newer topic may have been asked for while this one loaded.
    if (props.topic !== topic) return
    if (loaded === null) {
      state.value = 'missing'
      loadedPage = null
      return
    }
    html.value = loaded
    loadedPage = resolved.page.id
    state.value = 'shown'
  }
  await nextTick()
  showSection(resolved.target.section)
}, { immediate: true })

/**
 * Scrolls to the section and lights it: its heading and what follows, up to
 * the next heading of its rank, in one frame, so it reads as one block. With
 * no section, the host keeps its place at the top of the page.
 */
function showSection(section: string | null) {
  const root = body.value
  if (!root) return
  for (const frame of Array.from(root.querySelectorAll('.dcn-help-article__target'))) {
    frame.replaceWith(...Array.from(frame.childNodes))
  }
  if (section === null) return
  const heading = root.querySelector<HTMLElement>(`#${CSS.escape(section)}`)
  if (!heading || heading.parentElement !== root) return
  const rank = Number(heading.tagName.slice(1))
  const frame = document.createElement('div')
  frame.className = 'dcn-help-article__target'
  heading.before(frame)
  let el: Element | null = heading
  while (el) {
    const next: Element | null = el.nextElementSibling
    frame.append(el)
    el = next
    if (el && /^H[1-6]$/.test(el.tagName) && Number(el.tagName.slice(1)) <= rank) break
  }
  frame.scrollIntoView?.({ block: 'start' })
}

function follow(event: MouseEvent) {
  const link = (event.target as HTMLElement).closest?.('a[data-help-topic]')
  if (!link) return
  event.preventDefault()
  emit('navigate', link.getAttribute('data-help-topic') ?? '')
}
</script>

<style scoped>
.dcn-help-article__missing {
  color: var(--color-text-maxcontrast);
}

.dcn-help-article__body {
  line-height: 1.6;
}

.dcn-help-article__body :deep(h2) {
  font-size: 18px;
  line-height: 26px;
  font-weight: 600;
  margin: calc(var(--default-grid-baseline) * 6) 0 calc(var(--default-grid-baseline) * 2);
  scroll-margin-top: calc(var(--default-grid-baseline) * 3);
}

.dcn-help-article__body :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  margin: calc(var(--default-grid-baseline) * 4) 0 var(--default-grid-baseline);
  scroll-margin-top: calc(var(--default-grid-baseline) * 3);
}

.dcn-help-article__body :deep(p),
.dcn-help-article__body :deep(ul),
.dcn-help-article__body :deep(ol) {
  margin: 0 0 calc(var(--default-grid-baseline) * 3);
}

.dcn-help-article__body :deep(ul),
.dcn-help-article__body :deep(ol) {
  padding-inline-start: calc(var(--default-grid-baseline) * 6);
}

.dcn-help-article__body :deep(ul) {
  list-style: disc;
}

.dcn-help-article__body :deep(ol) {
  list-style: decimal;
}

.dcn-help-article__body :deep(li) {
  margin: var(--default-grid-baseline) 0;
}

.dcn-help-article__body :deep(em) {
  /* Nextcloud draws em grey and upright; in a manual it is a word set apart. */
  font-style: italic;
  color: inherit;
}

.dcn-help-article__body :deep(a) {
  color: var(--color-primary-element);
  text-decoration: underline;
}

.dcn-help-article__body :deep(code) {
  font-family: var(--font-face-monospace, monospace);
  background: var(--color-background-dark);
  border-radius: var(--border-radius-small, 4px);
  padding: 0 4px;
}

.dcn-help-article__body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 calc(var(--default-grid-baseline) * 3);
}

.dcn-help-article__body :deep(th),
.dcn-help-article__body :deep(td) {
  /* Nextcloud keeps every table cell on one line; a manual's cells are
     sentences, and wrap to the column instead. */
  white-space: normal;
  overflow-wrap: break-word;
  text-align: start;
  vertical-align: top;
  padding: calc(var(--default-grid-baseline) * 1.5) calc(var(--default-grid-baseline) * 2);
  border-bottom: 1px solid var(--color-border);
}

.dcn-help-article__body :deep(th) {
  color: var(--color-text-maxcontrast);
  font-weight: 600;
}

/* The section the button meant, in one frame: lit, and the light fades to
   a quiet mark after a moment. */
.dcn-help-article__body :deep(.dcn-help-article__target) {
  margin-inline: calc(var(--default-grid-baseline) * -3);
  padding: var(--default-grid-baseline) calc(var(--default-grid-baseline) * 3);
  border-radius: var(--border-radius-large, 10px);
  background-color: var(--color-primary-element-light);
  scroll-margin-top: calc(var(--default-grid-baseline) * 2);
  animation: dcn-help-fade 2.4s ease-out 1.2s forwards;
}

.dcn-help-article__body :deep(.dcn-help-article__target > h2:first-child),
.dcn-help-article__body :deep(.dcn-help-article__target > h3:first-child) {
  margin-top: var(--default-grid-baseline);
}

.dcn-help-article__body :deep(.dcn-help-article__target > :last-child) {
  margin-bottom: var(--default-grid-baseline);
}

@keyframes dcn-help-fade {
  to {
    background-color: transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dcn-help-article__body :deep(.dcn-help-article__target) {
    animation: none;
  }
}
</style>
