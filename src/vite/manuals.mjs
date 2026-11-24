/**
 * The Vite plugin that puts an app's manuals into its bundle, for the help.
 *
 * ```ts
 * // vite.config.ts
 * import { dcnManuals } from '@doconext/nc-ui/vite'
 * plugins: [dcnManuals({ manuals: ['Gebruik', 'Beheer'], languages: ['nl'] })]
 * ```
 *
 * It compiles the Markdown at build time, so the browser gets HTML and needs no
 * Markdown library, the app needs no route to serve the files, and `docs/`
 * need not ship: the text travels in `js/`. Each page is a chunk of its own,
 * loaded when somebody opens it. The build fails on a link to a page or a
 * heading that does not exist.
 *
 * The app reads the result from `virtual:dcn-manuals` and hands it to
 * `configureHelp()`; see the README's "Help".
 */
import { resolve, sep } from 'node:path'
import { readManuals, renderPage } from './manuals-core.mjs'

const INDEX_ID = 'virtual:dcn-manuals'
const PAGE_PREFIX = `${INDEX_ID}/page/`

/**
 * @param {{ root?: string, manuals: string[], languages: string[], sourceLanguage?: string }} options
 *   `root`: the folder with a folder per language (default `docs/manuals`);
 *   `manuals`: the manuals the help shows, by folder name, in the order the
 *   help lists them; `languages`: the languages to bundle; `sourceLanguage`:
 *   the language topics in the code are written against (default the first).
 * @return {import('vite').Plugin}
 */
export function dcnManuals(options) {
  const root = resolve(options.root ?? 'docs/manuals')
  const languages = options.languages
  const sourceLanguage = options.sourceLanguage ?? languages[0]
  let isBuild = true

  const load = () => Object.fromEntries(languages.map((language) => [language, readManuals(root, language, options.manuals)]))

  return {
    name: 'dcn-manuals',

    configResolved(config) {
      isBuild = config.command === 'build'
    },

    buildStart() {
      const all = load()
      const problems = []
      for (const language of languages) {
        if (all[language].length === 0) problems.push(`${language}: no manuals under ${root}`)
        for (const manual of all[language]) {
          for (const page of [manual.start, ...manual.pages]) {
            this.addWatchFile(page.file)
            problems.push(...renderPage(page, all[language]).problems.map((p) => `${language}/${p}`))
          }
        }
      }
      if (problems.length > 0) {
        const message = `The manuals have ${problems.length} problem(s):\n  ${problems.join('\n  ')}`
        if (isBuild) this.error(message)
        else this.warn(message)
      }
    },

    resolveId(id) {
      if (id === INDEX_ID || id.startsWith(PAGE_PREFIX)) return `\0${id}`
      return null
    },

    load(id) {
      if (id === `\0${INDEX_ID}`) {
        const all = load()
        const meta = (page) => ({
          id: page.id,
          name: page.name,
          title: page.title,
          headings: page.headings.filter((h) => h.level > 1).map(({ level, text, id: anchor }) => ({ level, text, id: anchor })),
        })
        const index = {
          sourceLanguage,
          languages: Object.fromEntries(languages.map((language) => [language, all[language].map((m) => ({
            id: m.id,
            title: m.title,
            start: meta(m.start),
            pages: m.pages.map(meta),
          }))])),
        }
        const loaders = languages.flatMap((language) => all[language].flatMap((m) => [m.start, ...m.pages].map((page) =>
          `  ${JSON.stringify(`${language}:${page.id}`)}: () => import(${JSON.stringify(`${PAGE_PREFIX}${language}/${encodeURIComponent(page.id)}`)}),`)))
        return [
          `export const helpIndex = ${JSON.stringify(index)}`,
          'const loaders = {',
          ...loaders,
          '}',
          'export function loadHelpPage(language, id) {',
          '  const loader = loaders[`${language}:${id}`]',
          '  return loader ? loader().then((m) => m.default) : Promise.resolve(null)',
          '}',
        ].join('\n')
      }
      if (id.startsWith(`\0${PAGE_PREFIX}`)) {
        const rest = id.slice(PAGE_PREFIX.length + 1)
        const language = rest.slice(0, rest.indexOf('/'))
        const pageId = decodeURIComponent(rest.slice(rest.indexOf('/') + 1))
        const manuals = load()[language] ?? []
        const page = manuals.flatMap((m) => [m.start, ...m.pages]).find((p) => p.id === pageId)
        if (!page) return 'export default null'
        this.addWatchFile(page.file)
        return `export default ${JSON.stringify(renderPage(page, manuals).html)}`
      }
      return null
    },

    handleHotUpdate({ file, server }) {
      if (!file.startsWith(root + sep) || !file.endsWith('.md')) return undefined
      for (const mod of server.moduleGraph.idToModuleMap.values()) {
        if (mod.id?.startsWith(`\0${INDEX_ID}`)) server.moduleGraph.invalidateModule(mod)
      }
      server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}
