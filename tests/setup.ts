/**
 * Runs before every test file.
 *
 * Under jsdom, `EventTarget` is jsdom's, not Node's. Since @nextcloud/vue 9.14
 * the library loads p-queue, which extends `EventTarget` and then calls Node's
 * `events.setMaxListeners` on itself, reached through
 * `process.getBuiltinModule` so that a browser skips it. Node accepts only its
 * own event targets there and throws on jsdom's, so a component test cannot
 * even import the library. In a browser the call never happens, so this is a
 * property of the test environment, not a defect to test for. The call only
 * silences Node's listener-count warning, so skipping it changes nothing the
 * tests look at.
 *
 * Typed by hand rather than with @types/node, which the package does not
 * otherwise need.
 */
type SetMaxListeners = (n: number, ...targets: unknown[]) => void

const node = (globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } }).process
const events = node?.getBuiltinModule?.('node:events') as { setMaxListeners: SetMaxListeners } | undefined

if (events) {
  const setMaxListeners = events.setMaxListeners
  events.setMaxListeners = (n, ...targets) => {
    try {
      setMaxListeners(n, ...targets)
    } catch {
      // a jsdom EventTarget: see above
    }
  }
}
