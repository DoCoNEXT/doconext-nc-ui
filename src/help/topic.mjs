/**
 * How a help topic is written: `Manual`, `Manual/Page` or
 * `Manual/Page#section`. Shared by the browser half of the help and the Node
 * half (the Vite plugin, the test helper), so both read a topic the same way.
 */

/**
 * @param {string} topic
 * @return {{ manual: string, page: string, section: string | null }}
 */
export function parseTopic(topic) {
  const at = topic.indexOf('#')
  const path = at === -1 ? topic : topic.slice(0, at)
  const section = at === -1 ? '' : topic.slice(at + 1)
  const [manual, page = ''] = path.split('/', 2)
  return { manual, page: page === '' ? 'Readme' : page, section: section === '' ? null : section }
}

/**
 * @param {{ manual: string, page: string, section: string | null }} target
 * @return {string}
 */
export function formatTopic(target) {
  return `${target.manual}/${target.page}${target.section ? `#${target.section}` : ''}`
}
