---
"@nxgt/mail-ui": minor
---

Optional `color-info-dark`/`color-info-foreground-dark` tokens, defaulting to
their light value like `color-primary-dark` and `color-muted-dark`: a project
that never sets them sees no change. `NxLink` and `NxStatusIndicator`'s `info`
tone — both painted directly on the card or the page background, which always
flips in dark mode — now carry `nx-dark-text-info`. `NxAlert`'s `info` variant
and `NxTimeline`'s `info` marker keep the light colour: their own ground
(`bg-info-5`, `bg-info-15`) has no dark twin.

Reported by a downstream consumer measuring `NxLink`'s default contrast:
2.63:1 against the light card, 6.78:1 against the dark one — no single
`color-info` clears WCAG AA's 4.5:1 body-text minimum on both. Setting
`color-info-dark` gives dark mode its own value instead of reusing the light
one; `'color-info-dark': '#93c5fd'` measures 9.89:1 against the default
`color-card-dark`.
