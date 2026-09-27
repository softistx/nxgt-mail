# Roadmap

Where `@nxgt/mail-presets` is heading. A direction, not a commitment: there
are no dates here, and the version something shipped in is the only number.

## Now

- **How long a link or a code lives** — `verify-email`, `reset-password`,
  `magic-link` and `sign-in-code` take a required `expiresIn`, a duration
  your code writes in the recipient's language (`'1 hour'`, `'1 heure'`), and
  say `This link expires in {{ expiresIn }}.` or
  `This code expires in {{ expiresIn }}.`, in the HTML and the text part.
  Breaking: a send without it no longer compiles against `MailEmails`, and
  throws [`render: <email> needs the variable expiresIn`](troubleshooting.md#render-reset-password-needs-the-variable-expiresin).
  Built, not yet published.
- **`@nxgt/mail-ui` 0.2** — the peer moves to `^0.2.0`, where a tag that
  resolves to no component fails the build. Built, not yet published.

## Next

Nothing yet.

## Later

Nothing yet. A request is welcome as an
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

The last ten, newest first, each with the version it came in. Everything
before is in the [CHANGELOG](../CHANGELOG.md).

- **`@nxgt/mail-i18n` 0.3, v0.1.2** — the peer moves to `^0.3.0`, the version
  that writes the manifest's `formatVersion`. The e-mails do not change.
- **`@nxgt/mail-i18n` 0.2, v0.1.1** — the peer moves to `^0.2.0`, the version
  that writes its generated files under `.maizzle/emails/`. The e-mails and
  their output do not change.
- **Nine ready e-mails, v0.1.0** — `verify-email`, `reset-password`,
  `password-changed` and `email-changed` for accounts; `sign-in-code` and
  `magic-link` for passwordless sign-in; `new-sign-in` for security; `welcome`
  and `invitation` for the lifecycle. Each is a template of `@nxgt/mail-ui`
  components with its messages in `en` and `fr`, and leaves the values only
  known at send time (`{{ name }}`, `{{ link }}`, …) as placeholders.
- **Presets for the i18n plugin, v0.1.0** — `presets({ only })` answers
  `{ templates, catalogues }` for `i18n({ templates, catalogues })`, so the
  presets are built by your own Maizzle project, with your
  `ui({ brand, theme })`, in every locale you list. `only` keeps the presets
  you name and their messages; a preset that does not exist, or one named
  twice, is refused.
- **Overriding a preset, v0.1.0** — a template of the same name in your project's
  `emails/` replaces a preset, and your `locales/<locale>.json` overrides any
  of its messages key by key.
- **Samples, v0.1.0** — every preset built in `en` and `fr` with the brand `Acme` and
  the default theme, in the repository's
  [`samples/`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail-presets/samples),
  checked against a fresh build, so you can see an e-mail before installing
  anything.
- **A renderer that sends them, v0.1.0** — `createMailRenderer` from
  `@nxgt/mail/renderer` renders the presets' build at send time, each value
  filled and escaped; the build spec renders every preset with it.
- **A starter that uses one, with v0.1.0** — the official Maizzle starter with
  `presets({ only: ['sign-in-code'] })` next to its own e-mail, built,
  rendered in `en` and `fr` and served in CI:
  [`examples/starter`](https://github.com/softistx/nxgt-mail/tree/develop/examples/starter).
  In the repository; its README says how to start your own from npm.
