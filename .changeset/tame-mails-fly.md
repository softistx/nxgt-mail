---
"@nxgt/mail-ui": minor
---

Optional dark tokens for the muted colour: `color-muted-dark` and
`color-muted-foreground-dark`, the same pattern as `color-primary-dark` — both
default to their light value, so a project that never sets them is unaffected
and the previews are pixel-identical. Set them for a dark card that needs its
own muted step (`NxCode`'s and `NxAvatarFallback`'s ground, `NxKbd`,
`NxTimeline`'s default marker, a table's footer/`NxAlert`'s `foreground`
variant ground, and every place muted text is used) to read against, e.g.
`color-muted-dark: '#1e293b'` with `color-muted-foreground-dark: '#e2e8f0'`
against a `#0f172b` card (11.9:1 for the text, a visible step above the card).
`NxCode`, `NxAvatarFallback` and a table's footer keep their own text pinned to
`color-foreground`, unflipped: pick a `color-muted-dark` light enough to keep
it legible, or leave it unset.
