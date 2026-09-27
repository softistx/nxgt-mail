# Roadmap

Where `@nxgt/mail-config` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

Nothing between releases.

## Next

Nothing yet.

## Later

Nothing yet. A request is welcome as an
[issue](https://github.com/softistx/nxgt-mail/issues).

## Not planned

- **A preview server or a CLI of our own** — `maizzle serve` is the preview
  and `maizzle build` the build. This package writes the config those commands
  read; it never replaces them.
- **Environments beyond Maizzle's `-c` config files** — Maizzle has no
  environments: `maizzle build -c <file>` loads that one file. A second config
  file that imports the first, as `productionConfig` does, is the whole
  mechanism; there is no `NODE_ENV` switch or environment map to learn.
- **A plugin that brings other plugins** — refused with an error. Every plugin
  is listed in your project, so their order, and which one's key wins, is read
  in one place.
- **Joining every array** — only `components.source`, `vite.plugins` and
  `vue.plugins` are joined. Every other array replaces the one under it, as in
  Maizzle, so a list your project sets is the list you get.
- **Last handler wins** — Maizzle's own merge keeps only the last
  `beforeRender` (or any other event); here every layer's handler runs, in
  order. A plugin silently disabling another's hook is the bug this package
  exists to remove.
- **`moduleResolution: "nodenext"` as a contract** — bundler resolution
  (`"moduleResolution": "bundler"`) is what is supported and tested, as Bun,
  every bundler and Maizzle's own config loader resolve. `nodenext` may work;
  it is not promised.

## Shipped

The last ten, newest first, each with the version it came in. Everything
before is in the [CHANGELOG](../CHANGELOG.md).

- **A plain-text part that reads as one, v0.2.0** — a blank line after a
  paragraph, a heading, a list or a table; a line break after a `<br>`, a row,
  a list item or a `<div>`; none of the invisible characters a spacer or a
  divider holds; a link whose text is its address written once.
  `breakBlocks` and `tidyPlaintext` are exported. `maizzle serve`'s preview is
  unchanged: only `maizzle build` writes this.
- **A base Maizzle config, v0.1.0** — `defineMailConfig({ plugins, ...project })` for
  the `maizzle.config.ts` of a normal Maizzle 6 project (`maizzle serve`,
  `maizzle build`, unchanged). It turns plain text on (`baseConfig`), and
  leaves everything else to Maizzle's defaults.
- **Plugins that do not drop each other, v0.1.0** — a plugin is a partial Maizzle
  config with a `name`, layered base, then each plugin in order, then your
  project, whose keys win. Every build event (`beforeCreate` to `afterBuild`)
  runs each layer's handler in that order, and `components.source`,
  `vite.plugins` and `vue.plugins` are joined, so two plugins that each bring
  components keep both.
- **Checking a plugin where it is written, v0.1.0** — `defineMailPlugin(plugin)`: a
  package that exports a plugin gets a missing name or a handler that is not a
  function reported in its own code, not in the project that uses it.
- **A production config, v0.1.0** — `productionConfig(config, overrides)` for
  `maizzle.config.production.ts`: your project config, the HTML minified,
  then your overrides, built with `maizzle build -c
  maizzle.config.production.ts`.
- **i18n as a plugin, `@nxgt/mail-i18n` v0.1.0** — `i18n({ locales,
  fallbackLocale })`, listed in `plugins` — see
  [its roadmap](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/roadmap.md).
- **UI components as a plugin, `@nxgt/mail-ui` v0.1.0** — `ui({ brand, theme
  })`, listed in `plugins`: e-mail components in the style of
  `@nxgt/material-vue`, each replaceable by name in your project — see
  [its roadmap](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/docs/roadmap.md).
- **A starter project, with v0.1.0** — the official Maizzle starter with
  `defineMailConfig`, the i18n and the UI plugins wired in as the READMEs
  say, built, rendered in `en` and `fr` and served in CI, so the snippets are
  known to work: [`examples/starter`](https://github.com/softistx/nxgt-mail/tree/develop/examples/starter).
  In the repository; its README says how to start your own from npm.
