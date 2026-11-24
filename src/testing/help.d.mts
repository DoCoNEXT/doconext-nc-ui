export function checkHelpTopics(options: {
  /** The app's source folder, e.g. `src`. */
  srcDir: string
  /** The folder with a folder per language; default `docs/manuals`. */
  root?: string
  /** The language the topics are written against. */
  language: string
  /** The manuals the help shows, by folder name. */
  manuals: string[]
  /** Files that may hold a lone `<DcnHelpButton>`, each with the reason. */
  allowedButtons?: Record<string, string>
  /** Components that pass a topic on (`:help`, `:topic`), each with what it is. */
  forwarders?: Record<string, string>
}): string[]
