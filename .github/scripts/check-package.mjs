// What an app gets when it installs this package from GitHub: npm packs the
// repository by package.json's `files`, as it would for the registry. This
// refuses a pack that lacks an entry point or the licence, or that carries
// development files an app has no use for.
//
// Usage: npm pack --dry-run --json | node .github/scripts/check-package.mjs
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const [pack] = JSON.parse(readFileSync(0, 'utf8'))
const files = new Set(pack.files.map((file) => file.path))

const errors = []

// Every target in `exports`, since that is what an app's import resolves to.
for (const target of Object.values(pkg.exports)) {
  const path = target.replace(/^\.\//, '')
  if (!files.has(path)) {
    errors.push(`export target ${path} is not in the package`)
  }
}

for (const path of ['LICENSE', 'README.md', 'CHANGELOG.md']) {
  if (!files.has(path)) {
    errors.push(`${path} is not in the package`)
  }
}

for (const path of files) {
  if (/^(tests|docs|\.github)\//.test(path)) {
    errors.push(`development file ${path} is in the package`)
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.log(`::error::${error}`)
  }
  process.exit(1)
}
console.log(`${files.size} files, all exports present, nothing that belongs to development.`)
