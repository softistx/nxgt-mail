# Roadmap

Where `@nxgt/mail-ui` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

- **UI components as a plugin** — `ui({ brand, theme })`, listed in
  `defineMailConfig`'s `plugins`: the `Nx*` components available in every
  template, the brand (name, link, logo by absolute URL) in the layout's
  header and footer, and a wrong option refused where the config is written.
  A project's `components/nx-button.vue` replaces ours by name. Built, not yet
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
  `common.footer.why`, `common.footer.ignore`, `common.avatarGroup.more`,
  `common.timeline.empty`, `common.metrics.ofTarget`,
  `common.metrics.thisPeriod`, `common.metrics.lastPeriod` and
  `common.seeAlso` in `en` and `fr`, given to
  `@nxgt/mail-i18n` as `i18n({ catalogues: [uiCatalogues] })`, and overridden
  key by key by your own `locales/<locale>.json`. Built, not yet published.

- **Components and templates installed from npm** — `ui()` resolves the
  tags of a `.vue` file under `node_modules` itself, since Maizzle does not:
  ours, and a package's templates such as `@nxgt/mail-presets`', render the
  same installed as in the workspace, with your `components/` still replacing
  ours by name. Built, not yet published.
- **`brand` typed in the editor** — `ui()` writes
  `.maizzle/nxgt-mail-ui.d.ts`, which a Maizzle project's `tsconfig.json`
  includes, so templates see `brand` without importing anything. Built, not
  yet published.
- **The second set, first part** — `NxTable` and its parts (a footer on the
  muted background, a caption, an empty row), `NxDescription`, `NxListTile`,
  `NxChip` (static) and `NxAvatar`/`NxAvatarGroup`, with material-vue's props,
  checked against the same support data. Built, not yet published.
- **The second set, second part** — `NxProgress`, `NxSteps`/`NxStepsItem`
  and `NxTimeline`: a bar, numbered steps and toned events joined by a line
  that runs as far as their text in every client, the time of an event
  written as you give it. Built, not yet published.
- **The second set, third part** — `NxHero`, `NxEntityHeader`, the metric
  cards `NxStatCard`, `NxGoalCard`, `NxRatioCard`, `NxCompareCard` and
  `NxBreakdownCard`, and `NxSeeAlso`: a summary e-mail's header, figures with
  a toned delta and its arrow, bars and links, checked against the same
  support data. With it, every material-vue component that fits an e-mail —
  one that is read, not used — has its `Nx` counterpart. Built, not yet
  published.
- **A starter project** — the official Maizzle starter with
  `defineMailConfig`, the i18n and the UI plugins wired in as the READMEs
  say, built, rendered in `en` and `fr` and served in CI, so the snippets are
  known to work: [`examples/starter`](https://github.com/softistx/nxgt-mail/tree/develop/examples/starter).
  In the repository; the packages it installs are not yet published.

## Next

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
  alpha, so a tint is flattened to a plain colour; `NxHero` comes without
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
