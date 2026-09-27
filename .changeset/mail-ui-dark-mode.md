---
"@nxgt/mail-ui": minor
---

`NxLayout` and the components follow the mail client's dark theme, mirroring
`@nxgt/material-vue`'s dark tokens (background, foreground, card,
card-foreground, accent, accent-foreground and border — primary, secondary,
muted, success, info and warning stay the same in both modes, as
material-vue's do). `theme.css` ships the dark values; `theme` overrides one
the same way it overrides a light token (`'color-background-dark':
'#0b1220'`), so a project overriding a brand colour reaches dark mode with it
unchanged, and a project wanting a different dark value sets its `-dark`
token directly.

`<meta name="color-scheme" content="light dark">`,
`<meta name="supported-color-schemes" content="light dark">` and
`color-scheme: light dark` (inlined on `<html>`) tell a client dark mode is
supported; a `@media (prefers-color-scheme: dark)` block of classes recolours
Apple Mail, iOS Mail, Outlook.com's web app and some Android clients, and the
same rules repeat under `[data-ogsc]`/`[data-ogsb]` for Outlook.com and the
Outlook desktop/mobile apps, which decide dark mode themselves instead of
reading the media query. Gmail reads neither and always shows the inlined
light styles — it cannot be targeted from CSS at all.

`Brand.logo` and `NxFigure` take a `darkSrc`, shown instead of `src` under
dark mode: the classic dark-logo-on-a-dark-background problem, solved with
two images and a CSS visibility toggle rather than a `<picture>` element,
which mail clients do not reliably support.

See `docs/guide/dark-mode.md` for the full technique, the brand config, and
what each client actually does.
