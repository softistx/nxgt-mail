# @nxgt/mail-config

## 0.2.0

### Minor Changes

- [#38](https://github.com/softistx/nxgt-mail/pull/38) [`8af7126`](https://github.com/softistx/nxgt-mail/commit/8af7126087c1bd9a1f2087e065512dc85547f35a) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The plain-text part reads as one. `baseConfig` now hands Maizzle a
  `string-strip-html` callback, `breakBlocks`: a paragraph, a heading, a list or
  a table ends with a blank line, and a `<br>`, a `<div>`, a row or a list item
  with a line break. Its `afterBuild` tidies each `.txt` part Maizzle wrote,
  with `tidyPlaintext`: the invisible characters of a `<Spacer>`, an `<Hr>` or a
  preheader are dropped, blank lines never run to more than one, and a link
  whose text is its own address is written once. `maizzle serve`'s plain-text
  preview is unchanged: only `maizzle build` writes this. Before, the whole e-mail ran
  onto one line. Both functions are exported.
  
  A project that sets `plaintext: true` replaces the base's options, and gets
  the old single line back: leave `plaintext` out, or set an object.

## 0.1.0

### Minor Changes

- [#24](https://github.com/softistx/nxgt-mail/pull/24) [`36ff768`](https://github.com/softistx/nxgt-mail/commit/36ff768079199c800b4491232d48e47b2936845f) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The first release: the `maizzle.config.ts` of a normal Maizzle 6 project, with plugins that do not drop each other.
  
  - `defineMailConfig({ plugins, ...project })` layers a base (`baseConfig`, plain text on), then each plugin in order, then your project, whose keys win. `maizzle serve` and `maizzle build` are unchanged.
  - Every build event (`beforeCreate` to `afterBuild`) runs each layer's handler in order, and `components.source`, `vite.plugins` and `vue.plugins` are joined, so two plugins that each bring components keep both.
  - `defineMailPlugin(plugin)` reports a missing name or a handler that is not a function in the package that writes the plugin; a plugin that brings other plugins is refused.
  - `productionConfig(config, overrides)` for `maizzle.config.production.ts`: your config, the HTML minified, then your overrides.
