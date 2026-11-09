# Security Policy

DoCoNEXT takes the security of `@doconext/nc-ui`, and of the apps built on it,
seriously. This page explains how to report a vulnerability and what to expect
after you do.

## Reporting a vulnerability

**Please do not open public GitHub issues for security problems.**

Report vulnerabilities privately, in one of two ways:

- Use GitHub's **private vulnerability reporting**: the *Report a
  vulnerability* button under this repository's *Security* tab. We prefer this
  channel, because the report, the discussion and the fix stay in one place
  that only you and the maintainers can see until a fix is published. You can
  be credited when the advisory goes out, or stay anonymous.
- Email **security@doconext.com** if you would rather not go through GitHub.

Please include, where possible:

- the affected version or tag;
- the app it showed up in, with that app's version and the Nextcloud version;
- a description of the issue and its impact;
- steps to reproduce, or a proof of concept.

If you are not sure whether a problem lies in this package or in the app
using it, report it here. We will move it to the right place.

## What to expect

This package is maintained by a small team. We confirm receipt of a report
within a few business days and assess its severity (CVSS v3.1). Fixes are
worked on in order of severity, so a critical issue goes before everything
else. We keep you informed of progress. We would rather tell you honestly how
long something will take than promise a date we cannot keep.

## Coordinated disclosure

We follow coordinated disclosure. Please give us a reasonable opportunity to
release a fix before you disclose anything publicly: typically up to
**90 days**, or sooner once a fix is available. We are happy to credit
reporters who wish to be acknowledged.

## Scope

This is a front-end library: Vue components, two composables and stylesheets,
compiled into each app that uses it. Some facts are worth knowing before you
report:

- **It has no server side and makes no network requests.** Data, access
  control and authentication belong to the app and to Nextcloud.
- **It stores two layout preferences in the browser's localStorage**, keyed by
  the app's id: `<appId>-navigation-rail` (`collapsed` or `expanded`) and
  `<appId>-sidebar-width` (a number of pixels). Neither holds user data. Any
  script on the same Nextcloud origin can read and change them, as with any
  localStorage.
- **Controls are Nextcloud's own.** Buttons, fields, dialogs and the rest come
  from `@nextcloud/vue`. A vulnerability in one of those belongs to
  [nextcloud-libraries/nextcloud-vue](https://github.com/nextcloud-libraries/nextcloud-vue).

## Supply chain

- The package has no runtime dependencies of its own. `vue`, `@nextcloud/vue`
  and `@lucide/vue` are peer dependencies, and each app installs and audits
  them alongside its other dependencies.
- It is distributed as source, pinned by git tag, so the code an app compiles
  is the code in this repository at that tag.

## Supported versions

Security fixes are provided for the **latest tagged version**.
