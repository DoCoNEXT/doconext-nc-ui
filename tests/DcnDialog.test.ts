// @vitest-environment jsdom
/**
 * DcnDialog against the real NcDialog: what it promises is that every prop,
 * event and slot of NcDialog still arrives, with `dcn-dialog` added.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import DcnDialog from '../src/components/DcnDialog.vue'

let wrapper: VueWrapper | null = null
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

/**
 * Mounted open; NcDialog teleports to <body>, so the tests look there.
 * @param options what to mount with
 * @param options.props props and attributes beside the title
 * @param options.slots slot contents
 */
async function open({ props = {}, slots = {} }: { props?: Record<string, unknown>, slots?: Record<string, string> } = {}) {
  wrapper = mount(DcnDialog, {
    props: { name: 'New customer', open: true, ...props },
    slots,
    attachTo: document.body,
  })
  await nextTick()
  await nextTick()
  return wrapper
}

describe('DcnDialog', () => {
  it('is an NcDialog with the dcn-dialog class and the title', async () => {
    await open()
    const dialog = document.querySelector('.dcn-dialog')
    expect(dialog).not.toBeNull()
    expect(document.body.textContent).toContain('New customer')
  })

  /*
   * Do:     pass dialogClasses of the app's own.
   * Expect: they are there beside dcn-dialog, not instead of it.
   * Why:    the look keys off dcn-dialog; losing it loses the look.
   */
  it('keeps dcn-dialog beside the app\'s own classes', async () => {
    await open({ props: { dialogClasses: 'invoice-dialog' } })
    const dialog = document.querySelector('.dcn-dialog')
    expect(dialog?.classList.contains('invoice-dialog')).toBe(true)
  })

  it('passes the default and the actions slot through', async () => {
    await open({
      slots: {
        default: '<p class="test-body">Name and address</p>',
        actions: '<button class="test-action">Save</button>',
      },
    })
    expect(document.querySelector('.dcn-dialog .test-body')?.textContent).toBe('Name and address')
    expect(document.querySelector('.dcn-dialog .test-action')?.textContent).toBe('Save')
  })

  /*
   * Do:     close the dialog through NcDialog (its update:open event).
   * Expect: the event reaches the app's listener.
   * Why:    with inheritAttrs off, a listener only arrives through v-bind="$attrs".
   */
  it('passes NcDialog\'s events through', async () => {
    const closes: unknown[] = []
    const w = await open({ props: { 'onUpdate:open': (value: unknown) => closes.push(value) } })
    w.findComponent({ name: 'NcDialog' }).vm.$emit('update:open', false)
    expect(closes).toEqual([false])
  })
})
