/**
 * What the package needs to know about the app it runs in:
 *
 * - its id, so a browser-kept preference (a collapsed navigation, a panel's
 *   width) is remembered per app — several DoCoNEXT apps share one Nextcloud
 *   session's localStorage, and each keeps its own;
 * - its translate function, for the few words the package says itself
 *   ("Loading…"). The package ships no translations of its own: the key is the
 *   English text, and the app's catalogue carries it like its other strings.
 */
type Translate = (text: string) => string

let appId: string | null = null
let translateFn: Translate = (text) => text

/** Called once, before the first component mounts: `configure({ appId: APP_ID, t })`. */
export function configure(options: { appId: string, t?: Translate }): void {
  appId = options.appId
  if (options.t) {
    translateFn = options.t
  }
}

/** The localStorage key for one of the app's layout preferences. */
export function storageKey(name: string): string {
  if (appId === null) {
    throw new Error('@doconext/nc-ui: call configure({ appId }) before using it')
  }
  return `${appId}-${name}`
}

/** One of the package's own words, in the app's language; English without a `t`. */
export function translate(text: string): string {
  return translateFn(text)
}

/** For tests only. */
export function resetConfig(): void {
  appId = null
  translateFn = (text) => text
}
