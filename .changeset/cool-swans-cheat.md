---
"@nxgt/mail-ui": patch
---

Fixed two bugs in the optional `color-primary-dark`/`color-primary-foreground-dark`
pair (0.5.0): the primary tints (`-15`/`-20`/`-40`/`-50`, a tonal chip's ground,
an outlined chip's border, `NxProgress`'s track, `NxTimeline`'s marker) kept
aliasing their light twin even once `color-primary-dark` was set, instead of
being mixed from it over the dark background — a tonal chip could end up with
near-white text on a near-white ground (1.28:1); and `color-paper-dark` mixed
`color-primary-dark` instead of the light `color-primary`, so a near-white
`color-primary-dark` washed the page ground towards white too (1.02:1 against
the dark card, down from 1.09:1).

Both are fixed: the four tints are now recomputed against the dark background,
at the same percentages the light tints use, once `color-primary-dark` is set
(12.7–13.2:1 for the tonal text, 3.2–4.6:1 for the outlined border, in the
reported case); `color-paper-dark` keeps mixing the light `color-primary`
regardless. A project that never sets `color-primary-dark` sees no change —
the previews are pixel-identical.
