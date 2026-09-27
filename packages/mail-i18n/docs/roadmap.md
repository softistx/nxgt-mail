# Roadmap

Where `@nxgt/mail-i18n` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

- **The wrappers under `.maizzle/emails/`** — the files generated per
  template and locale move from `.maizzle/i18n/` to `.maizzle/emails/`, so
  `maizzle serve` lists the e-mails under `.maizzle/emails/en` rather than a
  folder named after the plugin. The build output does not move. Built, not
  yet published.

## Next

Nothing yet.

## Later

Nothing yet. A request is welcome as an
[issue](https://github.com/softistx/nxgt-mail/issues).

## Not planned

- **Answering the key on a missing message** — `@nxgt/i18n` answers the key
  when a message is missing; here a missing key, a language with no catalogue
  or a formatting failure throws, in templates and in `createTranslator`
  alike. An e-mail must never go out with `verifyEmail.title` or `{link}` in
  it, so the failure belongs at build time.
- **A template engine at run time** — templates are built by `maizzle build`;
  at send time only `{{ name }}` placeholders are filled in the built files.
  No Handlebars, no MJML, no Maizzle in your server.
- **One HTML file per language, written by hand** — one template per e-mail,
  its text keys into catalogues; building one file per locale is this
  plugin's job.
- **A translation-management integration** — the catalogues are JSON files in
  your project, in the `@nxgt/i18n` layout; syncing them with a translation
  service is left to your own tooling.

## Shipped

The last ten, newest first, each with the version it came in. Everything
before is in the [CHANGELOG](../CHANGELOG.md).

- **i18n as a plugin, v0.1.0** — `i18n({ locales, fallbackLocale })`, listed in
  `defineMailConfig`'s `plugins`: one template per e-mail, its text keys into
  `locales/<locale>.json` ICU catalogues, and one output per locale from a
  single `maizzle build` — `dist/<locale>/<template>.html`, or
  `dist/<template>.<locale>.html` with `layout: 'flat'`. `maizzle serve` lists
  every locale, and picks up a template added or removed.
- **Catalogues checked at build time, v0.1.0** — a missing or broken catalogue, a key
  that is not camelCase, a message that does not parse, a key missing in one
  locale, an argument a translation invents or types differently: the build
  fails, naming the locale and the key.
- **`t`, `locale` and `placeholder` in templates, v0.1.0** — `{{ t('verifyEmail.title')
  }}` translates in the template's locale, and fails the build on an unknown
  key or a wrong, missing or unused argument; `placeholder('name')` writes
  `{{ name }}` for a value only known at send time, and can be passed as an
  ICU argument.
- **The manifest, v0.1.0** — `dist/mail-manifest.json`: per e-mail, its variables and
  the ones a URL attribute starts with (so they decide the scheme), its subject per locale (the
  required `<email>.subject` message) and its files per locale — what
  `createMailRenderer` from `@nxgt/mail/renderer` reads to send the built
  `html` and `text` of a locale, every placeholder filled and escaped at send
  time.
- **Catalogues from a package, v0.1.0** — `i18n({ catalogues: [uiCatalogues] })`:
  catalogues a package ships, as `@nxgt/mail-ui`'s shared messages, merged key
  by key under your project's `locales/<locale>.json`, which overrides any of
  them, and checked with it.
- **Templates from a package, v0.1.0** — `i18n({ templates: [{ dir, emails }] })`:
  folders of templates a package ships, as `@nxgt/mail-presets`' ready
  e-mails, built with your project's own; `dir` is absolute, `emails` keeps
  the ones you name, and a template of the same name in your project's
  `emails/` replaces a package's.
- **`createTranslator` outside templates, v0.1.0** — `createTranslator(catalogues,
  getLanguage)` and `t(key, args, language?)`, shaped like `@nxgt/i18n`, for a
  message an application formats itself.
- **Typed templates and `t` in the editor, v0.1.0** — `t`, `locale` and
  `placeholder` are known to Vue's template checker, so a template that calls
  them type-checks. The plugin writes `.maizzle/nxgt-mail-i18n.d.ts` from the
  catalogues each time the config loads, so an editor completes `t('…')` and
  flags an unknown key or a wrong argument, and `vue-tsc` checks templates in
  CI.
- **The renderer typed by the build, v0.1.0** — after each `maizzle build`, the
  plugin writes `generated/mail.ts`: `MailEmails`, each e-mail with the
  variables it takes, a URL variable as a `string`. With it,
  `createMailRenderer<MailEmails>` from `@nxgt/mail/renderer` refuses an
  unknown e-mail, a missing or unknown variable, or a number for a URL at
  compile time. Rewritten only when it changes;
  `rendererTypes` moves it, or `false` turns it off.
- **A starter project, with v0.1.0** — the official Maizzle starter with
  `defineMailConfig`, the i18n and the UI plugins wired in as the READMEs
  say, built, rendered in `en` and `fr` and served in CI, so the snippets are
  known to work: [`examples/starter`](https://github.com/softistx/nxgt-mail/tree/develop/examples/starter).
  In the repository; its README says how to start your own from npm.
