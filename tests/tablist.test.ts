import { describe, expect, it } from 'vitest'
import { focusableTab, nextTab } from '../src/tablist'

describe('nextTab', () => {
  const none = [false, false, false]

  it('moves with the arrows and wraps around', () => {
    expect(nextTab(none, 0, 'ArrowRight')).toBe(1)
    expect(nextTab(none, 2, 'ArrowRight')).toBe(0)
    expect(nextTab(none, 0, 'ArrowLeft')).toBe(2)
  })

  it('goes to the ends with Home and End', () => {
    expect(nextTab(none, 1, 'Home')).toBe(0)
    expect(nextTab(none, 1, 'End')).toBe(2)
  })

  /*
   * Do:     press an arrow next to a disabled tab, and Home when the first is disabled.
   * Expect: the disabled tab is passed over.
   * Why:    focus on a disabled tab is focus on something that cannot be chosen.
   */
  it('skips disabled tabs', () => {
    const middleOff = [false, true, false]
    expect(nextTab(middleOff, 0, 'ArrowRight')).toBe(2)
    expect(nextTab(middleOff, 2, 'ArrowLeft')).toBe(0)
    expect(nextTab([true, false, false], 2, 'Home')).toBe(1)
  })

  it('turns the arrows round right to left', () => {
    expect(nextTab(none, 0, 'ArrowLeft', true)).toBe(1)
    expect(nextTab(none, 0, 'ArrowRight', true)).toBe(2)
  })

  it('leaves other keys alone', () => {
    expect(nextTab(none, 0, 'Enter')).toBeNull()
    expect(nextTab(none, 0, 'Tab')).toBeNull()
    expect(nextTab([true, true], 0, 'ArrowRight')).toBeNull()
  })
})

describe('focusableTab', () => {
  it('is the chosen tab', () => {
    expect(focusableTab([false, false, false], 2)).toBe(2)
  })

  /*
   * Do:     render tabs with nothing chosen, or with the chosen one disabled.
   * Expect: the first enabled tab takes the Tab stop.
   * Why:    with every tab at tabindex -1 the tablist cannot be reached at all.
   */
  it('falls back to the first enabled tab', () => {
    expect(focusableTab([false, false], -1)).toBe(0)
    expect(focusableTab([true, false, false], 0)).toBe(1)
  })
})
