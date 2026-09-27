---
"@nxgt/mail-i18n": minor
---

Every segment of a catalogue key may now be `kebab-case` as well as
`camelCase` — `verify-email.link-expires` beside `verifyEmail.linkExpires` —
checked by `checkCatalogues` with the same rule either way (no underscore,
no capital first letter, one word per nesting level, never dotted).
`TemplateMessages` and `MailEmails` type whichever a catalogue uses, so
`t('presets.link-expires')` and `t('verifyEmail.linkExpires')` both compile
when the key exists.

**Breaking**, for a template whose file name has a `-`: `emailKey`, which
finds an e-mail's subject key from its file path, no longer turns `-` into
a capital. `emailKey('verify-email')` was `'verifyEmail'`; it is now
`'verify-email'`, the same kebab-case as the file — `emailKey('auth/reset-password-2')` was `'auth.resetPassword2'`, now `'auth.reset-password-2'`. A
catalogue that wrote the old camelCase form for such a name moves its
top-level key to match the file; a single-word template (`welcome`,
`invitation`) is unaffected, since it has no `-` to keep.

**The manifest is not affected.** `emailKey` only finds a message to
translate at build time; the manifest's `emails` keys stay the template's
own path (`verify-email`, `auth/reset-password`), its `variables` stay
placeholder names, and its `subject` values are the translated text — none
of which is a catalogue key. `formatVersion`/`MANIFEST_FORMAT` stays 1, and
the fixture manifest this package's build is checked against
(`test/fixture/mail-manifest.golden.json`) is unchanged, byte for byte, by
this release: a manifest built after upgrading still reads with `@nxgt/mail`
0.1.0's renderer.
