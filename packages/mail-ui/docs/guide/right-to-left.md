# Right-to-left languages

This page is for building an e-mail in Arabic, Hebrew, Persian, Urdu, or any
other right-to-left language: what `NxLayout` writes, how a component mirrors
its physical CSS, and what stays your own project's job.

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { ui } from '@nxgt/mail-ui';

export default defineMailConfig({
	plugins: [ui({ brand: { name: 'Acme' } }), i18n({ locales: ['en', 'ar'] })],
});
```

Nothing else changes: the same templates build in `ar` as in any other
locale, `t()` translates from `locales/ar.json`, and every `Nx*` component
lays itself out for the direction that locale reads in.

## Where the direction comes from

`@nxgt/mail-i18n` derives each locale's direction and gives it to the
template as `dir`, beside `locale` — see its
[README](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/README.md#usage).
`@nxgt/mail-ui`'s own `dirOf`
(`components/ui.ts`) reads that global when `@nxgt/mail-i18n` is listed, and
otherwise falls back to the same small list of right-to-left scripts, keyed
by locale, so a component built without the i18n plugin (a bare `ui()`
project passing its own `locale`) still lays out correctly.

`NxLayout` writes it where a client reads it:

```vue
<Html :lang="lang" :dir="dir">
  <Body :dir="dir">
    <!-- the wrapper table also carries it: Outlook needs dir on the table,
         not only the document, to lay its columns out right to left -->
```

## How a component mirrors

Email clients read `padding-left`, `padding-right`, `border-left`,
`border-right` and `text-align: left/right` — the **physical** properties —
far more reliably than the logical ones (`padding-inline-start`,
`border-inline-start`, `text-align: start`) that would otherwise make a
component direction-agnostic. Since a template's locale — and so its
direction — is known when Maizzle builds it, `@nxgt/mail-ui`'s components
choose the physical value at build time instead:

```ts
// simplified from alert.vue
const dir = computed(() => dirOf(globals));
const classes = computed(() =>
	twMerge(`border-0 border-solid p-4 ${dir.value === 'rtl' ? 'border-r-8' : 'border-l-8'}`, …),
);
```

The table itself also carries `:dir="dir"`: a mail client that supports it
(checked with caniemail below) then lays its columns out right to left too,
which is why the padding swap above is paired with the accent bar's border
side — both must flip together, or the bar ends up on the wrong edge once
the columns reorder.

What mirrors:

| Component | What flips |
| --- | --- |
| `NxLayout` | `dir` on `<html>`, the body and the wrapper table |
| `NxAlert` | The accent bar's side (`border-l-8`/`border-r-8`), the icon's gap |
| `NxCompareCard` | The delta's gap and alignment, the gap between its two boxes |
| `NxStatCard` | The icon's gap and alignment, the delta's gap |
| `NxTimeline` | The connecting line's side, the gap after the marker, the timestamp's gap and alignment |
| `NxSeeAlso` | The external-link arrow, mirrored (`↗` becomes `↖`), and its alignment |
| `NxListTile` | The trailing slot's gap and alignment |
| `NxEntityHeader` | The actions slot's gap and alignment |
| `NxBreakdownCard` | The gap between its boxes and their alignment |
| `NxExtendedLabel` | The icon's gap |
| `NxRatioCard` | The gap between its boxes and their alignment |
| `NxActionCard` | The icon's gap, the arrow's alignment |
| `NxCardHeader` | The actions slot's gap and alignment |
| `NxBanner` | The icon's gap, the action slot's gap and alignment |
| `NxSteps` / `NxStepsItem` | The connecting line's side, the marker's gap |
| `NxSummaryData` | The label/value alignment |
| `NxTableHead` | The default column alignment |

A component with no asymmetric padding, border or alignment (`NxCard`,
`NxBadge`, most of the data components) needs nothing: centred or
symmetric spacing reads the same either way.

## What stays your own project's job

`@nxgt/mail-ui`'s shared messages (`uiCatalogues`, `common.*` — the footer,
`see-also`, `timeline.empty`, and the rest) ship **`en` and `fr` only**. A
project adding a right-to-left locale writes its own translation of every
`common.*` key it uses, in `locales/<locale>.json`, the same way it writes
its own templates' messages — `@nxgt/mail-i18n`'s catalogues are checked
against the fallback locale regardless of who shipped a key, and a shared key
missing in your added locale fails the build exactly as a template's own
would.

## The plain-text part

Nothing here changes it: the arrow and the delta's glyph are always inside
`data-maizzle-html-only`, kept out of `.txt` in every locale, right-to-left
included. A plain-text client shows the same words a left-to-right build
shows, in the reading order the mail client itself gives right-to-left text —
this package writes no direction markers into the text part.

## caniemail

`dir` is a plain HTML attribute with no history of a caniemail finding
against `html-align` or the other checks this package already tracks (see
`packages/mail-ui/src/build.spec.ts`'s `under maizzle serve` describe block,
and [Dark mode](dark-mode.md#caniemail) for how that check works). A future
finding against it would show up there, in the `known` array next to the
affected fixture template.

## See also

- [`@nxgt/mail-i18n`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/README.md) —
  `locales`, `dir`, `localeDirection`.
- [Components](components.md) — every `Nx*` component.
- [Dark mode](dark-mode.md) — the other build-time/runtime split a mail
  client forces on this package, and how it stays independent of direction
  (both combine: a right-to-left e-mail is still dark under
  `prefers-color-scheme: dark`).
