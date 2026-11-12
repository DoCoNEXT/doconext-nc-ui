# @doconext/nc-ui

The look and layout the DoCoNEXT Nextcloud apps share: a layered style — a
quiet canvas, raised cards, a scale of shadows and of type — drawn with
Nextcloud's own colours, on top of Nextcloud's own Vue components.

It does **not** replace Nextcloud's controls. Buttons, fields, selects and
switches stay `NcButton`, `NcSelect` and the rest, so the instance's theme,
dark mode, high contrast and keyboard handling keep working, and the apps keep
looking like Nextcloud apps. What this package adds is the layer above them:
pages, cards, tables, badges, segmented choices, dialogs, and two layout
preferences.

## Use

```ts
// main.ts, once
import '@doconext/nc-ui/styles'
import { configure } from '@doconext/nc-ui'
configure({ appId: APP_ID, t })
```

`t` is the app's translate function: the package says a few words itself
("Loading…") and has no catalogue of its own, so those keys go in the app's.

Put `class="dcn-app"` on the app's `NcContent`, and on the root of each other
mount point (its admin and personal settings): the canvas colour, the page
entrance and the accent-coloured spinners key off it.

A settings root also takes `dcn-settings-page`, which moves it clear of the
settings navigation's toggle:

```vue
<div class="dcn-app dcn-settings-page">
  <NcSettingsSection :name="t('Connection')">…</NcSettingsSection>
</div>
```

The room is reckoned from NcSettingsSection's own inset, so anything else at
the top of the page (a tab bar, a notice) takes that inset too:
`calc(var(--default-grid-baseline) * 7)`.

The navigation rail collapses the app navigation to its icons instead of
hiding it. It takes three things in the shell component, the one that renders
`NcContent`:

```vue
<template>
  <NcContent :app-name="APP_ID" class="dcn-app" :class="railClass">
    <NcAppNavigation :aria-label="t('Navigation')">
      <template #search>
        <DcnNavigationRailToggle :expand-label="t('Expand menu')"
                                 :collapse-label="t('Collapse menu')" />
      </template>
      …
    </NcAppNavigation>
    …
  </NcContent>
</template>

<script setup lang="ts">
import { DcnNavigationRailToggle, useNavigationRail } from '@doconext/nc-ui'
const { railClass } = useNavigationRail()
</script>

<style scoped>
@import '@doconext/nc-ui/navigation-rail.css';
</style>
```

- `railClass` on `NcContent` is what makes the navigation narrow. Without it
  the toggle changes nothing.
- The toggle belongs in `NcAppNavigation`'s `search` slot, and it takes over
  from the library's own toggle, which the stylesheet hides.
- The stylesheet goes in this component's scoped style, not in the toggle's
  and not globally: `navigation-rail.css` explains why.

On a phone the navigation is an overlay, so there the toggle is not shown and
the navigation opens and closes as usual.

```vue
<DcnPageTitle>{{ t('Invoices') }}</DcnPageTitle>
<DcnSegmented v-model="status" :label="t('Status')" :options="[
  { value: 'todo', label: t('To invoice'), count: 7, countTone: 'warning' },
  { value: 'all', label: t('All') },
]" />
<DcnBadge tone="success" dot="filled">{{ t('Paid') }}</DcnBadge>
<DcnStat :label="t('Open')" :value="formatMoney(open)" />
<DcnDialog :name="t('New customer')" @closing="close">…</DcnDialog>
```

Tables are plain `<table class="dcn-table">`: their cells are the app's own,
and a wrapper would only be in the way. Inside a `DcnCard` a table drops its
own border and shadow.

| Component | What it is |
|---|---|
| `DcnPageTitle` | A page's title (h2, 24/32 semibold) |
| `DcnCard` | A raised surface; `padded` for 16px inside; `tag`: div (default), section, article, aside, li |
| `DcnBadge` | `tone`: neutral, info, success, warning, muted; `dot`: none, filled, hollow; `color`: an app's own category colour (a themed variable), instead of `tone` |
| `DcnSegmented` | One of several views or filters; `tabs` for a tablist; options may carry a `count` |
| `DcnStat` | A figure with its caption above it |
| `DcnDialog` | `NcDialog` in the layered arrangement; takes all its props and slots |
| `DcnLoading` | Spinner and a line of text where content will appear (`role="status"`); `label`, `compact`. A busy button keeps a bare `NcLoadingIcon` |
| `DcnNavigationRailToggle` | Collapses the navigation to icons; labels are the app's translations |
| `DcnPrincipalPicker` | Picks users, groups and Teams from the app's own search: one at a time (`@select`), one held (`v-model`), or several (`multiple`) |
| `DcnSettingsNavigation` | The navigation while the app's own settings are open: one item per settings page and "Leave settings"; with a router (`to`) or without (`@select`, `@back`) |

`useNavigationRail()` and `useSidebarResize()` remember their state in this
browser, keyed by the app id from `configure()`: a layout belongs to the
screen it was chosen on, and several apps share one session's localStorage.

The resizable details panel needs a handle the app renders itself, because
NcAppSidebar has no slot at its root. Put the handle beside `NcAppSidebar`, as
its sibling, inside the positioned element that spans the panel from top to
bottom (`src/styles/sidebar-resize.scss` says why):

```vue
<div v-if="sidebarOpen"
     class="dcn-sidebar-grip"
     :class="{ 'dcn-sidebar-grip--active': resize.resizing.value }"
     role="separator"
     aria-orientation="vertical"
     tabindex="0"
     :aria-label="t('Resize the sidebar')"
     :aria-valuenow="resize.width.value"
     :aria-valuemin="resize.minWidth"
     :aria-valuemax="resize.maxWidth"
     @pointerdown="resize.startResize"
     @pointermove="resize.resizeTo"
     @pointerup="resize.endResize"
     @pointercancel="resize.endResize"
     @keydown="resize.nudge"
     @dblclick="resize.resetWidth" />
```

Here `const resize = useSidebarResize()`. Keep `pointercancel`, or a drag the
browser takes over (a touch scroll, say) never ends. `maxWidth` is the widest
the current window allows, not a constant.

### Picking users, groups and Teams

`DcnPrincipalPicker` draws the field, the avatars and the empty texts; the
app does the searching. `search` is the app's own lookup, so who is offered —
guests or not, members of some groups only, Teams only where the server has
them — stays with the app and its backend, and the package makes no request.

```vue
<!-- several in the field -->
<DcnPrincipalPicker v-model="assignees" multiple
                    :search="q => api.searchPrincipals(q)" />

<!-- one, which stays in the field (an owner) -->
<DcnPrincipalPicker v-model="owner" :kinds="['user']"
                    :search="q => api.searchUsers(q)" />

<!-- one at a time, the field empties after each; the caller keeps the list -->
<DcnPrincipalPicker :search="q => api.searchPrincipals(q, { teams: true })"
                    :kinds="teamsAvailable ? ['user', 'group', 'circle'] : ['user', 'group']"
                    @select="grant" />
```

`search` gets what was typed, 300 ms after typing pauses, and resolves to
`DcnPrincipal[]` (`{ type: 'user' | 'group' | 'circle', id, displayName }`);
keep it to a page of matches. `kinds` says what it can return and chooses the
placeholder, so pass Teams only where the search returns them. `restricted`
says the search is narrowed, so the empty text says so too.

Its words go in the app's catalogue: "Search users or groups…" and the other
placeholders, "Type a name to search", "No matches", "Group", "Team",
"Loading…", and, with `restricted`, "Type a name to search the allowed
groups" and "No matches in the allowed groups".

### Functional settings

Every DoCoNEXT app reaches its settings the same way:

- **Nextcloud's admin settings** (`/settings/admin/<app>`) hold what a system
  administrator decides: connections and secrets, who the app's functional
  administrators are, what is switched on.
- **The app's own settings** hold what a functional administrator shapes
  inside the app: option lists, templates, rates, imports. They open from a
  "Settings" item with a cog at the bottom of the app navigation, shown to
  functional administrators only. There the navigation gives way to
  `DcnSettingsNavigation`: one item per settings page, and "Leave settings" at
  the bottom. For a system administrator, the first settings page links to
  Nextcloud's admin settings of the app.
- **A user's own preferences** stay on Nextcloud's personal settings.

The shell component swaps one navigation for the other, so the rail styles
both:

```vue
<NcContent :app-name="APP_ID" class="dcn-app" :class="railClass">
  <DcnSettingsNavigation v-if="route.name === 'settings'"
                         :tabs="settingsTabs"
                         :active="route.params.tab || 'general'"
                         :back-to="{ name: 'home' }" />
  <AppNavigation v-else />
  …
</NcContent>
```

```ts
const settingsTabs: SettingsTab[] = [
  { id: 'general', label: t('General'), icon: Settings2, to: { name: 'settings', params: { tab: 'general' } } },
  { id: 'lists', label: t('Option lists'), icon: List, to: { name: 'settings', params: { tab: 'lists' } } },
]
```

Without a router, leave out `to` and `back-to`, and switch the view on
`@select="id => tab = id"` and `@back`. The `header` slot goes in the header
row before the rail toggle, for what the app keeps up there (Core's realm
switcher). Its words go in the app's catalogue: "Settings" (the navigation's
name), "Leave settings", "Expand menu" and "Collapse menu"; `label`,
`back-label`, `expand-label` and `collapse-label` replace them.

## How it is consumed

Source, not a build: the entry points are `.ts`, `.vue` and `.scss`, which
each app's Vite compiles with the rest of its code. `vue`, `@nextcloud/vue`
and `@lucide/vue` are peer dependencies, so there is one copy of each on the
page: any `@nextcloud/vue` 9 from 9.11 on, as the apps move up at their own pace.

An app installs it from GitHub, pinned to a tag, in its `package.json`:

```json
"@doconext/nc-ui": "github:DoCoNEXT/doconext-nc-ui#v0.1.0"
```

It takes a new version when it is ready to. While this is 0.x, a change that
breaks an app is a new minor version, and CHANGELOG.md says so.

## Develop

```
nvm use
npm install
npm run lint && npm run stylelint && npm run typecheck && npm test
```

The package is developed against the lowest `@nextcloud/vue` it supports
(`~9.11.0` in `devDependencies`), so the gates prove that floor. CI runs them a
second time against the newest 9.x, because the stylesheets reach into the
library's own markup, which a minor release can change. Dependabot leaves that
floor alone: raising it is a decision, and it changes the peer range.

To try a change in an app before it is tagged, check this repository out next
to the app and point the app at it with
`"@doconext/nc-ui": "file:../doconext-nc-ui"`. Add
`resolve.dedupe: ['vue', '@nextcloud/vue', '@lucide/vue']` to the app's Vite
config as well. The linked folder has a `node_modules` of its own, and without
dedupe its components would get a second Vue.

## Security, contributing, licence

Report vulnerabilities privately, as [SECURITY.md](SECURITY.md) describes.
Bug reports and feature requests are welcome as issues. Code contributions
are not accepted, and [CONTRIBUTING.md](CONTRIBUTING.md) explains why.

AGPL-3.0-or-later ([LICENSE](LICENSE)), © 2026 DoCoNEXT.
