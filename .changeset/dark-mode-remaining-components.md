---
"@nxgt/mail-ui": minor
---

The optional `color-primary-dark`/`color-primary-foreground-dark` and
`color-muted-dark`/`color-muted-foreground-dark` pairs now also reach
`NxActionCard`'s active and idle states, `NxExtendedLabel`'s bar,
`NxEventChip`'s bar and `selected` border, `NxFileList`'s badge, download
link and empty state, `NxHighlightText`'s mark, `NxRatioCard`'s right
figure, `NxStatusIndicator`'s `primary` and `neutral` tones, `NxStepsItem`'s
numbered circle and body, and `NxSummaryData`'s row divider. A project that
never sets the tokens sees no change — the previews are pixel-identical.

`NxHero`'s eyebrow and title, `NxListTile`'s idle and selected title/subtitle,
and `NxEventChip`'s own ground stay un-wired to `color-primary-dark` on
purpose: self-contained decorative grounds whose own text does not flip
either.
