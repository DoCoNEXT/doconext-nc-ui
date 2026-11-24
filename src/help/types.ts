/** A heading of a manual page, below its title, with the anchor a topic names. */
export interface HelpHeading {
  level: number
  text: string
  id: string
}

/** A page of a manual, without its text, which loads when somebody opens it. */
export interface HelpPageMeta {
  /** `Manual/Page`; a start page is `Manual/Readme`. */
  id: string
  name: string
  title: string
  headings: HelpHeading[]
}

export interface HelpManual {
  /** Its folder's name, e.g. `Gebruik`. */
  id: string
  title: string
  start: HelpPageMeta
  /** In the order its start page links them. */
  pages: HelpPageMeta[]
}

/** What `virtual:dcn-manuals` exports as `helpIndex`. */
export interface HelpIndex {
  sourceLanguage: string
  languages: Record<string, HelpManual[]>
}

/** What `virtual:dcn-manuals` exports as `loadHelpPage`: a page's HTML, or null. */
export type LoadHelpPage = (language: string, id: string) => Promise<string | null>

/** A topic taken apart: `Manual/Page#section`. */
export interface HelpTarget {
  manual: string
  page: string
  section: string | null
}

export interface HelpOptions {
  index: HelpIndex
  loadPage: LoadHelpPage
  /** The reader's language, as Nextcloud gives it (`nl`, `de_DE`). */
  language: string
  /**
   * The manuals this reader is shown, in the order the help lists them. The
   * app decides: a manual for administrators only for administrators, and none
   * the installation has switched off. The others stay out of the navigation,
   * and a help button that points into one is not drawn.
   */
  manuals: string[]
  /**
   * Words to replace in the text, as the reader's installation calls things:
   * the product's own name for the name the manuals were written with. Only
   * the text is touched, never a link, and a longer key goes first.
   */
  terms?: Record<string, string>
  /**
   * The address of the help page for a topic, as a full URL. A help button
   * where no panel is on the page (the Files sidebar, a settings page) opens
   * this in a new tab.
   */
  pageUrl?: (target: HelpTarget) => string
  /**
   * Opens the help page inside the app, with its router; the panel's "Open as
   * page" uses it. Without it, that button opens `pageUrl` in a new tab.
   */
  openPage?: (target: HelpTarget) => void
}
