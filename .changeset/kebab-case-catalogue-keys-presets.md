---
"@nxgt/mail-presets": minor
---

**Breaking.** Every preset's message key moves from `camelCase` to
`kebab-case`, matching our convention and the templates' own file names
(`@nxgt/mail-i18n` 0.4 still accepts the old `camelCase` form too, so
nothing throws — but an override under the old key is now silently unread,
and a template still calling the old key fails the build; see the
troubleshooting entry for the exact error). The renamed keys, old → new:

- `verifyEmail.*` → `verify-email.*`
- `resetPassword.*` → `reset-password.*`
- `passwordChanged.*` → `password-changed.*`
- `emailChanged.*` → `email-changed.*`
- `signInCode.*` → `sign-in-code.*`
- `magicLink.*` → `magic-link.*`
- `newSignIn.*` → `new-sign-in.*`
- `presets.codeExpires` → `presets.code-expires`
- `presets.linkExpires` → `presets.link-expires`
- `presets.linkFallback` → `presets.link-fallback`
- `presets.notYou` → `presets.not-you`

`welcome.*` and `invitation.*` are one word and unchanged. Rename the keys
in any `locales/<locale>.json` override, and in any template you replaced a
preset with that still calls one by its old name.

The `@nxgt/mail-i18n` peer moves to `^0.4.0` and the `@nxgt/mail-ui` peer to
`^0.3.0`: upgrade both with it.
