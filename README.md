# @doconext/nc-ui

The look and layout the DoCoNEXT Nextcloud apps share: Fluent 2's layered
style — a quiet canvas, raised cards, its shadow and type ramps — drawn with
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
configure({ appId: APP_ID })
```

Put `class="dcn-app"` on the app's `NcContent`: the canvas colour and the page
entrance key off it. In the shell component's scoped style, for the
navigation rail:

```scss
@import '@doconext/nc-ui/navigation-rail.css';
```

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
| `DcnNavigationRailToggle` | Collapses the navigation to icons; labels are the app's translations |

`useNavigationRail()` and `useSidebarResize()` remember their state in this
browser, keyed by the app id from `configure()`: a layout belongs to the
screen it was chosen on, and several apps share one session's localStorage.
The sidebar handle's markup is in `src/composables/useSidebarResize.ts`.

## How it is consumed

Source, not a build: the entry points are `.ts`, `.vue` and `.scss`, which
each app's Vite compiles with the rest of its code. `vue`, `@nextcloud/vue`
and `@lucide/vue` are peer dependencies, so there is one copy of each on the
page.

- While it is local: `"@doconext/nc-ui": "file:../doconext-nc-ui"` in the
  app's `package.json`, and in its Vite config
  `resolve.dedupe: ['vue', '@nextcloud/vue', '@lucide/vue']` — the linked
  folder has a `node_modules` of its own, and without dedupe its components
  would get a second Vue.
- From GitHub: `"@doconext/nc-ui": "github:DoCoNEXT/doconext-nc-ui#v0.1.0"`,
  pinned to a tag. The repository is private, so CI needs a token that may
  read it.

An app takes a new version when it is ready to; a change that breaks one is
a new minor version while this is 0.x, and says so in CHANGELOG.md.

## Develop

```
nvm use
npm install
npm run lint && npm run stylelint && npm run typecheck && npm test
```
