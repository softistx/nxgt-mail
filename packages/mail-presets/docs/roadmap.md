# Roadmap

Where `@nxgt/mail-presets` is heading. A direction, not a commitment: there
are no dates here, and the version something shipped in is the only number.

## Now

- **Nine ready e-mails** — `verify-email`, `reset-password`,
  `password-changed` and `email-changed` for accounts; `sign-in-code` and
  `magic-link` for passwordless sign-in; `new-sign-in` for security; `welcome`
  and `invitation` for the lifecycle. Each is a template of `@nxgt/mail-ui`
  components with its messages in `en` and `fr`, and leaves the values only
  known at send time (`{{ name }}`, `{{ link }}`, …) as placeholders. Built,
  not yet published.
- **Presets for the i18n plugin** — `presets({ only })` answers
  `{ templates, catalogues }` for `i18n({ templates, catalogues })`, so the
  presets are built by your own Maizzle project, with your
  `ui({ brand, theme })`, in every locale you list. `only` keeps the presets
  you name and their messages; a preset that does not exist, or one named
  twice, is refused. Built, not yet published.
- **Overriding a preset** — a template of the same name in your project's
  `emails/` replaces a preset, and your `locales/<locale>.json` overrides any
  of its messages key by key. Built, not yet published.
- **Samples** — every preset built in `en` and `fr` with the brand `Acme` and
  the default theme, in the repository's
  [`samples/`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail-presets/samples),
  checked against a fresh build, so you can see an e-mail before installing
  anything. Built, not yet published.

## Next

- **A renderer that sends them** — `@nxgt/mail`'s `createMailRenderer`: the
  built `html` and `text` of a preset in a locale, its subject from the
  manifest, every placeholder filled and escaped at send time.
- **The first release, 0.1.0** — `@nxgt/mail-presets` on npm, with
  `@nxgt/mail-config`, `@nxgt/mail-i18n` and `@nxgt/mail-ui`, building every
  preset in an empty Maizzle project with the README's own snippet.

## Later

Nothing yet beyond **Next**. A request is welcome as an
[issue](https://github.com/softistx/nxgt-mail/issues).

## Not planned

- **E-mails in a brand of ours** — a preset carries no brand and no colours
  of its own: your project builds it with your `ui({ brand, theme })`. The
  samples use the brand `Acme` only to be looked at.
- **Built HTML to send as is** — `samples/` lives in the repository and is
  not in the package. Sending the samples would send someone else's brand; a
  preset is built by your project, with `maizzle build`.
- **Options to patch a preset** — a preset is changed the way any template is:
  your template of the same name replaces it, and your catalogue overrides its
  messages. There is no per-preset option to learn.

## Shipped

Nothing yet: the items under **Now** ship with the first release, 0.1.0. From
then on, the last ten items are listed here, newest first, and
`CHANGELOG.md` holds the rest.
