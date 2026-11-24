/**
 * The check every app with help runs in its own tests: each help topic its
 * source names exists in its manuals, and the question marks stay few.
 *
 * ```ts
 * import { checkHelpTopics } from '@doconext/nc-ui/testing'
 * expect(checkHelpTopics({ srcDir: 'src', language: 'nl', manuals: ['Gebruik', 'Beheer'],
 *   allowedButtons: { 'views/Foo.vue': 'a panel without a title of its own' } })).toEqual([])
 * ```
 *
 * The rule it holds, so a page does not fill up with question marks:
 * - a screen's help sits beside its title: `<DcnPageTitle help="…">`, or
 *   `help="…"` on the app's own title component;
 * - a lone `<DcnHelpButton>` only where there is no title to put it beside (a
 *   list that opens with its filters, a sidebar tab), and only in a file the
 *   app lists in `allowedButtons` with its reason;
 * - a component that passes a topic on (`:help`, `:topic`) is listed in
 *   `forwarders`, with what it is;
 * - one help per file. A field, a dialog, a section of a screen gets none: its
 *   own description says what it is, and the screen's help covers the rest.
 *
 * Plain JavaScript, like the plugin: an app's vitest loads it from
 * node_modules, where Node will not strip TypeScript.
 */
import { resolve } from 'node:path'
import { findHelpTopics, readManuals, topicProblem } from '../vite/manuals-core.mjs'

/**
 * @param {{ srcDir: string, root?: string, language: string, manuals: string[], allowedButtons?: Record<string, string>, forwarders?: Record<string, string> }} options
 * @return {string[]} what is wrong, one line each; empty when all is well
 */
export function checkHelpTopics(options) {
  const manuals = readManuals(resolve(options.root ?? 'docs/manuals'), options.language, options.manuals)
  const allowed = options.allowedButtons ?? {}
  const forwarders = options.forwarders ?? {}
  const found = findHelpTopics(resolve(options.srcDir))
  const problems = []
  const perFile = new Map()

  for (const f of found) {
    if (f.kind === 'forward') {
      if (!(f.file in forwarders)) problems.push(`${f.file}: passes a help topic on (:help or :topic); write the topic out, or list the file in forwarders`)
      continue
    }
    const problem = topicProblem(f.topic, manuals)
    if (problem) problems.push(`${f.file}: help topic "${f.topic}": ${problem}`)
    if (f.kind === 'call') continue
    perFile.set(f.file, (perFile.get(f.file) ?? 0) + 1)
    if (f.kind === 'button' && !(f.file in allowed)) {
      problems.push(`${f.file}: a lone help button; put the help on the page title, or list the file in allowedButtons with the reason it has no title`)
    }
  }
  for (const [file, count] of perFile) {
    if (count > 1) problems.push(`${file}: ${count} help buttons; one per screen`)
  }
  for (const file of Object.keys(forwarders)) {
    if (!found.some((f) => f.file === file && f.kind === 'forward')) {
      problems.push(`${file}: listed in forwarders but passes no topic on; take it off the list`)
    }
  }
  for (const file of Object.keys(allowed)) {
    if (!found.some((f) => f.file === file && f.kind === 'button')) {
      problems.push(`${file}: listed in allowedButtons but has no help button; take it off the list`)
    }
  }
  return problems
}
