---
"@nxgt/mail-i18n": patch
---

`@nxgt/mail-i18n` now uses `@nxgt/i18n-vue/core` (a new, regular dependency —
its `createFormatter`/`createTranslator` and `layerCatalogues` hold no
module-level state, so nothing calls for a peer) instead of its own copies of
the catalogue and message types, `layerCatalogues`, `createTranslator` and
`createFormatter`. Public behaviour is unchanged: every existing test,
`@ts-expect-error` refusal and `@vue-expect-error` template refusal passes
without editing.

`TemplateKey` and `TemplateArgs` are now `@nxgt/i18n-vue/core`'s generic
`KeyOf`/`ArgsOf`, parametrised over this package's own `TemplateMessages`
instead of `@nxgt/i18n-vue`'s `I18nMessages` — the same generic logic this
package had copied and specialised by hand.

**`checkCatalogues` stays this package's own copy, deliberately.**
`@nxgt/i18n-vue`'s version has grown a check this package does not want yet:
it now refuses two conventions of the same key in one catalogue
(`sign-in` and `signIn` both present), which would turn the fallback
locale's silent acceptance of an old-camelCase override — see
`docs/troubleshooting.md` — into an immediate build failure, in the very
release that documents the silent case. Its message for a key that is
neither camelCase nor kebab-case also gained a second example
(`verifyEmail.title or verify-email.title`). Revisit once `@nxgt/mail-i18n`'s
catalogues no longer need to carry both conventions.

**`readCatalogues` and `templateTypes`/`typesSource` stay too**, for a
different reason: `@nxgt/i18n-vue`'s equivalents (`readCatalogues`,
`typesSource`) live under `./node`, which is not in its `package.json`
`exports` — not public API, so not importable here. `@nxgt/mail`'s
`pickLocale`/`parseAcceptLanguage` were never imported by this package (only
named in a docstring), so there was nothing to move for them.

Also corrects `docs/troubleshooting.md`: an override under an old
`camelCase` key is silently accepted only in the fallback locale's own file.
The same override in another locale's file fails the build immediately,
naming the locale and the key:

```
i18n: fr: presets.linkExpires is not a key of en, the fallback locale
```

The same correction lands in `@nxgt/mail-ui`'s and `@nxgt/mail-presets`'
`docs/troubleshooting.md`, in a changeset of its own.
