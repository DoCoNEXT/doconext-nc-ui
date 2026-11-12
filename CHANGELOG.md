# Changelog

## 0.1.0 — unreleased

- `dcn-settings-page` on the root of an admin or personal settings page keeps
  it beside the settings navigation's toggle, which stayed in the corner and
  covered the content scrolled under it.

- A multiple NcSelect that is focused but closed (right after a pick) keeps
  its border; the library's own rules left only a white outline over it.

- An NcSelect with `label-outside` no longer keeps the room for a floating
  label: it lines up with the NcTextField beside it, and the chips of a
  multiple select sit in the middle of the field.

- `DcnBadge` takes a `color`: an app's own category colour (a pipeline stage,
  a priority), as text on a 13% tint of it, instead of one of the tones.

- `DcnPrincipalPicker`, from Core's PrincipalPicker: users, groups and Teams
  from the app's own `search`: one at a time (`@select`), one held in the
  field (`v-model`), or several (`multiple`).
  A user and a group with the same id stay two options, and an answer that
  a later search overtook no longer fills the list.

- `sideEffects` in package.json: an entry that imports only `configure` no
  longer bundles every component and the Nextcloud Vue parts they use. Core's
  tab in the Files sidebar was 473 KiB (gzipped) with them, 105 without.
- A `DcnDialog` without buttons has no footer: the padding and the rule
  above it were drawn on NcDialog's empty footer too.

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
