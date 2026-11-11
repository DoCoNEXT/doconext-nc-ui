// @vitest-environment jsdom
/**
 * DcnBadge: a tone, or an app's own colour in its place.
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DcnBadge from '../src/components/DcnBadge.vue'

describe('DcnBadge', () => {
  it('draws a tone', () => {
    const w = mount(DcnBadge, { props: { tone: 'success', dot: 'filled' }, slots: { default: 'Paid' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['dcn-badge', 'dcn-badge--success', 'dcn-badge--dot-filled']))
    expect(w.text()).toBe('Paid')
  })

  /*
   * Do:     give a colour beside a tone.
   * Expect: the colour, as the custom property the stylesheet tints from; no tone class.
   * Why:    a tone's background would cover the colour's tint.
   */
  it('lets a colour replace the tone', () => {
    const w = mount(DcnBadge, { props: { tone: 'success', color: 'var(--crm-blue)' } })
    expect(w.classes()).toContain('dcn-badge--color')
    expect(w.classes()).not.toContain('dcn-badge--success')
    expect((w.element as HTMLElement).style.getPropertyValue('--dcn-badge-color')).toBe('var(--crm-blue)')
  })
})
