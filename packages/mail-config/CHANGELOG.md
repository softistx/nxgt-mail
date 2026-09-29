# @nxgt/mail-config

## 1.0.2

### Patch Changes

- [#94](https://github.com/softistx/nxgt-mail/pull/94) [`cb9db0d`](https://github.com/softistx/nxgt-mail/commit/cb9db0d7a792410fe164d797d151e7a89cd7ecea) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Keep a table row on one line in the text part of a minified build: with `productionConfig`, `Device {{ device }}` no longer splits over two lines with a blank line between rows.

## 1.0.1

### Patch Changes

- [#90](https://github.com/softistx/nxgt-mail/pull/90) [`f608216`](https://github.com/softistx/nxgt-mail/commit/f6082163f39e385149b013b69a3283cc1688bd37) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The Node floor is now checked in CI, and corrected where it was wrong. `@nxgt/mail`, `-smtp` and `-resend` run on Node `>=20`: CI imports every JavaScript subpath of the packed package under Node 20. `@nxgt/mail-config`, `-i18n`, `-ui` and `-presets` run inside `maizzle build`, which needs Node `^22.22.3`, `^24.15.0` or `>=26` (Maizzle 6's own dependencies require it), not `>=20` as 1.0.0's READMEs said; CI builds the starter at Node 22.22.3.

## 1.0.0

### Major Changes

- [#88](https://github.com/softistx/nxgt-mail/pull/88) [`cdf3e69`](https://github.com/softistx/nxgt-mail/commit/cdf3e6966a51a1154a35034c6db488ec6a3b97cc) Thanks [@SteveGT96](https://github.com/SteveGT96)! - 1.0.0: the surface is stable. From here, a breaking change waits for the next major; the policies are in `docs/plan-1.0.md`.
  
  Every internal peer moves to `^1.0.0` in this release, so upgrade the `@nxgt/mail*` packages together.
  
  The one breaking change: `@nxgt/mail` drops the three aliases deprecated in 0.9, as their doc comments announced. Rename them when you upgrade:
  
  - `withTelemetry` → `withMailTelemetry`
  - `withRendererTelemetry` → `withMailRendererTelemetry`
  - `RetryOptions` → `MailRetryOptions`
  
  The other six packages change no API. A prebuilt format-1 build still reads with any `@nxgt/mail` (`MANIFEST_FORMAT` stays 1), so a package that ships one can peer `@nxgt/mail` `>=0.1.0 <2`.

## 0.2.2

### Patch Changes

- [#83](https://github.com/softistx/nxgt-mail/pull/83) [`0db7590`](https://github.com/softistx/nxgt-mail/commit/0db75908ebb7063d5620a1beabbb4d9c47c79739) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Name the supported Node floor, `>=20`, next to each package's peers.

## 0.2.1

### Patch Changes

- [#47](https://github.com/softistx/nxgt-mail/pull/47) [`67c8852`](https://github.com/softistx/nxgt-mail/commit/67c8852440ffe86761c64b9307a6eeae8a31ee80) Thanks [@SteveGT96](https://github.com/SteveGT96)! - The docs say that, with `@nxgt/mail-ui`'s `ui()` in the plugins, a tag that resolves to no component fails the build, naming the tag and the file.

- [#52](https://github.com/softistx/nxgt-mail/pull/52) [`aa4f748`](https://github.com/softistx/nxgt-mail/commit/aa4f7480142d8cae4023048f77fdade17aa700f0) Thanks [@SteveGT96](https://github.com/SteveGT96)! - Fix: the text part no longer breaks a sentence mid-word where Maizzle wrapped a long source line. `breakBlocks` now marks a paragraph and a line break instead of writing `\n\n` and `\n` directly, so `tidyPlaintext` can tell a source line's wrap from one it meant: it joins the wrap back into its sentence with a single space, but still keeps a link's address on its own line, and keeps every line of a `<pre>`. A project whose own `cb` never marks anything sees no change.

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
