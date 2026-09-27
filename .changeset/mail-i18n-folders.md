---
"@nxgt/mail-i18n": minor
---

Catalogues can now be split into folders: under `dir` (default `locales`), a file at `<dir>/<locale>/**/*.json` is read beside `<dir>/<locale>.json`, and its path is a key prefix — `locales/en/mails.json` is `mails.*`, `locales/en/auth/sign-in.json` is `auth.sign-in.*`. A folder name or a file's basename must be `camelCase` or `kebab-case`, like any key segment; every locale needs the same files at the same paths as the fallback locale; and a key two files both claim — flat and folder, or two folder files — fails the build, naming both.

`messages` is a new option, instead of `dir`: a module path whose default export is the resources object (`{ en: {...}, fr: {...} }`), or a function that answers one. Reading it is asynchronous, so `i18n({ messages })` answers a `Promise<MailPlugin>` — `await` it with a plain top-level `await` in `maizzle.config.ts`. Without `messages`, `i18n()` still answers the plugin directly.

Both are read with `@nxgt/i18n-vue`'s own shared loader (`@nxgt/i18n-vue/node`), now a `^0.2.0` dependency; this package's own `checkCatalogues` — deliberately more lenient than `@nxgt/i18n-vue`'s (it does not refuse two conventions of the same key colliding) — still runs on the merged result, unchanged.
