/**
 * The keyboard of a tablist, after the ARIA Authoring Practices' Tabs pattern
 * with automatic activation: the arrows move to the previous or next tab and
 * choose it, Home and End go to the first and the last. Disabled tabs are
 * skipped, and the arrows wrap around.
 *
 * A pure function of the tabs' disabled states, so it can be tested without a
 * DOM.
 * @param disabled per tab, whether it is disabled
 * @param from the index of the tab that has focus
 * @param key `KeyboardEvent.key`
 * @param rtl whether the tabs run right to left, which turns the arrows round
 * @return the index to move to, or null when the key is not a tablist key
 */
export function nextTab(disabled: boolean[], from: number, key: string, rtl = false): number | null {
  const enabled = disabled.flatMap((off, index) => (off ? [] : [index]))
  const first = enabled[0]
  const last = enabled.at(-1)
  if (first === undefined || last === undefined) {
    return null
  }

  const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
  const back = rtl ? 'ArrowRight' : 'ArrowLeft'
  switch (key) {
    case 'Home': return first
    case 'End': return last
    case forward: return enabled.find((index) => index > from) ?? first
    case back: return enabled.findLast((index) => index < from) ?? last
    default: return null
  }
}

/**
 * The one tab that is in the Tab order: the chosen one, or the first that is
 * enabled when nothing is chosen, so the tablist can always be reached.
 * @param disabled per tab, whether it is disabled
 * @param selected the index of the chosen tab, or -1
 */
export function focusableTab(disabled: boolean[], selected: number): number {
  if (selected >= 0 && !disabled[selected]) {
    return selected
  }
  return disabled.findIndex((off) => !off)
}
