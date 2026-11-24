import type { Plugin } from 'vite'

export function dcnManuals(options: {
  /** The folder with a folder per language; default `docs/manuals`. */
  root?: string
  /** The manuals the help shows, by folder name, in the order it lists them. */
  manuals: string[]
  /** The languages to bundle. */
  languages: string[]
  /** The language topics in the code are written against; default the first. */
  sourceLanguage?: string
}): Plugin
