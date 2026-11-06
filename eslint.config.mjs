import { recommended } from '@nextcloud/eslint-config'
import { defineConfig } from 'eslint/config'

// The house style of the DoCoNEXT apps (from doconext_time): two-space
// indentation and the same rules switched off, so a component moved here from
// an app lints the same.
export default defineConfig([
    // Build output, generated translations, deps, and root tooling/config files
    // are not subject to the app's source style rules.
    {
        ignores: [
            'node_modules/**', 'eslint.config.mjs', 'stylelint.config.cjs', 'vitest.config.ts',
        ],
    },

    // Vue 3 + TypeScript. Supplies its own parsers, plugins and Nextcloud's
    // coding style, replacing the FlatCompat bridge and the hand-wired vue/ts
    // parser blocks this file used to carry.
    ...recommended,


    // Project-wide overrides. Same bargain as before the ESLint 10 upgrade:
    // keep the rules that catch bugs, relax the ones that would only produce
    // churn-only diffs across a codebase written to a different house style.
    {
        name: 'doconext-nc-ui/overrides',
        rules: {
            // This codebase is 2-space indented; @nextcloud-config is tabs.
            // The house style wins over the shipped default, so the rule bends
            // rather than the whole tree.
            '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
            '@stylistic/no-tabs': 'off',

            // Pure formatting. Prettier-style opinions with no bug behind them.
            '@stylistic/arrow-parens': 'off',
            '@stylistic/comma-dangle': 'off',
            '@stylistic/exp-list-style': 'off',
            '@stylistic/function-paren-newline': 'off',
            '@stylistic/implicit-arrow-linebreak': 'off',
            '@stylistic/indent-binary-ops': 'off',
            '@stylistic/max-statements-per-line': 'off',
            '@stylistic/member-delimiter-style': 'off',
            '@stylistic/operator-linebreak': 'off',
            '@stylistic/padded-blocks': 'off',
            '@stylistic/semi': 'off',

            // Import ordering and extension style: the TS compiler already
            // resolves these correctly, and sorting imports would rewrite most
            // files without changing behaviour.
            'perfectionist/sort-imports': 'off',
            'perfectionist/sort-named-imports': 'off',
            'import-extensions/extensions': 'off',
            'import-extensions/ban-inline-type-imports': 'off',

            // Template formatting opinions, off before the upgrade and still off.

            // Component conventions this codebase deliberately does not follow.
            // Misfires on `v-for="x in arr.filter((cb) => ...)"` — it reads the
            // callback param as the iteration variable.

            // JSDoc: documenting is encouraged, not enforced.
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param': 'off',
            'jsdoc/require-param-description': 'off',
            'jsdoc/tag-lines': 'off',
            'jsdoc/multiline-blocks': 'off',

            // Real findings — surfaced, but not blocking a push. Fix as touched.
            // Warn, never autofix in bulk: the translation key IS the English
            // string, and 29 keys in l10n/nl.json still use "...". Rewriting the
            // source without the catalogs drops those strings back to English.
            '@nextcloud/l10n-enforce-ellipsis': 'warn',
            '@nextcloud/l10n-non-breaking-space': 'warn',
            '@nextcloud/no-deprecated-library-props': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-use-before-define': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            // 878 hits: this codebase consistently uses brace-less single-line
            // guards. Enforcing braces would bury every other warning.
            curly: 'off',
            eqeqeq: 'warn',
            'no-console': 'warn',
            'no-useless-assignment': 'warn',
        },
    },

    // Template and component conventions. Scoped to .vue because the vue
    // plugin namespace only exists for those files.
    {
        name: 'doconext-nc-ui/overrides-vue',
        files: ['**/*.vue'],
        rules: {
            'vue/html-indent': ['error', 2],
            'vue/comma-dangle': 'off',
            'vue/comma-spacing': 'off',
            'vue/quote-props': 'off',
            'vue/attributes-order': 'off',
            'vue/attribute-hyphenation': 'off',
            'vue/define-macros-order': 'off',
            'vue/first-attribute-linebreak': 'off',
            'vue/html-self-closing': 'off',
            'vue/max-attributes-per-line': 'off',
            'vue/multiline-html-element-content-newline': 'off',
            'vue/prefer-separate-static-class': 'off',
            'vue/singleline-html-element-content-newline': 'off',
            'vue/v-on-event-hyphenation': 'off',
            'vue/multi-word-component-names': 'off',
            'vue/no-boolean-default': 'off',
            'vue/require-default-prop': 'off',
            'vue/valid-v-for': 'off',
            'vue/custom-event-name-casing': 'warn',
            // kebab-case slot names are idiomatic in templates; renaming one means
            // touching every parent that fills it.
            'vue/slot-name-casing': 'warn',
            'vue/no-unused-properties': 'warn',
        },
    },

    // unused-vars cannot see template token usage in .vue files, so every
    // component imported for the template reads as unused. tsc enforces
    // noUnusedLocals on these files anyway.
    {
        name: 'doconext-nc-ui/vue-unused-vars',
        files: ['**/*.vue'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },
])
