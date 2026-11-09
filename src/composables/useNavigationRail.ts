/**
 * Collapsing the app navigation to a rail of icons instead of hiding it.
 *
 * NcAppNavigation's own toggle takes the whole sidebar away: the buttons don't
 * shrink, they disappear, and with them any way to switch pages without opening
 * the sidebar back up. Every desktop file browser collapses to icons instead.
 *
 * The component has no rail mode and no `open` prop, and when it closes it marks
 * its <nav> `inert` and `aria-hidden` — correct for something that is gone,
 * wrong for something still on screen. So this does not use it: the navigation
 * is left permanently open and the collapsing is ours, which is why nothing here
 * has to observe the DOM, undo an ARIA attribute or out-shout a library rule.
 * The library's toggle is hidden by the accompanying stylesheet, and a rail
 * toggle (components/NavigationRailToggle.vue) takes its job.
 *
 * On mobile the navigation is an overlay rather than a column, and a permanent
 * rail would sit on top of the content — so there it keeps its normal
 * open/closed behaviour and this stays out of the way.
 *
 * `collapsed` is a module-level singleton rather than a fresh ref per call, so
 * App.vue's NcContent class and the toggle button always agree on live state.
 *
 * Ported from doconext_core (as is doconext_crm's), which took it from
 * doconext_finder (Nextcloud apps bundle their own JavaScript, so this is
 * copied rather than imported).
 */
import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { useIsMobile } from '@nextcloud/vue'
import { storageKey } from '../config'

/** The class the stylesheet keys off. Put it on NcContent. */
export const RAIL_CLASS = 'app--rail'

/**
 * A collapsed sidebar is expected to stay collapsed across reloads, and it is a
 * per-device layout preference, so it belongs in this browser rather than on
 * the account. Keyed by app id: several DoCoNEXT apps can share one Nextcloud
 * session's localStorage, and each remembers its own rail independently.
 */
function read(): boolean {
  // Outside the try: a missing configure() is the app's mistake and must say
  // so, not pass for blocked storage.
  const key = storageKey('navigation-rail')
  try {
    return window.localStorage.getItem(key) === 'collapsed'
  } catch {
    // Private windows and blocked site data throw on access; a forgotten
    // layout preference is not worth failing the app over.
    return false
  }
}

function write(value: boolean) {
  const key = storageKey('navigation-rail')
  try {
    window.localStorage.setItem(key, value ? 'collapsed' : 'expanded')
  } catch {
    // ignored on purpose — see above
  }
}

// Read once, on first use rather than at module load (the app id is set by
// then), and shared: every caller across the whole page must land on this same
// ref instance, not a copy of it.
let collapsed: Ref<boolean> | null = null

export function useNavigationRail() {
  collapsed ??= ref(read())
  const state = collapsed
  const isMobile = useIsMobile()

  /** A rail only makes sense where the navigation is a column beside content. */
  const canRail = computed(() => !isMobile.value)
  const railed = computed(() => state.value && canRail.value)
  const railClass = computed(() => ({ [RAIL_CLASS]: railed.value }))

  function toggleRail() {
    state.value = !state.value
    write(state.value)
  }

  return { railed, canRail, railClass, toggleRail }
}
