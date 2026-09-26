# Roadmap

Where `@nxgt/mail-i18n` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

- **i18n as a plugin** — `i18n({ locales, fallbackLocale })`, listed in
  `defineMailConfig`'s `plugins`: one template per e-mail, its text keys into
  `locales/<locale>.json` ICU catalogues, and one output per locale from a
  single `maizzle build` — `dist/<locale>/<template>.html`, or
  `dist/<template>.<locale>.html` with `layout: 'flat'`. `maizzle serve` lists
  every locale, and picks up a template added or removed. Built, not yet
  published.
- **Catalogues checked at build time** — a missing or broken catalogue, a key
  that is not camelCase, a message that does not parse, a key missing in one
  locale, an argument a translation invents or types differently: the build
  fails, naming the locale and the key. Built, not yet published.
- **`t`, `locale` and `placeholder` in templates** — `{{ t('verifyEmail.title')
  }}` translates in the template's locale, and fails the build on an unknown
  key or a wrong, missing or unused argument; `placeholder('name')` writes
  `{{ name }}` for a value only known at send time, and can be passed as an
  ICU argument. Built, not yet published.
- **The manifest** — `dist/mail-manifest.json`: per e-mail, its variables and
  the ones a URL attribute starts with (so they decide the scheme), its subject per locale (the
  required `<email>.subject` message) and its files per locale — what a
  renderer needs to send the built files. Built, not yet published.
- **Catalogues from a package** — `i18n({ catalogues: [uiCatalogues] })`:
  catalogues a package ships, as `@nxgt/mail-ui`'s shared messages, merged key
  by key under your project's `locales/<locale>.json`, which overrides any of
  them, and checked with it. Built, not yet published.
- **Templates from a package** — `i18n({ templates: [{ dir, emails }] })`:
  folders of templates a package ships, as `@nxgt/mail-presets`' ready
  e-mails, built with your project's own; `dir` is absolute, `emails` keeps
  the ones you name, and a template of the same name in your project's
  `emails/` replaces a package's. Built, not yet published.
- **`createTranslator` outside templates** — `createTranslator(catalogues,
  getLanguage)` and `t(key, args, language?)`, shaped like `@nxgt/i18n`, for a
  message an application formats itself. Built, not yet published.
- **Typed templates** — `t`, `locale` and `placeholder` are known to Vue's
  template checker, so a template that calls them type-checks. Built, not yet
  published.
- **A renderer that reads the manifest** — `createMailRenderer` from
  `@nxgt/mail/renderer`: the built `html` and `text` of a locale, the subject
  from the manifest, every placeholder filled and escaped at send time. Built,
  not yet published.
- **Typed `t` in the editor** — the plugin writes
  `.maizzle/nxgt-mail-i18n.d.ts` from the catalogues each time the config
  loads, so an editor completes `t('…')` and flags an unknown key or a wrong
  argument, and `vue-tsc` checks templates in CI. Built, not yet published.

## Next

- **A starter project** — the official Maizzle starter with
  `@nxgt/mail-config`, this plugin and the UI plugin wired in, built in CI, so
  the README's snippet is known to work.
- **The first release, 0.1.0** — `@nxgt/mail-i18n` on npm, building an empty
  Maizzle project in two languages with the README's own snippet.

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

Nothing yet: the items under **Now** ship with the first release, 0.1.0. From
then on, the last ten items are listed here, newest first, and
`CHANGELOG.md` holds the rest.
