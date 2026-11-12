// @vitest-environment jsdom
/**
 * DcnSettingsNavigation against the real NcAppNavigation: the settings pages
 * as items, the one that is open marked, and both ways of moving — a router's
 * `to`, or the events for an app that switches views itself.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import DcnSettingsNavigation from '../src/components/DcnSettingsNavigation.vue'
import { configure, resetConfig } from '../src/config'
import type { SettingsTab } from '../src/types'

const Icon = defineComponent({ render: () => h('svg') })

/**
 * vue-router's link as NcAppNavigationItem uses it (`custom`, with a scoped
 * slot): it renders the slot, and remembers where it pointed.
 */
const RouterLink = defineComponent({
  props: { to: { type: [String, Object], required: true } },
  setup(props, { slots }) {
    return () => h('div', { 'data-to': JSON.stringify(props.to) }, slots.default?.({
      href: '#',
      navigate: () => {},
      isActive: false,
      isExactActive: false,
    }))
  },
})

const TABS: SettingsTab[] = [
  { id: 'general', label: 'General', icon: Icon },
  { id: 'lists', label: 'Option lists', icon: Icon },
]

let wrapper: VueWrapper | null = null
beforeEach(() => {
  // The rail toggle keeps its state per app.
  configure({ appId: 'test' })
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  resetConfig()
  localStorage.clear()
})

/**
 * @param props what the navigation gets besides its tabs
 */
function render(props: Record<string, unknown> = {}) {
  wrapper = mount(DcnSettingsNavigation, {
    props: { tabs: TABS, active: 'general', ...props },
    global: { stubs: { RouterLink, 'router-link': RouterLink } },
    attachTo: document.body,
  })
  return wrapper
}

/** The navigation's items by their visible name, the way back last. */
function item(w: VueWrapper, name: string) {
  const found = w.findAll('.app-navigation-entry').find((e) => e.text().includes(name))
  if (!found) {
    throw new Error(`no item "${name}"`)
  }
  return found
}

describe('DcnSettingsNavigation', () => {
  it('lists the settings pages, and marks the open one', () => {
    const w = render({ active: 'lists' })
    expect(item(w, 'General').classes()).not.toContain('active')
    expect(item(w, 'Option lists').classes()).toContain('active')
  })

  /*
   * Do:     choose a tab, and the way back, without any `to`.
   * Expect: `select` with the tab's id, and `back`.
   * Why:    an app without a router (CRM) switches its view on these.
   */
  it('emits select and back when nothing carries a to', async () => {
    const w = render()
    await item(w, 'Option lists').find('a').trigger('click')
    await item(w, 'Leave settings').find('a').trigger('click')
    expect(w.emitted('select')).toEqual([['lists']])
    expect(w.emitted('back')).toEqual([[]])
  })

  /*
   * Do:     give the tabs and the way back a `to`.
   * Expect: router links to those places, and no events on a click.
   * Why:    with a router the link does the moving; an event as well would
   *         make an app that listens anyway move twice.
   */
  it('links where a to is given, and emits nothing then', async () => {
    const w = render({
      tabs: TABS.map((tab) => ({ ...tab, to: { name: 'settings', params: { tab: tab.id } } })),
      backTo: { name: 'home' },
    })
    expect(w.find('[data-to*="lists"]').exists()).toBe(true)
    expect(w.find('[data-to*="home"]').exists()).toBe(true)
    await item(w, 'Option lists').find('a').trigger('click')
    await item(w, 'Leave settings').find('a').trigger('click')
    expect(w.emitted('select')).toBeUndefined()
    expect(w.emitted('back')).toBeUndefined()
  })

  /*
   * Do:     configure a `t`, and leave the labels out.
   * Expect: the package's words, through it.
   * Why:    the package has no catalogue of its own; the app's carries them.
   */
  it('says its own words in the app\'s language', () => {
    configure({ appId: 'test', t: (text) => `«${text}»` })
    const w = render()
    expect(w.find('nav').attributes('aria-label')).toBe('«Settings»')
    expect(w.text()).toContain('«Leave settings»')
  })

  it('takes the app\'s own back label', () => {
    const w = render({ backLabel: 'Back to the CRM' })
    expect(w.text()).toContain('Back to the CRM')
    expect(w.text()).not.toContain('Leave settings')
  })

  it('puts the header slot in the header row, before the rail toggle', () => {
    wrapper = mount(DcnSettingsNavigation, {
      props: { tabs: TABS, active: 'general' },
      slots: { header: '<span class="realm-switcher">Realm</span>' },
      attachTo: document.body,
    })
    expect(wrapper.find('.realm-switcher').exists()).toBe(true)
  })
})
