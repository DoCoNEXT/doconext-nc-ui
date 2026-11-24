/**
 * The help's state in the browser: what the app configured, and what the panel
 * shows. One panel per page, so one state per page, kept at module level like
 * the package's configuration.
 */
import { computed, reactive, shallowRef } from 'vue'
import type { ComputedRef } from 'vue'
import type { HelpManual, HelpOptions, HelpPageMeta, HelpTarget } from './types'
import { formatTopic, parseTopic } from './topic.mjs'

const options = shallowRef<HelpOptions | null>(null)

const panel = reactive({
  /** The topic the panel shows, or null when it is closed. */
  topic: null as string | null,
  /** The topics before it, for the panel's Back. */
  history: [] as string[],
  /** How many panels are on the page; with none, a help button opens the help page instead. */
  hosts: 0,
})

/** Called once per entry point, after `configure()`: `configureHelp({ index: helpIndex, loadPage: loadHelpPage, … })`. */
export function configureHelp(value: HelpOptions): void {
  options.value = value
}

/** For tests only. */
export function resetHelp(): void {
  options.value = null
  panel.topic = null
  panel.history = []
  panel.hosts = 0
}

/** `nl_NL` and `nl-NL` read as `nl`: the manuals come per language, not per country. */
function baseLanguage(language: string): string {
  return (language.split(/[-_]/)[0] ?? language).toLowerCase()
}

/** A manual as the reader gets it: in their language when it exists, else in the one the manuals are written in. */
export interface ShownManual extends HelpManual {
  language: string
}

/** The manuals this reader is shown, in order. */
function shownManuals(): ShownManual[] {
  const o = options.value
  if (o === null) return []
  const own = baseLanguage(o.language)
  return o.manuals.flatMap((id) => {
    const inOwn = o.index.languages[own]?.find((m) => m.id === id)
    if (inOwn) return [{ ...inOwn, language: own }]
    const inSource = o.index.languages[o.index.sourceLanguage]?.find((m) => m.id === id)
    return inSource ? [{ ...inSource, language: o.index.sourceLanguage }] : []
  })
}

/** What a topic points at, for this reader: the manual, the page and its language. Null when the reader is not shown it. */
export interface ResolvedTopic {
  target: HelpTarget
  manual: ShownManual
  page: HelpPageMeta
  /** Whether the page is in another language than the reader's, because theirs has none. */
  fallback: boolean
}

export function resolveTopic(topic: string): ResolvedTopic | null {
  const target = parseTopic(topic)
  const manual = shownManuals().find((m) => m.id === target.manual)
  if (!manual) return null
  const page = target.page === 'Readme' ? manual.start : manual.pages.find((p) => p.name === target.page)
  if (!page) return null
  // A section is looked up in the source language's headings; a translation
  // has its own anchors, so there the page opens at the top instead.
  const section = target.section !== null && page.headings.some((h) => h.id === target.section) ? target.section : null
  const own = options.value === null ? manual.language : baseLanguage(options.value.language)
  return { target: { ...target, section }, manual, page, fallback: manual.language !== own }
}

/**
 * The address of the help page for a topic, for a link outside the app's own
 * pages (Nextcloud's settings, the Files sidebar). Empty when the app gave no
 * `pageUrl` or the reader is not shown the topic.
 */
export function helpUrl(topic: string): string {
  const resolved = resolveTopic(topic)
  const pageUrl = options.value?.pageUrl
  return resolved && pageUrl ? pageUrl(resolved.target) : ''
}

/** Opens the help on a topic: in the panel when the page has one, else the help page in a new tab. */
export function openHelp(topic: string): void {
  if (resolveTopic(topic) === null) return
  if (panel.hosts === 0) {
    const url = helpUrl(topic)
    if (url) window.open(url, '_blank', 'noopener')
    return
  }
  if (panel.topic !== null && panel.topic !== topic) panel.history.push(panel.topic)
  panel.topic = topic
}

/** Replaces the installation's own words in a page's text, never inside a tag. */
export function applyTerms(html: string, terms: Record<string, string> | undefined): string {
  const entries = Object.entries(terms ?? {}).filter(([from, to]) => from !== '' && to !== '' && from !== to)
  if (entries.length === 0) return html
  entries.sort((a, b) => b[0].length - a[0].length)
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${entries.map(([from]) => escape(from)).join('|')})(?![\\p{L}\\p{N}])`, 'gu')
  const lookup = new Map(entries)
  const toHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return html.split(/(<[^>]*>)/).map((part) => (part.startsWith('<') ? part : part.replace(pattern, (m) => toHtml(lookup.get(m) ?? m)))).join('')
}

export interface UseHelp {
  /** The manuals this reader is shown. */
  manuals: ComputedRef<ShownManual[]>
  /** The topic in the panel, or null. */
  topic: ComputedRef<string | null>
  canGoBack: ComputedRef<boolean>
  open: (topic: string) => void
  back: () => void
  close: () => void
  /** Whether a topic leads anywhere for this reader. */
  available: (topic: string) => boolean
  /** Leaves the panel for the help page on the topic it shows. */
  openAsPage: () => void
}

export function useHelp(): UseHelp {
  return {
    manuals: computed(() => shownManuals()),
    topic: computed(() => panel.topic),
    canGoBack: computed(() => panel.history.length > 0),
    open: openHelp,
    back() {
      panel.topic = panel.history.pop() ?? panel.topic
    },
    close() {
      panel.topic = null
      panel.history = []
    },
    available: (topic) => resolveTopic(topic) !== null,
    openAsPage() {
      const resolved = panel.topic === null ? null : resolveTopic(panel.topic)
      panel.topic = null
      panel.history = []
      if (resolved === null) return
      if (options.value?.openPage) {
        options.value.openPage(resolved.target)
      } else {
        const url = helpUrl(formatTopic(resolved.target))
        if (url) window.open(url, '_blank', 'noopener')
      }
    },
  }
}

/** The page's HTML for the reader, with the installation's words; null when it cannot be loaded. */
export async function loadTopicHtml(resolved: ResolvedTopic): Promise<string | null> {
  const o = options.value
  if (o === null) return null
  const html = await o.loadPage(resolved.manual.language, resolved.page.id)
  return html === null ? null : applyTerms(html, o.terms)
}

/** A panel announces itself while it is on the page, so the buttons know to open it. */
export function registerPanelHost(): () => void {
  panel.hosts++
  return () => {
    panel.hosts--
    if (panel.hosts === 0) {
      panel.topic = null
      panel.history = []
    }
  }
}

/** Whether a panel is on the page. */
export const hasPanelHost = computed(() => panel.hosts > 0)
