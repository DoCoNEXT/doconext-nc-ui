/** Nextcloud's background + text pairs: neutral grey, primary-light, success, warning, and grey text. */
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'muted'

/** A status carries a dot; hollow means "not yet" (a draft). */
export type BadgeDot = 'none' | 'filled' | 'hollow'

export interface SegmentedOption<V extends string | number = string> {
  value: V
  label: string
  /** A count beside the label, in a badge; nothing when 0 or absent. */
  count?: number
  countTone?: BadgeTone
  /**
   * A component drawn before the label at 20px, such as a Lucide icon. Typed
   * loosely on purpose: an app's icon set may carry its own copy of Vue's
   * types, which would not match this package's.
   */
  icon?: object
  disabled?: boolean
}

/** The elements a DcnCard may be. */
export const CARD_TAGS = ['div', 'section', 'article', 'aside', 'li'] as const
export type CardTag = typeof CARD_TAGS[number]

/** What a principal picker can offer. 'circle' is how Nextcloud stores a Team. */
export type DcnPrincipalKind = 'user' | 'group' | 'circle'

/** A user, group or Team, as an app's principal search returns it. */
export interface DcnPrincipal {
  type: DcnPrincipalKind
  id: string
  displayName: string
}
