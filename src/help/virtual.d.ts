/**
 * The module the `dcnManuals` Vite plugin generates. An app that uses the help
 * references this file once, e.g. in its `env.d.ts`:
 * `/// <reference types="@doconext/nc-ui/help-virtual" />`
 */
declare module 'virtual:dcn-manuals' {
  import type { HelpIndex, LoadHelpPage } from '@doconext/nc-ui'

  export const helpIndex: HelpIndex
  export const loadHelpPage: LoadHelpPage
}
