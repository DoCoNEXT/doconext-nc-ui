/**
 * `@doconext/nc-ui`: the DoCoNEXT apps' shared look and layout, on top of
 * Nextcloud's own components. See README.md.
 */
export { configure } from './config'
export type { BadgeDot, BadgeTone, SegmentedOption } from './types'

export { default as DcnBadge } from './components/DcnBadge.vue'
export { default as DcnCard } from './components/DcnCard.vue'
export { default as DcnDialog } from './components/DcnDialog.vue'
export { default as DcnNavigationRailToggle } from './components/DcnNavigationRailToggle.vue'
export { default as DcnPageTitle } from './components/DcnPageTitle.vue'
export { default as DcnSegmented } from './components/DcnSegmented.vue'
export { default as DcnStat } from './components/DcnStat.vue'

export { RAIL_CLASS, useNavigationRail } from './composables/useNavigationRail'
export { useSidebarResize } from './composables/useSidebarResize'
