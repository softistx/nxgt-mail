---
"@nxgt/mail-ui": minor
---

Add the layout and content components, mirroring `@nxgt/material-vue`: `NxSpacer` (vertical space in the theme's steps, on Maizzle's `<Spacer>`), `NxExtendedLabel`, `NxHighlightText`, `NxKbd`, `NxCountBadge`, `NxActionCard`, `NxFigure`, `NxLinkButton`, `NxIconButton` (its icon an image by absolute URL or a character) and `NxButtonGroup`, whose buttons are `rounded` and `tonal`, the one marked `data-state="active"` `filled`. `uiCatalogues` gains `common.countBadge.label` in `en` and `fr`: a project in another locale adds it. An `NxCountBadge` count or an `NxHighlightText` query given as a placeholder fails the build.
