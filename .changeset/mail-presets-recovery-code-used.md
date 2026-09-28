---
"@nxgt/mail-presets": minor
---

A fourteenth preset, `recovery-code-used`: a security notice for a spent second-factor recovery code, written with `@nxgt/mail-ui` components in `en` and `fr`. It takes `name`, `when` (the time the code was used, text the sender writes, as `new-sign-in.time`), `recoveryCodesLeft` (also text the sender writes — the build cannot pick an ICU plural branch for a count it only learns at send time, so `recovery-code-used.codes-left` carries the plural for your code to format with `createTranslator` and the real count) and `link` (a URL, to regenerate codes or secure the account). `PRESETS` now lists fourteen names; `only` accepts any of them.
