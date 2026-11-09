# Contributing to @doconext/nc-ui

In short: **bug reports and feature requests are welcome, and we read them.
Code contributions are not accepted.** The rest of this page explains why, so
that nobody finds out after doing the work.

## What is welcome

### Bug reports

Open an issue. The most useful report says what you did, what happened, and
what you expected instead. Where you can, add:

- the tag of this package the app is pinned to (from the app's `package.json`);
- the app it showed up in, and the Nextcloud version;
- the browser, and the theme: light, dark or high contrast. Most of this
  package is colour and layout;
- a screenshot, with names and other data removed.

Please **do not paste code or a patch into an issue**. The section below
explains why. An issue that contains a proposed implementation cannot be acted
on and has to be closed, which wastes your effort.

### Feature requests

Describe the need rather than the solution: what an app should be able to
show, and why the current components are not enough. We can act on a request
that explains its reasoning.

### Security vulnerabilities

**Never report these in a public issue.** Report them privately with GitHub's
*Report a vulnerability* button under the Security tab, or by email to the
address in [SECURITY.md](SECURITY.md). That page also says what to expect.

## Why no code

DoCoNEXT holds the copyright in this package undivided, as it does in the
DoCoNEXT apps. That is a deliberate choice, and other things depend on it:

- **Provenance.** The apps are installed by organisations that must be able to
  say where their software came from and who is answerable for it. With an
  undivided copyright, that answer needs no footnotes.
- **Licensing.** It keeps our ability to license the work consistently over
  time, across all the DoCoNEXT apps and the code they share.

Accepting outside code would end this permanently, and it cannot be undone
one contribution at a time. Only the maintainers can therefore open pull
requests.

**This limits how we develop the package. It does not limit your rights.** The
package is AGPL-3.0-or-later ([LICENSE](LICENSE)). You may fork it, modify it,
and use your modified version, subject only to the licence.

## Building it yourself

If you are forking, or want to see how the package is put together, the
[Develop](README.md#develop) section of the README covers setup and the
quality gates. There is no build to ship: apps compile the source in this
repository directly.
