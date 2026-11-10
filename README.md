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
| `DcnCard` | A raised surface; `padded` for 16px inside |
| `DcnBadge` | `tone`: neutral, info, success, warning, muted; `dot`: none, filled, hollow |
| `DcnSegmented` | One of several views or filters; `tabs` for a tablist; options may carry a `count` |
| `DcnStat` | A figure with its caption above it |
| `DcnDialog` | `NcDialog` in the layered arrangement; takes all its props and slots |
| `DcnLoading` | Spinner and a line of text where content will appear (`role="status"`); `label`, `compact`. A busy button keeps a bare `NcLoadingIcon` |
| `DcnNavigationRailToggle` | Collapses the navigation to icons; labels are the app's translations |

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
