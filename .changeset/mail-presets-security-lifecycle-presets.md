---
"@nxgt/mail-presets": minor
---

Four more presets, written with `@nxgt/mail-ui` components in `en` and `fr`, beside the existing nine: `two-factor-enabled` and `two-factor-disabled` (security, `name` and `link`), `account-deleted` (accounts, `name`, `link` and a required `expiresIn` for the restoration link — required for the same reason as `invitation.expires`: the server that grants the grace period knows its length, the build does not), and `invitation-accepted` (lifecycle, tells the inviter with `invitee`, `organization` and `link`). `PRESETS` now lists thirteen names; `only` accepts any of them.
