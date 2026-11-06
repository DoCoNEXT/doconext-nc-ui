# Changelog

## 0.1.0 — unreleased

- `DcnLoading`, from Core's LoadingState: the spinner with a line of text
  for screen readers, centred or `compact`; every spinner inside `.dcn-app`
  turns in the accent colour. `configure()` takes the app's `t` for the
  package's own words.

- The look, moved out of doconext_time: `styles` (cards, tables, badges,
  segmented choices, stats, dialogs; the resizable details panel) and
  `navigation-rail.css`.
- Components: `DcnPageTitle`, `DcnCard`, `DcnBadge` (tones, dots),
  `DcnSegmented` (filters or tabs, with counts), `DcnStat`, `DcnDialog`,
  `DcnNavigationRailToggle`.
- Composables: `useNavigationRail`, `useSidebarResize`, kept per app after
  `configure({ appId })`.
