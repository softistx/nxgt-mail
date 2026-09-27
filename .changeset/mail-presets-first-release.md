---
"@nxgt/mail-presets": minor
---

The first release: nine ready transactional e-mails, built by your own Maizzle project with your brand.

- `verify-email`, `reset-password`, `password-changed`, `email-changed`, `sign-in-code`, `magic-link`, `new-sign-in`, `welcome` and `invitation`: templates of `@nxgt/mail-ui` components, their messages in `en` and `fr`, the values known only at send time left as placeholders.
- `presets({ only })` answers `{ templates, catalogues }` for `@nxgt/mail-i18n`'s `i18n({ templates, catalogues })`; a preset that does not exist, or one named twice, is refused. `PRESETS`, `PresetName` and `presetCatalogues` name them.
- A template of the same name in your `emails/` replaces a preset, and your `locales/<locale>.json` overrides any of its messages key by key.
- `@nxgt/mail/renderer` sends the presets' build, each value filled and escaped.
