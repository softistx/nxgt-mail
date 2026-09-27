---
"@nxgt/mail-ui": minor
---

`NxLayout` writes `dir` on `<html>`, the body and the wrapper table — Outlook
needs it there too, not only on the document — from `@nxgt/mail-i18n`'s `dir`
global when it is listed, else a small built-in list of right-to-left
scripts by locale.

`NxAlert`, `NxCompareCard`, `NxStatCard`, `NxTimeline`, `NxSeeAlso`,
`NxListTile`, `NxEntityHeader`, `NxBreakdownCard`, `NxExtendedLabel`,
`NxRatioCard`, `NxActionCard`, `NxCardHeader`, `NxBanner`,
`NxSteps`/`NxStepsItem`, `NxSummaryData` and `NxTableHead` mirror their
physical CSS for the direction they build in: email clients read
`padding-left`/`padding-right`/`border-left`/`border-right` and
`text-align: left/right` far more reliably than the logical properties that
would otherwise make a component direction-agnostic, and a template's
direction is known when it is built. An alert's accent bar and icon gap, a
compare card's delta and its two boxes, a stat card's icon and delta, a
timeline's connecting line and its title's and time's gap, a see-also's
external-link arrow (mirrored, `↗` becomes `↖`), and every other listed
component's own asymmetric gap, border or alignment (a list tile's trailing
slot, an entity header's actions, a summary row's label/value alignment, a
table head's default alignment, and so on) all flip together with the
table's own `dir`.

`dirOf` is a new internal helper (`components/ui.ts`, shipped as source like
the rest): read `@nxgt/mail-i18n`'s `dir` global when it is there, else
derive one from the locale's base language subtag against the same
fallback list `@nxgt/mail-i18n` keeps.

The plain-text part is unaffected: the mirrored glyphs stay inside
`data-maizzle-html-only` in every direction, as before.

See `docs/guide/right-to-left.md` for the full technique and what stays your
own project's job — `uiCatalogues` ships `en`/`fr` only, so a right-to-left
locale needs its own translation of the shared `common.*` keys it uses, same
as any other added locale.
