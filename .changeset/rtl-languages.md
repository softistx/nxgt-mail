---
"@nxgt/mail-i18n": minor
---

Every template gets `dir`, beside `locale`: `'ltr'` or `'rtl'`, derived from
the locale being built. `localeDirection(locale)` asks the runtime's own
`Intl.Locale` first — Bun's `getTextInfo()`, Node 22's `textInfo` — and only
falls back to a small built-in list of right-to-left scripts (Arabic,
Hebrew, Persian, Urdu, Pashto, Sindhi, Uyghur, Yiddish, Divehi, Sorani
Kurdish, Syriac, Aramaic, Khowar, Kashmiri, Ajami Hausa) when the runtime
cannot answer, so a runtime with accurate data always wins. `localeDirection`
is exported for use outside a template.

`@nxgt/mail-ui`'s `NxLayout` writes it on `<html>`, the body and the wrapper
table, and its components mirror their physical CSS for it — an alert's
accent bar, a delta's and a see-also's arrow, a timeline's side. See
`@nxgt/mail-ui`'s `docs/guide/right-to-left.md`.
