/**
 * The help's Node half: reading the manuals, the anchors, the links, the order
 * of the pages, and the check an app runs over its help buttons. Against the
 * small manual in tests/fixtures, laid out as Core's are.
 */
import { describe, expect, it } from 'vitest'
import { findHelpTopics, headingsOf, readManuals, renderPage, slugify, topicProblem } from '../src/vite/manuals-core.mjs'
import { checkHelpTopics } from '../src/testing/help.mjs'
import { dcnManuals } from '../src/vite/manuals.mjs'

// No @types/node in this package, so the fixtures are found from the URL.
const root = decodeURIComponent(new URL('./fixtures/manuals', import.meta.url).pathname)
const srcDir = decodeURIComponent(new URL('./fixtures/src', import.meta.url).pathname)
const manuals = readManuals(root, 'nl', ['Gebruik', 'Beheer'])
/** A page of the fixture manuals by id. */
function page(id: string) {
  return manuals.flatMap((m) => [m.start, ...m.pages]).find((p) => p.id === id)!
}

describe('anchors', () => {
  it('turn a heading into lower case words joined by hyphens, accents dropped', () => {
    expect(slugify('Eén bestand')).toBe('een-bestand')
    expect(slugify('De map openen')).toBe('de-map-openen')
    expect(slugify('Tijdlijn / audit')).toBe('tijdlijn-audit')
  })

  it('keep a second heading with the same text reachable', () => {
    expect(headingsOf(page('Gebruik/Dossiers').source).map((h) => h.id)).toEqual(['dossiers', 'zoeken', 'filteren', 'filteren-2'])
  })
})

describe('reading the manuals', () => {
  it('takes the manuals in the order asked, each titled by its start page', () => {
    expect(manuals.map((m) => [m.id, m.title])).toEqual([['Gebruik', 'Handleiding DoCoNEXT'], ['Beheer', 'Beheerhandleiding']])
  })

  it('orders the pages as the start page links them, not by name', () => {
    expect(manuals[0]!.pages.map((p) => p.name)).toEqual(['Mappen', 'Dossiers'])
  })

  it('finds nothing for a language without manuals', () => {
    expect(readManuals(root, 'de', ['Gebruik'])).toEqual([])
  })
})

describe('a page as HTML', () => {
  it('leaves out the title, which the help shows itself, and gives each heading its anchor', () => {
    const { html, problems } = renderPage(page('Gebruik/Mappen'), manuals)
    expect(problems).toEqual([])
    expect(html).not.toContain('<h1')
    expect(html).toContain('<h2 id="de-map-openen">De map openen</h2>')
    expect(html).toContain('<h2 id="een-bestand">Eén bestand</h2>')
  })

  it('turns a link to another page, and to a heading on the same page, into a topic', () => {
    const { html } = renderPage(page('Gebruik/Dossiers'), manuals)
    expect(html).toContain('data-help-topic="Gebruik/Mappen#de-map-openen"')
    expect(html).toContain('data-help-topic="Gebruik/Dossiers#filteren"')
  })

  it('opens a link out of the manuals in a new tab', () => {
    expect(renderPage(page('Gebruik/Mappen'), manuals).html).toContain('href="https://nextcloud.com" target="_blank" rel="noopener noreferrer"')
  })

  it('reports a link to a heading that does not exist', () => {
    const broken = { ...page('Gebruik/Mappen'), source: '# Mappen\n\nZie [weg](Dossiers.md#bestaat-niet).\n' }
    expect(renderPage(broken, manuals).problems).toEqual([expect.stringContaining('no heading "#bestaat-niet" on Gebruik/Dossiers')])
  })

  it('does not pass raw HTML through', () => {
    const raw = { ...page('Gebruik/Mappen'), source: '# Mappen\n\n<script>alert(1)</script>\n' }
    expect(renderPage(raw, manuals).html).not.toContain('<script>')
  })
})

describe('topics', () => {
  it('name a manual, a page and a heading that exist', () => {
    expect(topicProblem('Gebruik', manuals)).toBeNull()
    expect(topicProblem('Gebruik/Mappen#een-bestand', manuals)).toBeNull()
    expect(topicProblem('Gebruik/Mappen#weg', manuals)).toContain('no heading "#weg"')
    expect(topicProblem('Gebruik/Weg', manuals)).toContain('no page "Weg"')
    expect(topicProblem('Weg/Mappen', manuals)).toContain('no manual "Weg"')
  })

  it('are found on a title, the app\'s own title component, a button and a call', () => {
    expect(findHelpTopics(srcDir).map((f) => [f.file, f.kind, f.topic]).sort()).toEqual([
      ['views/Folder.vue', 'button', 'Gebruik/Mappen#een-bestand'],
      ['views/Header.vue', 'forward', null],
      ['views/List.vue', 'title', 'Gebruik/Dossiers#zoeken'],
      ['views/Types.vue', 'title', 'Beheer#rollen'],
      ['views/links.ts', 'call', 'Beheer#rollen'],
    ])
  })
})

describe('the check an app runs', () => {
  /** The check over the fixture source, with these lone buttons allowed. */
  function check(allowedButtons: Record<string, string>, forwarders: Record<string, string> = { 'views/Header.vue': 'the title row' }) {
    return checkHelpTopics({ srcDir, root, language: 'nl', manuals: ['Gebruik', 'Beheer'], allowedButtons, forwarders })
  }

  it('passes when every topic exists and every lone button and forwarder is listed', () => {
    expect(check({ 'views/Folder.vue': 'a panel without a title' })).toEqual([])
  })

  it('asks for the reason behind a lone button', () => {
    expect(check({})).toEqual([expect.stringContaining('views/Folder.vue: a lone help button')])
  })

  it('asks what a component that passes a topic on is', () => {
    expect(check({ 'views/Folder.vue': 'x' }, {})).toEqual([expect.stringContaining('views/Header.vue: passes a help topic on')])
  })

  it('reports a listed file that has no button any more', () => {
    expect(check({ 'views/Folder.vue': 'x', 'views/Gone.vue': 'y' })).toEqual([expect.stringContaining('views/Gone.vue: listed in allowedButtons')])
  })
})

describe('the Vite plugin', () => {
  it('serves an index of the manuals and a page per chunk', async () => {
    const plugin = dcnManuals({ root, manuals: ['Gebruik'], languages: ['nl'] }) as unknown as {
      resolveId: (id: string) => string | null
      load: (this: { addWatchFile: () => void }, id: string) => string | null
    }
    const ctx = { addWatchFile: () => {} }
    const index = plugin.load.call(ctx, plugin.resolveId('virtual:dcn-manuals')!)!
    expect(index).toContain('"sourceLanguage":"nl"')
    expect(index).toContain('"nl:Gebruik/Mappen": () => import("virtual:dcn-manuals/page/nl/Gebruik%2FMappen")')
    const chunk = plugin.load.call(ctx, plugin.resolveId('virtual:dcn-manuals/page/nl/Gebruik%2FMappen')!)!
    expect(chunk).toMatch(/^export default ".*de-map-openen/)
  })

  it('fails the build on a broken link', () => {
    const plugin = dcnManuals({ root, manuals: ['Gebruik'], languages: ['nl', 'de'] }) as unknown as {
      configResolved: (c: { command: string }) => void
      buildStart: (this: { addWatchFile: () => void, error: (m: string) => never, warn: (m: string) => void }) => void
    }
    plugin.configResolved({ command: 'build' })
    expect(() => plugin.buildStart.call({
      addWatchFile: () => {},
      error: (m: string) => { throw new Error(m) },
      warn: () => {},
    })).toThrow('de: no manuals')
  })
})
