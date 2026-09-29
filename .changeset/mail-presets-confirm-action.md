---
"@nxgt/mail-presets": minor
---

A fifteenth preset, `confirm-action`: a one-time code e-mailed to confirm a sensitive action (step-up re-authentication: changing the e-mail address, turning off two-factor, deleting the account), written with `@nxgt/mail-ui` components in `en` and `fr`. It takes `name`, `code`, `expiresIn` (text, as `sign-in-code`) and `link` (a URL, to secure the account). It does not name the action: the renderer refuses a missing variable, so there is no optional placeholder to carry it. `PRESETS` now lists fifteen names; `only` accepts any of them.
