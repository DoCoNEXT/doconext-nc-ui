/**
 * Reading an app's manuals: the half of the help that runs in Node, shared by
 * the Vite plugin (which compiles them into the bundle) and the test helper
 * (which checks every help button against them).
 *
 * Plain JavaScript on purpose. An app's vite.config.ts and its vitest load
 * this from node_modules, where Node refuses to strip TypeScript.
 *
 * The manuals are the ones written for Nextcloud Collectives, unchanged:
 * `<root>/<language>/<Manual>/Readme.md` is a manual's start page, every other
 * `.md` beside it is a page, and a link is a path from the manual's folder
 * (`[Mappen](Mappen.md#de-map-openen)`). A manual laid out as a section of one
 * collective (`<root>/<language>/<Manual>.md` beside `<Manual>/`) works too;
 * its links may also start at the language folder (`Gebruik/Uren.md`).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import MarkdownIt from 'markdown-it'
import { parseTopic } from '../help/topic.mjs'

export { parseTopic }

/**
 * The anchor of a heading: lower case, accents dropped, everything that is not
 * a letter or digit a single hyphen. "Eén bestand" becomes `een-bestand`.
 * A topic names a section by this, so changing it renames every anchor.
 * @param {string} text the heading as written
 * @return {string}
 */
export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function markdown() {
  return new MarkdownIt({ html: false, linkify: false, typographer: false })
}

/** Plain text of a heading's inline tokens, as a reader sees it. */
function inlineText(token) {
  return (token.children ?? []).filter((c) => c.type === 'text' || c.type === 'code_inline').map((c) => c.content).join('')
}

/**
 * Every heading of a page, with the anchor it gets. A second heading with the
 * same text gets `-2`, as on GitHub, so both stay reachable.
 * @param {string} source the page's Markdown
 * @return {{ level: number, text: string, id: string }[]}
 */
export function headingsOf(source) {
  const tokens = markdown().parse(source, {})
  const seen = new Map()
  const out = []
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== 'heading_open') continue
    const text = inlineText(tokens[i + 1])
    const base = slugify(text) || 'section'
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    out.push({ level: Number(tokens[i].tag.slice(1)), text, id: count === 1 ? base : `${base}-${count}` })
  }
  return out
}

/** The `.md` links of a page, in the order a reader meets them. */
function linksOf(source) {
  const tokens = markdown().parse(source, {})
  const out = []
  const walk = (list) => {
    for (const token of list) {
      if (token.type === 'link_open') out.push(token.attrGet('href') ?? '')
      if (token.children) walk(token.children)
    }
  }
  walk(tokens)
  return out
}

/**
 * The manuals of one language, as files on disk.
 * @param {string} root the folder holding a folder per language
 * @param {string} language e.g. `nl`
 * @param {string[]} manualIds the manuals the app shows, e.g. `['Gebruik', 'Beheer']`
 * @return {Manual[]}
 *
 * @typedef {{ id: string, manual: string, name: string, file: string, source: string, title: string, headings: { level: number, text: string, id: string }[] }} Page
 * @typedef {{ id: string, language: string, title: string, start: Page, pages: Page[] }} Manual
 */
export function readManuals(root, language, manualIds) {
  const languageDir = join(root, language)
  if (!existsSync(languageDir)) return []
  return manualIds.flatMap((id) => {
    const dir = join(languageDir, id)
    const ownStart = join(dir, 'Readme.md')
    const sectionStart = join(languageDir, `${id}.md`)
    const startFile = existsSync(ownStart) ? ownStart : existsSync(sectionStart) ? sectionStart : null
    if (startFile === null) return []
    const page = (file, name) => {
      const source = readFileSync(file, 'utf8')
      const headings = headingsOf(source)
      const h1 = headings.find((h) => h.level === 1)
      return { id: `${id}/${name}`, manual: id, name, file, source, title: h1?.text ?? name, headings }
    }
    const start = page(startFile, 'Readme')
    const others = existsSync(dir) && statSync(dir).isDirectory()
      ? readdirSync(dir)
        .filter((f) => f.endsWith('.md') && f !== 'Readme.md')
        .map((f) => page(join(dir, f), f.slice(0, -3)))
      : []
    return [{ id, language, title: start.title, start, pages: orderPages(start, others, id) }]
  })
}

/**
 * The pages in the order the start page links them, which is the order its
 * table gives in Collectives too. A page the start page never links comes
 * after, by name.
 */
function orderPages(start, pages, manualId) {
  const order = []
  for (const href of linksOf(start.source)) {
    const topic = topicOfLink(href, manualId)
    const name = topic === null ? null : parseTopic(topic).page
    if (name !== null && name !== 'Readme' && !order.includes(name)) order.push(name)
  }
  const rank = (p) => {
    const at = order.indexOf(p.name)
    return at === -1 ? order.length : at
  }
  return [...pages].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
}

/**
 * The topic a link inside a manual points at, or null when it is no link to a
 * page of the same manual. Links never cross into another manual: the
 * Collectives importer cannot resolve those either.
 * @param {string} href
 * @param {string} manualId
 * @return {string | null}
 */
export function topicOfLink(href, manualId) {
  const path = href.split('#')[0]
  if (!path.endsWith('.md') || /^[a-z]+:/i.test(path) || path.startsWith('/')) return null
  const parts = path.replace(/^\.\//, '').slice(0, -3).split('/')
  const section = href.includes('#') ? href.slice(href.indexOf('#') + 1) : ''
  let page
  if (parts.length === 1) page = parts[0]
  else if (parts.length === 2 && parts[0] === manualId) page = parts[1]
  else return null
  return `${manualId}/${page}${section ? `#${section}` : ''}`
}

/**
 * Whether a topic names a page, and a heading on it, that exists.
 * @param {string} topic
 * @param {Manual[]} manuals
 * @return {string | null} what is wrong, or null
 */
export function topicProblem(topic, manuals) {
  const { manual, page, section } = parseTopic(topic)
  const m = manuals.find((x) => x.id === manual)
  if (!m) return `no manual "${manual}"`
  const p = page === 'Readme' ? m.start : m.pages.find((x) => x.name === page)
  if (!p) return `no page "${page}" in ${manual}`
  if (section !== null && !p.headings.some((h) => h.id === section)) {
    return `no heading "#${section}" on ${manual}/${page} (it has: ${p.headings.filter((h) => h.level > 1).map((h) => h.id).join(', ')})`
  }
  return null
}

/**
 * The page as HTML for the help: headings with their anchors, a link to another
 * page turned into a topic the help opens itself, any other link opening in a
 * new tab. Raw HTML in the Markdown is not passed through.
 * @param {Page} page
 * @param {Manual[]} manuals the same language's manuals, to resolve links
 * @return {{ html: string, problems: string[] }}
 */
export function renderPage(page, manuals) {
  const md = markdown()
  const problems = []
  const headings = page.headings
  // The page's own h1 is shown by the help as its title, so it is left out of
  // the body; the anchors of the rest then start one further on.
  const opensWithTitle = /^#\s/.test(page.source)
  const source = opensWithTitle ? page.source.replace(/^#\s[^\n]*\n/, '') : page.source
  let headingIndex = opensWithTitle ? 1 : 0
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const h = headings[headingIndex++]
    if (h) tokens[idx].attrSet('id', h.id)
    return self.renderToken(tokens, idx, options)
  }
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const href = token.attrGet('href') ?? ''
    if (href.startsWith('#')) {
      const topic = `${page.id}${href}`
      const problem = topicProblem(topic, manuals)
      if (problem) problems.push(`${page.id}: link "${href}": ${problem}`)
      token.attrSet('href', href)
      token.attrSet('data-help-topic', topic)
      return self.renderToken(tokens, idx, options)
    }
    const topic = topicOfLink(href, page.manual)
    if (topic !== null) {
      const problem = topicProblem(topic, manuals)
      if (problem) problems.push(`${page.id}: link "${href}": ${problem}`)
      token.attrSet('href', '#')
      token.attrSet('data-help-topic', topic)
    } else if (href.endsWith('.md') || href.includes('.md#')) {
      problems.push(`${page.id}: link "${href}" leaves the manual`)
    } else {
      token.attrSet('target', '_blank')
      token.attrSet('rel', 'noopener noreferrer')
    }
    return self.renderToken(tokens, idx, options)
  }
  md.renderer.rules.image = (tokens, idx) => {
    problems.push(`${page.id}: image "${tokens[idx].attrGet('src')}": the help shows no images yet`)
    return ''
  }
  return { html: md.render(source), problems }
}

/**
 * The help topics an app's source names, with where. A topic is found as
 * `help="…"` on any component (`<DcnPageTitle>`, or an app's own title
 * component that passes it on), as `<DcnHelpButton topic="…">`, and in
 * `helpUrl('…')` and `openHelp('…')`. Only a literal names a topic, so the
 * check stays complete; a bound `:help` or `:topic` is a component passing
 * one on, reported as kind `forward` for the app to account for.
 * @param {string} srcDir
 * @return {FoundTopic[]}
 *
 * @typedef {{ topic: string | null, file: string, kind: 'title' | 'button' | 'call' | 'forward' }} FoundTopic
 */
export function findHelpTopics(srcDir) {
  const found = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') walk(path)
        continue
      }
      if (!/\.(vue|ts|js|mjs)$/.test(entry.name)) continue
      const text = readFileSync(path, 'utf8')
      const file = relative(srcDir, path).split(sep).join('/')
      for (const m of text.matchAll(/<([A-Z][\w]*)\b[^>]*>/g)) {
        const tag = m[0]
        const isButton = m[1] === 'DcnHelpButton'
        const literal = tag.match(isButton ? /\stopic="([^"]*)"/ : /\shelp="([^"]*)"/)
        if (literal) found.push({ topic: literal[1], file, kind: isButton ? 'button' : 'title' })
        else if (isButton ? /\s(?::|v-bind:)topic=/.test(tag) : /\s(?::|v-bind:)help=/.test(tag)) found.push({ topic: null, file, kind: 'forward' })
      }
      for (const m of text.matchAll(/\b(?:helpUrl|openHelp)\(\s*(['"`])([^'"`]*)\1\s*\)/g)) {
        found.push({ topic: m[2], file, kind: 'call' })
      }
    }
  }
  walk(srcDir)
  return found
}
