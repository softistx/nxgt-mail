# Roadmap

Where `@nxgt/mail-build` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

`@nxgt/mail-build` is the build side of `@nxgt/mail`: a `devDependency` that
runs at build time and is never shipped to a server. The run-time core, its
transports and its presets have their own roadmap in
[`@nxgt/mail`](../../mail/docs/roadmap.md).

## Now

Built on the current branch, not yet published: the package is still private
and ships with the first release, under **Next**.

- **A typed message module from your ICU catalogues** — `readCatalogues()`
  reads one catalogue per locale, and `compileMessages()` compiles them into a
  TypeScript module where `t(locale, key, args)` is typed from the ICU:
  `{name}` a string, `{hours, plural, …}` a number, `{at, date}` a `Date`. The
  module needs nothing but `Intl` at run time. Catalogues from presets come
  first and the application's last; a later one overrides a message, never a
  whole namespace. A catalogue that does not parse, a key that is not
  `camelCase`, a key missing in one locale, or an argument a translation
  invents or types differently fails the build with a `MailBuildError`
  naming the locale and the key.
- **Typed render functions from your templates** — one Maizzle 6 template per
  e-mail, a Vue single-file component styled with Tailwind CSS 4, rendered
  once at build time with its CSS inlined for e-mail clients. The result is a
  render function per e-mail, `mails.verifyEmail({ locale: 'fr', name, link })`,
  answering `{ subject, html, text }`, whose arguments are the union of every
  argument its messages and template use. Every value is HTML-escaped in
  `html`, a line break in the subject is removed, and a link that is not
  `http:`, `https:` or `mailto:` is refused at call time. The render path
  imports nothing from Maizzle, Tailwind or the ICU parser.
- **Build-time refusals for templates** — what one render at build time
  cannot reproduce fails the build instead of rendering wrong: `v-if`,
  `v-for`, `v-html`, an expression, a name that is not a prop, a value in a
  `style` or `on*` attribute, a message key no catalogue holds, an argument a
  message needs and the template does not pass, an e-mail without a subject.
- **The `nxgt-mail build` and `nxgt-mail dev` commands, and `build(config)`** —
  the CLI and the API do the same thing: read the configuration, compile the
  templates and catalogues, write the module to your `generated/` folder.
  `nxgt-mail dev` (and `dev(config)`) also renders every e-mail in every
  locale to a local folder you can open.
- **`defineMailConfig`** — one typed `mail.config.ts`: the locales, the
  fallback locale, the templates and catalogues folders, and where the module
  is written.

## Next

- **Presets** — `defineMailConfig({ presets: [a, b] })` applies a theme,
  layouts, components and shared messages in order, the application's own
  files last. The theme is a set of Tailwind CSS 4 `@theme` tokens tuned for
  e-mail clients. Change one token, add one language or replace one e-mail,
  and keep the rest; a token no preset defines is a compile error.
- **Rendering checked in real clients** — the e-mails the build produces,
  checked in Gmail, Outlook and Apple Mail, with the result written down.
- **The first release, 0.1.0** — on npm, installable into an empty project
  that builds and renders an e-mail with the README's own snippet.

## Later

- **A preview server** — every e-mail in every locale, rendered live in the
  browser while you edit a template or a catalogue.
- **Watch mode** — rebuild the module when a template, a catalogue or the
  configuration changes, without running the build again by hand.
- **Faster builds** — one Maizzle renderer reused across templates instead of
  one per template. Waiting on Maizzle to export its transformer pipeline.
- **A better plain-text part** — `text` laid out in lines and paragraphs as
  the HTML reads, where Maizzle's plain-text output joins blocks with spaces.

## Not planned

- **Conditions and loops in templates** — no `v-if`, no `v-for`. A template
  is rendered once, at build time, so a condition would be decided there and
  not by your arguments. Send a different e-mail, or pass the text that
  differs as a message argument (`select` and `plural` in the catalogue).

- **A template engine at run time** — no Handlebars, no MJML, no Maizzle in
  your server. An engine is untyped and a run-time dependency for work the
  build can finish; the render functions only join strings and call `Intl`.
- **One HTML file per language** — a layout fix would be made once per
  language, or made once and forgotten. One template per e-mail holds keys
  into catalogues; a new language is one catalogue.
- **Falling back to the raw message when one fails to format** — that sends an
  e-mail with `{link}` in it. A catalogue problem fails the build instead, and
  nothing is left at run time that could fail to format.
- **Raw (unescaped) interpolation in v1** — every value is HTML-escaped in
  `html`. An escape hatch is where an injection gets in; if you need markup,
  put it in the template, or write that e-mail's render function yourself —
  any function answering `Rendered` from `@nxgt/mail` is accepted.
- **Running on a general-purpose i18n library** — the ICU syntax is the same,
  but a library that logs a formatting failure and returns the raw message
  would send a broken e-mail, and a run-time dependency (with its own
  dependencies) is not needed when the build can emit plain `Intl` calls.

## Shipped

Nothing yet: what is under **Now** ships with the first release, 0.1.0. From then on, the last ten items are
listed here, newest first, and `CHANGELOG.md` holds the rest.
