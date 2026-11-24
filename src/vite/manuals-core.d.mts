export interface ManualHeading {
  level: number
  text: string
  id: string
}

export interface ManualPage {
  /** `Manual/Page`; a start page is `Manual/Readme`. */
  id: string
  manual: string
  name: string
  file: string
  source: string
  title: string
  headings: ManualHeading[]
}

export interface Manual {
  id: string
  language: string
  title: string
  start: ManualPage
  pages: ManualPage[]
}

export interface FoundTopic {
  /** Null for `forward`: a bound `:help` or `:topic`. */
  topic: string | null
  /** Relative to the source folder, with forward slashes. */
  file: string
  kind: 'title' | 'button' | 'call' | 'forward'
}

export { parseTopic } from '../help/topic.mjs'
export function slugify(text: string): string
export function headingsOf(source: string): ManualHeading[]
export function readManuals(root: string, language: string, manualIds: string[]): Manual[]
export function topicOfLink(href: string, manualId: string): string | null
export function topicProblem(topic: string, manuals: Manual[]): string | null
export function renderPage(page: ManualPage, manuals: Manual[]): { html: string, problems: string[] }
export function findHelpTopics(srcDir: string): FoundTopic[]
