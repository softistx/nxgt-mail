---
"@nxgt/mail-ui": minor
---

The optional `color-primary-dark`/`color-primary-foreground-dark` pair now
also reaches `NxActionCard`'s active ring, icon box and indicator,
`NxExtendedLabel`'s bar, `NxEventChip`'s bar and `selected` border,
`NxFileList`'s extension badge and download link, `NxHighlightText`'s mark,
`NxStatusIndicator`'s `primary` tone, `NxStepsItem`'s numbered circle and
`NxSummaryData`'s row divider (`NxFileList`'s empty state, `NxRatioCard`'s
right figure, `NxStatusIndicator`'s `neutral` tone and `NxStepsItem`'s body
already carried `color-muted-dark` since 0.6.0). A project that never sets
the tokens sees no change — the previews are pixel-identical.

`NxHero`'s eyebrow and title, `NxListTile`'s idle and selected title/subtitle,
and `NxEventChip`'s own ground stay un-wired to `color-primary-dark` on
purpose: self-contained decorative grounds whose own text does not flip
either.
