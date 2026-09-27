---
"@nxgt/mail-ui": minor
---

Add the layout and content components, mirroring `@nxgt/material-vue` (all but `NxSpacer`, the e-mail's own): `NxSpacer` (vertical space in the theme's steps, on Maizzle's `<Spacer>`), `NxExtendedLabel`, `NxHighlightText`, `NxKbd`, `NxCountBadge`, `NxActionCard`, `NxFigure`, `NxLinkButton`, `NxIconButton` (its icon an image by absolute URL or a character) and `NxButtonGroup`, whose buttons are `rounded` and `tonal`, the one marked `data-state="active"` `filled`. `uiCatalogues` gains `common.countBadge.label` in `en` and `fr`: a project in another locale adds it. An `NxCountBadge` count, an `NxHighlightText` query or an `NxIconButton` icon given as a placeholder fails the build.
