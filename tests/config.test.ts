import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { fakeStorage } from './storage'

// One phone-or-not for the whole file; a test that needs a phone sets it.
const mobile = vi.hoisted(() => ({ value: false }))
vi.mock('@nextcloud/vue', () => ({ useIsMobile: () => ref(mobile.value) }))

/** The package's configuration and rail, fresh: each app on the page is its own module instance. */
async function load() {
  const config = await import('../src/config')
  const rail = await import('../src/composables/useNavigationRail')
  return { configure: config.configure, useNavigationRail: rail.useNavigationRail }
}

describe('configure', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('window', { localStorage: fakeStorage() })
  })
  afterEach(() => vi.unstubAllGlobals())

  /*
   * Do:     use the package before telling it which app it runs in.
   * Expect: an error that says what to call.
   * Why:    a preference stored under no app id would be shared by every
   *         DoCoNEXT app in the session, and silently overwrite theirs.
   */
  it('refuses a storage key before configure()', async () => {
    const { storageKey } = await import('../src/config')
    expect(() => storageKey('navigation-rail')).toThrow(/configure/)
  })

  it('keys a preference by app', async () => {
    const { configure, storageKey } = await import('../src/config')
    configure({ appId: 'doconext_time' })
    expect(storageKey('sidebar-width')).toBe('doconext_time-sidebar-width')
  })

  /*
   * Do:     collapse the rail in one app, then read it in another.
   * Expect: the other app's rail is still open; the first remembers its own.
   * Why:    two apps share one Nextcloud session's localStorage.
   */
  it('remembers the rail per app', async () => {
    const storage = fakeStorage()
    vi.stubGlobal('window', { localStorage: storage })

    const time = await load()
    time.configure({ appId: 'doconext_time' })
    const rail = time.useNavigationRail()
    rail.toggleRail()
    expect(rail.railed.value).toBe(true)
    expect(storage.getItem('doconext_time-navigation-rail')).toBe('collapsed')

    vi.resetModules()
    const crm = await load()
    crm.configure({ appId: 'doconext_crm' })
    expect(crm.useNavigationRail().railed.value).toBe(false)

    vi.resetModules()
    const timeAgain = await load()
    timeAgain.configure({ appId: 'doconext_time' })
    expect(timeAgain.useNavigationRail().railed.value).toBe(true)
  })

  /*
   * Do:     use the rail without configure().
   * Expect: the error that says what to call.
   * Why:    caught along with blocked storage, the mistake passed silently and
   *         the rail never remembered anything.
   */
  it('says so when the rail is used before configure()', async () => {
    const { useNavigationRail } = await load()
    expect(() => useNavigationRail()).toThrow(/configure/)
  })

  /*
   * Do:     collapse the rail, then read it on a phone.
   * Expect: not railed, and no rail offered; the choice is still stored.
   * Why:    there the navigation is an overlay, and a rail would cover the page.
   */
  it('keeps out of the way on a phone', async () => {
    const storage = fakeStorage()
    storage.setItem('doconext_time-navigation-rail', 'collapsed')
    vi.stubGlobal('window', { localStorage: storage })
    mobile.value = true
    try {
      const app = await load()
      app.configure({ appId: 'doconext_time' })
      const rail = app.useNavigationRail()
      expect(rail.canRail.value).toBe(false)
      expect(rail.railed.value).toBe(false)
      expect(rail.railClass.value).toEqual({ 'app--rail': false })
    } finally {
      mobile.value = false
    }
  })
})

describe('translate', () => {
  beforeEach(() => vi.resetModules())

  it('says its own words in English until the app hands over its t', async () => {
    const config = await import('../src/config')
    expect(config.translate('Loading…')).toBe('Loading…')
    config.configure({ appId: 'doconext_time', t: (text) => (text === 'Loading…' ? 'Laden…' : text) })
    expect(config.translate('Loading…')).toBe('Laden…')
  })
})
