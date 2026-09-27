---
---

`@nxgt/mail-ui`'s and `@nxgt/mail-presets`' `docs/troubleshooting.md`
correct the same wording as `@nxgt/mail-i18n`'s: an override under an old
`camelCase` key is silently accepted only in the fallback locale's own
file — the same override in another locale's file fails the build
immediately, naming the locale and the key. Docs only: nothing to release.
