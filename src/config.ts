/**
 * What the package needs to know about the app it runs in: its id, so a
 * browser-kept preference (a collapsed navigation, a panel's width) is
 * remembered per app. Several DoCoNEXT apps share one Nextcloud session's
 * localStorage, and each keeps its own.
 */
let appId: string | null = null

/** Called once, before the first component mounts: `configure({ appId: APP_ID })`. */
export function configure(options: { appId: string }): void {
  appId = options.appId
}

/** The localStorage key for one of the app's layout preferences. */
export function storageKey(name: string): string {
  if (appId === null) {
    throw new Error('@doconext/nc-ui: call configure({ appId }) before using it')
  }
  return `${appId}-${name}`
}

/** For tests only. */
export function resetConfig(): void {
  appId = null
}
