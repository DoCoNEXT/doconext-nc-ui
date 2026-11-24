// @vitest-environment jsdom
/**
 * The help in the browser: which manuals a reader is shown, in which language,
 * the installation's own words in the text, the panel's history, and the
 * button that opens it — or, with no panel on the page, the help page.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { applyTerms, configureHelp, helpUrl, openHelp, registerPanelHost, resetHelp, resolveTopic, useHelp } from '../src/help/state'
import type { HelpIndex, HelpOptions } from '../src/help/types'
import DcnHelpButton from '../src/components/DcnHelpButton.vue'
import DcnPageTitle from '../src/components/DcnPageTitle.vue'

/** A page's entry in the index. */
function meta(id: string, title: string, headings: string[] = []) {
  return { id, name: id.split('/')[1]!, title, headings: headings.map((h) => ({ level: 2, text: h, id: h })) }
}

const index: HelpIndex = {
  sourceLanguage: 'nl',
  languages: {
    nl: [
      { id: 'Gebruik', title: 'Handleiding', start: meta('Gebruik/Readme', 'Handleiding'), pages: [meta('Gebruik/Mappen', 'Mappen', ['de-map-openen'])] },
      { id: 'Beheer', title: 'Beheer', start: meta('Beheer/Readme', 'Beheer'), pages: [] },
    ],
    en: [
      { id: 'Gebruik', title: 'Manual', start: meta('Gebruik/Readme', 'Manual'), pages: [meta('Gebruik/Mappen', 'Folders', ['opening'])] },
    ],
  },
}

function setup(overrides: Partial<HelpOptions> = {}) {
  configureHelp({
    index,
    loadPage: async () => '<p>DoCoNEXT</p>',
    language: 'nl_NL',
    manuals: ['Gebruik'],
    pageUrl: (t) => `/help/${t.manual}/${t.page}${t.section ? `?section=${t.section}` : ''}`,
    ...overrides,
  })
}

beforeEach(() => setup())
afterEach(() => {
  resetHelp()
  document.body.innerHTML = ''
})

describe('which manuals a reader is shown', () => {
  it('only those the app names, so an administrators\' manual stays out of a user\'s help', () => {
    expect(useHelp().manuals.value.map((m) => m.id)).toEqual(['Gebruik'])
    expect(resolveTopic('Beheer')).toBeNull()
  })

  it('in the reader\'s language when it exists', () => {
    setup({ language: 'en' })
    expect(resolveTopic('Gebruik/Mappen')?.page.title).toBe('Folders')
    expect(resolveTopic('Gebruik/Mappen')?.fallback).toBe(false)
  })

  it('in the source language when theirs has none, and says so', () => {
    setup({ language: 'de_DE' })
    const resolved = resolveTopic('Gebruik/Mappen#de-map-openen')
    expect(resolved?.page.title).toBe('Mappen')
    expect(resolved?.fallback).toBe(true)
    expect(resolved?.target.section).toBe('de-map-openen')
  })

  it('opens a translated page at the top, since its anchors are its own', () => {
    setup({ language: 'en' })
    expect(resolveTopic('Gebruik/Mappen#de-map-openen')?.target.section).toBeNull()
  })
})

describe('the installation\'s own words', () => {
  it('replace the product name in the text, the longer name first', () => {
    const terms = { 'DoCoNEXT Core': 'Zaken', DoCoNEXT: 'Zaken' }
    expect(applyTerms('<p>In DoCoNEXT Core en DoCoNEXT.</p>', terms)).toBe('<p>In Zaken en Zaken.</p>')
  })

  it('never inside a tag, and never inside a longer word', () => {
    const html = '<a href="https://doconext.com/DoCoNEXT">DoCoNEXTs DoCoNEXT</a>'
    expect(applyTerms(html, { DoCoNEXT: 'Zaken' })).toBe('<a href="https://doconext.com/DoCoNEXT">DoCoNEXTs Zaken</a>')
  })

  it('escape what they put in', () => {
    expect(applyTerms('<p>DoCoNEXT</p>', { DoCoNEXT: 'A & <B>' })).toBe('<p>A &amp; &lt;B&gt;</p>')
  })
})

describe('the panel', () => {
  it('opens on a topic, goes back through the topics before it, and closes', () => {
    const release = registerPanelHost()
    const help = useHelp()
    openHelp('Gebruik/Mappen')
    openHelp('Gebruik')
    expect(help.topic.value).toBe('Gebruik')
    expect(help.canGoBack.value).toBe(true)
    help.back()
    expect(help.topic.value).toBe('Gebruik/Mappen')
    help.close()
    expect(help.topic.value).toBeNull()
    release()
  })

  it('opens nothing for a topic the reader is not shown', () => {
    const release = registerPanelHost()
    openHelp('Beheer')
    expect(useHelp().topic.value).toBeNull()
    release()
  })

  it('without a panel on the page, opens the help page in a new tab', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    openHelp('Gebruik/Mappen#de-map-openen')
    expect(open).toHaveBeenCalledWith('/help/Gebruik/Mappen?section=de-map-openen', '_blank', 'noopener')
    open.mockRestore()
  })

  it('"Open as page" hands the topic to the app\'s router and closes', () => {
    const openPage = vi.fn()
    setup({ openPage })
    const release = registerPanelHost()
    openHelp('Gebruik/Mappen#de-map-openen')
    useHelp().openAsPage()
    expect(openPage).toHaveBeenCalledWith({ manual: 'Gebruik', page: 'Mappen', section: 'de-map-openen' })
    expect(useHelp().topic.value).toBeNull()
    release()
  })

  it('gives the help page\'s address for a link from outside the app', () => {
    expect(helpUrl('Gebruik/Mappen')).toBe('/help/Gebruik/Mappen')
    expect(helpUrl('Beheer')).toBe('')
  })
})

describe('the help button', () => {
  it('is not drawn for a topic the reader is not shown', () => {
    const wrapper = mount(DcnHelpButton, { props: { topic: 'Beheer' } })
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('toggles the panel when there is one', async () => {
    const release = registerPanelHost()
    const wrapper = mount(DcnHelpButton, { props: { topic: 'Gebruik/Mappen' } })
    await wrapper.find('button').trigger('click')
    expect(useHelp().topic.value).toBe('Gebruik/Mappen')
    await nextTick()
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('true')
    await wrapper.find('button').trigger('click')
    expect(useHelp().topic.value).toBeNull()
    release()
  })

  it('is a link to the help page, in a new tab, when there is no panel', () => {
    const wrapper = mount(DcnHelpButton, { props: { topic: 'Gebruik/Mappen' } })
    const link = wrapper.find('a')
    expect(link.attributes('href')).toBe('/help/Gebruik/Mappen')
    expect(link.attributes('target')).toBe('_blank')
  })

  it('sits beside a page title that names a topic, and nowhere else', () => {
    const withHelp = mount(DcnPageTitle, { props: { help: 'Gebruik/Mappen' }, slots: { default: 'Zaken' } })
    expect(withHelp.find('.dcn-page-title-row h2.dcn-page-title').text()).toBe('Zaken')
    expect(withHelp.find('.dcn-help-button').exists()).toBe(true)
    const without = mount(DcnPageTitle, { slots: { default: 'Zaken' } })
    expect(without.element.tagName).toBe('H2')
    expect(without.find('.dcn-help-button').exists()).toBe(false)
  })
})
