# Roadmap

Where `@nxgt/mail-ui` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

- **UI components as a plugin** — `ui({ brand, theme })`, listed in
  `defineMailConfig`'s `plugins`: the `Nx*` components available in every
  template, the brand (name, link, logo by absolute URL) in the layout's
  header and footer, and a wrong option refused where the config is written.
  A project's `components/NxButton.vue` replaces ours by name. Built, not yet
  published.
- **The first set of components, in the style of `@nxgt/material-vue`** —
  `NxLayout`, `NxTypography`, `NxButton`, `NxLink`, `NxSeparator`, `NxCard`
  and its parts, `NxBadge`, `NxAlert`, `NxBanner`, `NxStatusIndicator`,
  `NxSummaryData`, and `NxCode` for a one-time code: material-vue's names with
  the `Nx` prefix and its `variant`, `color` and `size` props, rendered with
  tables and inlined styles, and checked in the package's tests against the
  support data of Gmail, Outlook and Apple Mail. Built, not yet published.
- **The theme, `theme.css`** — material-vue's light tokens, overridden by name
  with `ui({ theme: { 'color-primary': '#0f766e' } })`; its tints
  (`bg-primary-15`) are flattened to plain colours, and follow a colour you
  override. Built, not yet published.
- **Shared messages** — `uiCatalogues`: `common.greeting`,
  `common.footer.why` and `common.footer.ignore` in `en` and `fr`, given to
  `@nxgt/mail-i18n` as `i18n({ catalogues: [uiCatalogues] })`, and overridden
  key by key by your own `locales/<locale>.json`. Built, not yet published.

## Next

- **The second set of components** — the material-vue components that fit an
  e-mail and are not in the first set, each a table with inlined styles and
  material-vue's props: `NxTable` and its parts, `NxTimeline`,
  `NxSteps`/`NxStepsItem`, `NxProgress`, `NxStatCard`,
  `NxAvatar`/`NxAvatarGroup`, `NxListTile`, `NxDescription`,
  `NxEntityHeader`, `NxSeeAlso`, `NxHero`, `NxChip`, and the metrics cards
  that are bars and numbers (goal, ratio, compare, breakdown) — each checked
  against mail-client support data and documented with its props.
- **A starter project** — the official Maizzle starter with
  `@nxgt/mail-config`, `@nxgt/mail-i18n` and this plugin wired in, built in
  CI, so the README's snippet is known to work.
- **The first release, 0.1.0** — `@nxgt/mail-ui` on npm, rendering an e-mail
  in two languages in an empty Maizzle project with the README's own snippet.

## Later

- **`NxSpacer`** — a spacer in the package's own style. Until then, Maizzle's
  `<Spacer>` does the job.

A request is welcome as an
[issue](https://github.com/softistx/nxgt-mail/issues).

## Not planned

- **Dark mode** — an e-mail is light only: `theme.css` holds material-vue's
  light tokens and no dark ones, so every client starts from the same
  colours.
- **Icon fonts** — a mail client loads no icon font. An icon is an image by
  absolute URL or a character, passed through the `icon` slot of the
  components that have one.
- **Transparent colours, blurs and gradients** — a mail client drops an
  alpha, so a tint is flattened to a plain colour; `NxHero` will come without
  its blur or gradient for the same reason.
- **A dependency on `@nxgt/material-vue`** — the components follow its names,
  props and tokens, but are written for e-mail, with tables and inlined
  styles; nothing of material-vue is installed or imported.
- **Interactive components** — menus, dialogs, tabs, form fields: an e-mail
  runs no script, so only the components that make sense on a page that is
  read, not used, are mirrored.
- **A relative logo or brand link** — refused by `ui()`: a mail client loads
  nothing relative, so `brand.logo.src` and `brand.url` are absolute
  `http(s)` URLs.

## Shipped

Nothing yet: the items under **Now** ship with the first release, 0.1.0. From
then on, the last ten items are listed here, newest first, and
`CHANGELOG.md` holds the rest.
