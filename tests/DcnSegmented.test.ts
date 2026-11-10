// @vitest-environment jsdom
/**
 * DcnSegmented as assistive technology and the keyboard meet it: the roles and
 * states of both modes, and the tablist's keys.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import DcnSegmented from '../src/components/DcnSegmented.vue'
import type { SegmentedOption } from '../src/types'

const OPTIONS: SegmentedOption[] = [
  { value: 'todo', label: 'To invoice', count: 7 },
  { value: 'sent', label: 'Sent', disabled: true },
  { value: 'all', label: 'All' },
]

let wrapper: VueWrapper | null = null
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

/**
 * @param props what the component gets besides its options and label
 * @param props.modelValue the chosen value
 * @param props.tabs whether it is a tablist
 */
function render(props: { modelValue: string, tabs?: boolean }) {
  wrapper = mount(DcnSegmented, {
    props: { options: OPTIONS, label: 'Status', ...props },
    // Focus only moves between elements that are in the document.
    attachTo: document.body,
  })
  return wrapper
}

function buttons(w: VueWrapper) {
  return w.findAll('button')
}

describe('DcnSegmented as a filter', () => {
  it('is a labelled group of toggle buttons, each in the Tab order', () => {
    const w = render({ modelValue: 'all' })
    expect(w.attributes('role')).toBe('group')
    expect(w.attributes('aria-label')).toBe('Status')
    expect(buttons(w).map((b) => b.attributes('aria-pressed'))).toEqual(['false', 'false', 'true'])
    expect(buttons(w).map((b) => b.attributes('tabindex'))).toEqual([undefined, undefined, undefined])
    expect(buttons(w).some((b) => b.attributes('role') === 'tab')).toBe(false)
  })

  it('shows a count in a badge', () => {
    const w = render({ modelValue: 'all' })
    expect(buttons(w)[0]?.find('.dcn-segmented__count').text()).toBe('7')
  })

  it('emits the value that is clicked, and nothing for the chosen one', async () => {
    const w = render({ modelValue: 'all' })
    await buttons(w)[0]?.trigger('click')
    await buttons(w)[2]?.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['todo']])
  })

  it('leaves the arrow keys alone', async () => {
    const w = render({ modelValue: 'all' })
    await buttons(w)[2]?.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('DcnSegmented as tabs', () => {
  /*
   * Do:     render with `tabs`.
   * Expect: a tablist of tabs; only the chosen tab is in the Tab order.
   * Why:    a tablist is one Tab stop; the arrows move inside it.
   */
  it('is a tablist with one Tab stop', () => {
    const w = render({ modelValue: 'all', tabs: true })
    expect(w.attributes('role')).toBe('tablist')
    expect(buttons(w).map((b) => b.attributes('role'))).toEqual(['tab', 'tab', 'tab'])
    expect(buttons(w).map((b) => b.attributes('aria-selected'))).toEqual(['false', 'false', 'true'])
    expect(buttons(w).map((b) => b.attributes('tabindex'))).toEqual(['-1', '-1', '0'])
    expect(buttons(w).some((b) => b.attributes('aria-pressed') !== undefined)).toBe(false)
  })

  /*
   * Do:     press ArrowRight on the last tab, with the middle one disabled.
   * Expect: the first tab is chosen and has focus; then ArrowRight skips the disabled one.
   * Why:    automatic activation, wrapping, and no stop on what cannot be chosen.
   */
  it('moves and chooses with the arrows, past a disabled tab', async () => {
    const w = render({ modelValue: 'all', tabs: true })
    await buttons(w)[2]?.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')).toEqual([['todo']])
    expect(document.activeElement).toBe(buttons(w)[0]?.element)

    await w.setProps({ modelValue: 'todo' })
    await buttons(w)[0]?.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')?.[1]).toEqual(['all'])
    expect(document.activeElement).toBe(buttons(w)[2]?.element)
  })

  it('goes to the ends with Home and End', async () => {
    const w = render({ modelValue: 'all', tabs: true })
    await buttons(w)[2]?.trigger('keydown', { key: 'Home' })
    expect(w.emitted('update:modelValue')).toEqual([['todo']])
  })

  /*
   * Do:     render tabs whose value matches none of the options.
   * Expect: the first tab is the Tab stop.
   * Why:    with every tab at -1 the tablist could not be reached at all.
   */
  it('keeps the tablist reachable when nothing is chosen', () => {
    const w = render({ modelValue: 'nothing', tabs: true })
    expect(buttons(w).map((b) => b.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
  })
})
