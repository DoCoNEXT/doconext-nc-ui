import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeStorage } from './storage'

/** <html> as the composable touches it: inline style, dir and class list. */
function fakeRoot(dir = '') {
  const properties = new Map<string, string>()
  const classes = new Set<string>()
  return {
    dir,
    properties,
    classes,
    style: {
      setProperty: (name: string, value: string) => { properties.set(name, value) },
      removeProperty: (name: string) => { properties.delete(name) },
    },
    classList: {
      add: (name: string) => { classes.add(name) },
      remove: (name: string) => { classes.delete(name) },
    },
  }
}

/** A key press as `nudge` reads it. */
function key(name: string) {
  return { key: name, preventDefault: vi.fn() } as unknown as KeyboardEvent
}

/** A pointer event as the drag handlers read it. */
function pointer(clientX: number) {
  return {
    clientX,
    pointerId: 1,
    currentTarget: { setPointerCapture: vi.fn() },
    preventDefault: vi.fn(),
  } as unknown as PointerEvent
}

/**
 * A fresh module (the state is module-level) in a window of the given width,
 * with the panel measured at 400px.
 * @param options the window and document to stub
 * @param options.innerWidth the window's width
 * @param options.dir the document's writing direction
 * @param options.storage the localStorage to use
 * @param options.appId the app id to configure, or null to leave it unset
 */
async function load({ innerWidth = 1600, dir = '', storage = fakeStorage(), appId = 'doconext_time' as string | null } = {}) {
  // Vue's DOM runtime touches document when it loads: load it before the stub.
  await import('vue')
  const root = fakeRoot(dir)
  vi.stubGlobal('window', {
    localStorage: storage,
    innerWidth,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
  vi.stubGlobal('document', {
    documentElement: root,
    getElementById: () => ({ getBoundingClientRect: () => ({ width: 400 }) }),
  })
  const config = await import('../src/config')
  if (appId !== null) {
    config.configure({ appId })
  }
  const { useSidebarResize } = await import('../src/composables/useSidebarResize')
  return { resize: useSidebarResize(), root, storage }
}

describe('useSidebarResize', () => {
  beforeEach(() => {
    vi.resetModules()
    // Outside a component, Vue warns that onMounted has no instance to attach to.
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('widens the panel with the arrow that points away from it, and remembers', async () => {
    const { resize, root, storage } = await load()
    resize.nudge(key('ArrowLeft'))
    expect(resize.width.value).toBe(416)
    expect(root.properties.get('--dcn-sidebar-width')).toBe('416px')
    expect(storage.getItem('doconext_time-sidebar-width')).toBe('416')
  })

  /*
   * Do:     press ArrowLeft in a right-to-left document.
   * Expect: the panel narrows.
   * Why:    there the panel hangs off the left edge, and the arrow points into it.
   */
  it('turns the arrows round right to left', async () => {
    const { resize } = await load({ dir: 'rtl' })
    resize.nudge(key('ArrowLeft'))
    expect(resize.width.value).toBe(384)
  })

  /*
   * Do:     press End in a window 1280px wide.
   * Expect: the panel stops at 860 (the page keeps 420), and maxWidth says 860.
   * Why:    the separator's maximum is read out; a fixed 1200 would be untrue.
   */
  it('stops at what the window allows, and reports that as its maximum', async () => {
    const { resize } = await load({ innerWidth: 1280 })
    resize.nudge(key('End'))
    expect(resize.width.value).toBe(860)
    expect(resize.maxWidth).toBe(860)
    resize.nudge(key('Home'))
    expect(resize.width.value).toBe(300)
  })

  it('gives the panel its own sizing back on Enter, and forgets', async () => {
    const { resize, root, storage } = await load()
    resize.nudge(key('ArrowLeft'))
    resize.nudge(key('Enter'))
    expect(root.properties.has('--dcn-sidebar-width')).toBe(false)
    expect(storage.getItem('doconext_time-sidebar-width')).toBeNull()
  })

  it('follows a drag and remembers where it was let go', async () => {
    const { resize, root, storage } = await load()
    resize.startResize(pointer(500))
    expect(resize.resizing.value).toBe(true)
    expect(root.classes.has('dcn-sidebar-resizing')).toBe(true)

    resize.resizeTo(pointer(400))
    expect(resize.width.value).toBe(500)

    resize.endResize()
    expect(resize.resizing.value).toBe(false)
    expect(root.classes.has('dcn-sidebar-resizing')).toBe(false)
    expect(storage.getItem('doconext_time-sidebar-width')).toBe('500')
  })

  /*
   * Do:     resize with a localStorage that throws (a private window).
   * Expect: the panel still moves; nothing is thrown.
   * Why:    a forgotten layout preference is not worth failing the app over.
   */
  it('still works when storage is blocked', async () => {
    const blocked = fakeStorage()
    blocked.getItem = () => { throw new Error('SecurityError') }
    blocked.setItem = () => { throw new Error('SecurityError') }
    const { resize } = await load({ storage: blocked })
    expect(() => resize.nudge(key('ArrowLeft'))).not.toThrow()
    expect(resize.width.value).toBe(416)
  })

  /*
   * Do:     use the composable without configure().
   * Expect: the error that says what to call.
   * Why:    caught along with blocked storage, the mistake passed silently and
   *         the width was never remembered.
   */
  it('says so when configure() was forgotten', async () => {
    const { resize } = await load({ appId: null })
    expect(() => resize.nudge(key('ArrowLeft'))).toThrow(/configure/)
  })
})
