// @vitest-environment jsdom
/**
 * DcnCard's element: one of a short list, whatever it is handed.
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DcnCard from '../src/components/DcnCard.vue'

describe('DcnCard', () => {
  it('is a div by default', () => {
    const wrapper = mount(DcnCard, { slots: { default: 'Total' } })
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toContain('dcn-card')
  })

  it('is the element it is asked to be, from the list', () => {
    for (const tag of ['section', 'article', 'aside', 'li'] as const) {
      expect(mount(DcnCard, { props: { tag } }).element.tagName).toBe(tag.toUpperCase())
    }
  })

  /*
   * Do:     pass `script` as the tag, as an app could from data the type check never saw.
   * Expect: a div, with the slot as its text.
   * Why:    <component :is> makes any element, and a <script> would run its slot as code.
   */
  it('falls back to a div for anything else', () => {
    const wrapper = mount(DcnCard, {
      props: { tag: 'script' as never },
      slots: { default: 'window.pwned = true' },
    })
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.text()).toBe('window.pwned = true')
    expect(document.querySelector('script.dcn-card')).toBeNull()
  })
})
