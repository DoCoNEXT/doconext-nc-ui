// @vitest-environment jsdom
/**
 * DcnPrincipalPicker against the real NcSelect. The tests speak to NcSelect
 * through its own events (search, update:modelValue) rather than by typing
 * into vue-select's markup: what the picker promises is what it does with
 * them — when it searches, what it offers, what it emits.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import { NcSelect } from '@nextcloud/vue'
import DcnPrincipalPicker from '../src/components/DcnPrincipalPicker.vue'
import { configure, resetConfig } from '../src/config'
import type { DcnPrincipal } from '../src/types'

const ADMIN_USER: DcnPrincipal = { type: 'user', id: 'admin', displayName: 'Admin' }
const ADMIN_GROUP: DcnPrincipal = { type: 'group', id: 'admin', displayName: 'admin' }
const TEAM: DcnPrincipal = { type: 'circle', id: 'c1', displayName: 'Sales' }

let wrapper: VueWrapper | null = null

beforeEach(() => {
  vi.useFakeTimers()
  configure({ appId: 'test' })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.useRealTimers()
  resetConfig()
  document.body.innerHTML = ''
})

type Props = InstanceType<typeof DcnPrincipalPicker>['$props']

function render(props: Props) {
  wrapper = mount(DcnPrincipalPicker, { props, attachTo: document.body })
  return wrapper
}

function select(w: VueWrapper) {
  return w.findComponent(NcSelect)
}

/** Types `text` and lets the debounce and the search finish. */
async function type(w: VueWrapper, text: string) {
  select(w).vm.$emit('search', text)
  await vi.advanceTimersByTimeAsync(300)
  await flushPromises()
}

/** One of NcSelect's props, as the picker set it. */
function selectProp(w: VueWrapper, name: string): unknown {
  return (select(w).props() as Record<string, unknown>)[name]
}

function offered(w: VueWrapper): Array<{ id: string, principal: DcnPrincipal }> {
  return selectProp(w, 'options') as Array<{ id: string, principal: DcnPrincipal }>
}

describe('DcnPrincipalPicker', () => {
  /*
   * Do:     type three letters in quick succession.
   * Expect: one search, for the whole word, after the pause.
   * Why:    a search per keystroke hammers the directory for nothing.
   */
  it('searches once typing pauses', async () => {
    const search = vi.fn().mockResolvedValue([])
    const w = render({ search })
    select(w).vm.$emit('search', 'a')
    select(w).vm.$emit('search', 'ad')
    select(w).vm.$emit('search', 'adm')
    await vi.advanceTimersByTimeAsync(299)
    expect(search).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(search).toHaveBeenCalledTimes(1)
    expect(search).toHaveBeenCalledWith('adm')
  })

  /*
   * Do:     find a user and a group that are both called admin.
   * Expect: both are offered, as separate options.
   * Why:    vue-select tells options apart by id; on the bare id one would hide the other.
   */
  it('keeps a user and a group with the same id apart', async () => {
    const w = render({ search: vi.fn().mockResolvedValue([ADMIN_USER, ADMIN_GROUP]) })
    await type(w, 'admin')
    expect(offered(w).map(o => o.id)).toEqual(['user:admin', 'group:admin'])
  })

  /*
   * Do:     a slow search for "a" answers after a quick one for "ab".
   * Expect: the list shows what "ab" found.
   * Why:    the list must match what is in the field, not what came back last.
   */
  it('ignores an answer that a later search overtook', async () => {
    let answerSlow: (v: DcnPrincipal[]) => void = () => {}
    const search = vi.fn()
      .mockImplementationOnce(() => new Promise(resolve => { answerSlow = resolve }))
      .mockResolvedValueOnce([TEAM])
    const w = render({ search, kinds: ['circle'] })
    await type(w, 'a')
    await type(w, 'ab')
    answerSlow([ADMIN_USER])
    await flushPromises()
    expect(offered(w).map(o => o.id)).toEqual(['circle:c1'])
  })

  it('emits the picked principal without multiple', async () => {
    const w = render({ search: vi.fn().mockResolvedValue([ADMIN_GROUP]) })
    await type(w, 'adm')
    select(w).vm.$emit('update:modelValue', offered(w)[0])
    expect(w.emitted('select')).toEqual([[ADMIN_GROUP]])
    await nextTick()
    expect(offered(w)).toEqual([])
  })

  /*
   * Do:     with multiple, search for someone who is already chosen.
   * Expect: they are not offered again, and a pick emits the whole selection.
   */
  it('keeps the selection with multiple', async () => {
    const w = render({
      search: vi.fn().mockResolvedValue([ADMIN_USER, ADMIN_GROUP]),
      multiple: true,
      modelValue: [ADMIN_USER],
    })
    await type(w, 'admin')
    expect(offered(w).map(o => o.id)).toEqual(['group:admin'])
    const current = selectProp(w, 'modelValue') as unknown[]
    select(w).vm.$emit('update:modelValue', [...current, offered(w)[0]])
    expect(w.emitted('update:modelValue')).toEqual([[[ADMIN_USER, ADMIN_GROUP]]])
  })

  /*
   * Do:     bind v-model to one principal, pick another, then clear the field.
   * Expect: the field shows the bound one; the pick and the clearing come out as update:modelValue.
   * Why:    an owner stays in its field, unlike a grant that is added to a list elsewhere.
   */
  it('holds one principal with v-model', async () => {
    const w = render({ search: vi.fn().mockResolvedValue([ADMIN_GROUP]), modelValue: ADMIN_USER })
    expect((selectProp(w, 'modelValue') as { id: string }).id).toBe('user:admin')
    await type(w, 'adm')
    select(w).vm.$emit('update:modelValue', offered(w)[0])
    select(w).vm.$emit('update:modelValue', null)
    expect(w.emitted('update:modelValue')).toEqual([[ADMIN_GROUP], [null]])
    expect(w.emitted('select')).toEqual([[ADMIN_GROUP]])
  })

  it('says a Group or a Team beneath its name, never "circle"', async () => {
    const w = render({ search: vi.fn().mockResolvedValue([ADMIN_GROUP, TEAM]), kinds: ['group', 'circle'] })
    await type(w, 's')
    expect(offered(w).map(o => (o as unknown as { subname: string }).subname)).toEqual(['Group', 'Team'])
  })

  it('promises in its placeholder what the search returns', () => {
    expect(selectProp(render({ search: vi.fn() }), 'placeholder')).toBe('Search users or groups…')
    wrapper?.unmount()
    expect(selectProp(render({ search: vi.fn(), kinds: ['user', 'group', 'circle'] }), 'placeholder')).toBe('Search users, groups or Teams…')
    wrapper?.unmount()
    expect(selectProp(render({ search: vi.fn(), placeholder: 'Assign to…' }), 'placeholder')).toBe('Assign to…')
  })

  /*
   * Do:     open the picker before typing, then type something nobody is called.
   * Expect: first "Type a name to search", then "No matches".
   * Why:    "No matches" before anyone typed reads as a search that found nothing.
   */
  it('tells an empty field from a search that found nothing', async () => {
    const w = render({ search: vi.fn().mockResolvedValue([]) })
    // vue-select opens on a mousedown that jsdom's focus handling does not
    // carry through; open it as that mousedown would.
    const vueSelect = select(w).findComponent({ name: 'VueSelect' }) as unknown as { vm: { open: boolean } }
    vueSelect.vm.open = true
    await flushPromises()
    expect(document.body.textContent).toContain('Type a name to search')
    await type(w, 'zz')
    expect(document.body.textContent).toContain('No matches')
  })

  it('leaves a trace when the search fails, and offers nothing', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const w = render({ search: vi.fn().mockRejectedValue(new Error('down')) })
    await type(w, 'adm')
    expect(offered(w)).toEqual([])
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})
