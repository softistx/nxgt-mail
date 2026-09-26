# Roadmap

Where `@nxgt/mail-config` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

- **A base Maizzle config** — `defineMailConfig({ plugins, ...project })` for
  the `maizzle.config.ts` of a normal Maizzle 6 project (`maizzle serve`,
  `maizzle build`, unchanged). It turns plain text on (`baseConfig`), and
  leaves everything else to Maizzle's defaults. Built, not yet published.
- **Plugins that do not drop each other** — a plugin is a partial Maizzle
  config with a `name`, layered base, then each plugin in order, then your
  project, whose keys win. Every build event (`beforeCreate` to `afterBuild`)
  runs each layer's handler in that order, and `components.source`,
  `vite.plugins` and `vue.plugins` are joined, so two plugins that each bring
  components keep both. Built, not yet published.
- **Checking a plugin where it is written** — `defineMailPlugin(plugin)`: a
  package that exports a plugin gets a missing name or a handler that is not a
  function reported in its own code, not in the project that uses it. Built,
  not yet published.
- **A production config** — `productionConfig(config, overrides)` for
  `maizzle.config.production.ts`: your project config, the HTML minified,
  then your overrides, built with `maizzle build -c
  maizzle.config.production.ts`. Built, not yet published.

## Next

- **i18n as a plugin** — `@nxgt/mail-i18n`'s `i18n({ locales, fallbackLocale })`,
  listed in `plugins`: built, not yet published — see
  [its roadmap](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/roadmap.md).
- **UI components as a plugin** — `@nxgt/mail-ui`'s `ui({ brand, theme })`,
  listed in `plugins`: a neutral theme, a layout and the `Nx*` components,
  each replaceable by name in your project.
- **A starter project** — the official Maizzle starter with
  `defineMailConfig`, the i18n and the UI plugins wired in, built in CI, so the
  README's snippet is known to work.
- **The first release, 0.1.0** — `@nxgt/mail-config` on npm, installable into
  an empty Maizzle project that serves and builds with the README's own
  snippet.

## Later

Nothing yet beyond **Next**. A request is welcome as an
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

Nothing yet: the items under **Now** ship with the first release, 0.1.0. From
then on, the last ten items are listed here, newest first, and
`CHANGELOG.md` holds the rest.
