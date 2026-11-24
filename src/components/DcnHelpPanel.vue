<template>
  <!-- Teleported: an ancestor in Nextcloud's chrome makes itself the
       containing block for `position: fixed`, which would pin the panel to it
       instead of to the window. The frame does not move and clips; the panel
       slides inside it, so the slide needs no clip-path, which would not
       animate. -->
  <Teleport to="body">
    <div class="dcn-help-panel-frame"
         :class="{ 'dcn-help-panel-frame--open': resolved !== null }"
         :style="{ insetInlineEnd: `${besideSidebar}px` }">
      <aside ref="panel"
             class="dcn-help-panel"
             :aria-label="translate('Help')"
             :inert="resolved === null"
             tabindex="-1"
             @keydown.esc.stop="help.close()">
        <template v-if="resolved !== null">
          <header class="dcn-help-panel__header">
            <NcButton variant="tertiary"
                      :aria-label="translate('Back')"
                      :title="translate('Back')"
                      :disabled="!help.canGoBack.value"
                      @click="help.back()">
              <template #icon>
                <ArrowLeft :size="20" />
              </template>
            </NcButton>
            <span class="dcn-help-panel__trail">{{ resolved.manual.title }}</span>
            <NcButton variant="tertiary"
                      :aria-label="translate('Open as page')"
                      :title="translate('Open as page')"
                      @click="help.openAsPage()">
              <template #icon>
                <Maximize2 :size="20" />
              </template>
            </NcButton>
            <NcButton variant="tertiary"
                      :aria-label="translate('Close help')"
                      :title="translate('Close help')"
                      @click="help.close()">
              <template #icon>
                <X :size="20" />
              </template>
            </NcButton>
          </header>
          <div ref="scroller" class="dcn-help-panel__body">
            <p v-if="resolved.fallback" class="dcn-help-panel__note">
              {{ translate('This help is not yet available in your language.') }}
            </p>
            <h2 ref="title" class="dcn-help-panel__title" tabindex="-1">{{ resolved.page.title }}</h2>
            <DcnHelpArticle :topic="topic ?? ''" @navigate="help.open" />
          </div>
        </template>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { NcButton } from '@nextcloud/vue'
import { ArrowLeft, Maximize2, X } from '@lucide/vue'
import { translate } from '../config'
import { registerPanelHost, resolveTopic, useHelp } from '../help/state'
import DcnHelpArticle from './DcnHelpArticle.vue'

/**
 * The help beside the work: a panel that slides in from the right over the
 * page, so the screen the reader asked about stays in view. Put it once in the
 * shell component, beside NcContent; every help button on the page then opens
 * it. Back, "Open as page" and Close in its header; Escape closes it too, and
 * focus goes back to the button that opened it.
 *
 * With the app's sidebar open (NcAppSidebar: a record's details, say) the
 * panel stands beside it rather than over it, since the sidebar is often what
 * the reader asked about. A window too narrow for both gets the panel over it.
 */
const help = useHelp()
const topic = help.topic
const resolved = computed(() => (topic.value === null ? null : resolveTopic(topic.value)))
const panel = useTemplateRef<HTMLElement>('panel')
const title = useTemplateRef<HTMLElement>('title')
const scroller = useTemplateRef<HTMLElement>('scroller')
let opener: HTMLElement | null = null
let unregister: (() => void) | null = null

/** The panel's width, and the least room the page keeps beside it and the sidebar. */
const PANEL_WIDTH = 460
const PAGE_KEPT = 320

/** How far from the window's edge the panel stands: the width of an open sidebar, or 0. */
const besideSidebar = ref(0)

function measure() {
  const sidebar = document.querySelector<HTMLElement>('.app-sidebar')
  const rect = sidebar?.getBoundingClientRect()
  const open = rect !== undefined && rect.width > 0 && rect.right >= window.innerWidth - 24
  const width = open ? Math.round(window.innerWidth - rect.left) : 0
  besideSidebar.value = width > 0 && window.innerWidth - width >= PANEL_WIDTH + PAGE_KEPT ? width : 0
}

// While the panel is open, a sidebar that opens, closes or is dragged wider
// changes the width of the content beside it; watching both catches each.
let observer: ResizeObserver | null = null
function follow(on: boolean) {
  observer?.disconnect()
  observer = null
  window.removeEventListener('resize', measure)
  if (!on) return
  measure()
  if (typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(measure)
  for (const el of document.querySelectorAll('#app-content-vue, #app-content, .app-sidebar')) observer.observe(el)
  window.addEventListener('resize', measure)
}

onMounted(() => {
  unregister = registerPanelHost()
})
onBeforeUnmount(() => {
  follow(false)
  unregister?.()
})

watch(() => resolved.value !== null, (open) => follow(open))

watch(resolved, async (now, before) => {
  if (now !== null && before === null) {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }
  if (now === null) {
    if (before !== null && panel.value?.contains(document.activeElement)) opener?.focus({ preventScroll: true })
    opener = null
    return
  }
  await nextTick()
  if (before?.page.id !== now.page.id) scroller.value?.scrollTo?.({ top: 0 })
  // Without preventScroll the clipping frame scrolls to reach the panel while
  // it is still sliding in, and the panel jumps.
  title.value?.focus({ preventScroll: true })
})
</script>

<style scoped>
.dcn-help-panel-frame {
  position: fixed;
  top: var(--header-height, 50px);
  inset-inline-end: 0;
  bottom: 0;
  width: min(460px, 100vw);
  transition: inset-inline-end 220ms ease;
  /* Room for the shadow on the side it does not slide from. */
  padding-inline-start: 40px;
  overflow: clip;
  pointer-events: none;
  z-index: 2010;
}

.dcn-help-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-main-background);
  color: var(--color-main-text);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.2);
  border-start-start-radius: var(--border-radius-container-large, 16px);
  transform: translateX(calc(100% + 40px));
  transition: transform 220ms ease;
  outline: none;
}

.dcn-help-panel-frame--open .dcn-help-panel {
  transform: none;
  pointer-events: auto;
}

@media (prefers-reduced-motion: reduce) {
  .dcn-help-panel,
  .dcn-help-panel-frame {
    transition: none;
  }
}

.dcn-help-panel__header {
  display: flex;
  align-items: center;
  gap: var(--default-grid-baseline);
  padding: var(--default-grid-baseline) calc(var(--default-grid-baseline) * 2);
  border-bottom: 1px solid var(--color-border);
}

.dcn-help-panel__trail {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-maxcontrast);
}

.dcn-help-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--default-grid-baseline) * 2) calc(var(--default-grid-baseline) * 5) calc(var(--default-grid-baseline) * 8);
}

.dcn-help-panel__title {
  font-size: 22px;
  line-height: 30px;
  font-weight: 600;
  margin: calc(var(--default-grid-baseline) * 2) 0;
  outline: none;
}

.dcn-help-panel__note {
  padding: calc(var(--default-grid-baseline) * 2) calc(var(--default-grid-baseline) * 3);
  background: var(--color-background-dark);
  border-radius: var(--border-radius-large, 10px);
  color: var(--color-text-maxcontrast);
}
</style>
