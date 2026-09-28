# Roadmap

Where `@nxgt/mail-presets` is heading. A direction, not a commitment: there
are no dates here, and the version something shipped in is the only number.

## Now

Nothing between releases.

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

- **A stable surface, v1.0.0** — semantic versioning from here: a new
  required variable or a renamed catalogue key waits for the next major. The
  `@nxgt/mail-i18n` and `@nxgt/mail-ui` peers move to `^1.0.0`, so upgrade
  the `@nxgt/mail*` packages together. No preset changes.
- **Four more presets, v0.4.0** — `account-deleted` (accounts, with a
  required `expiresIn` for its restoration link), `two-factor-enabled` and
  `two-factor-disabled` (security), and `invitation-accepted` (lifecycle,
  tells the inviter). `PRESETS` now lists thirteen names.
- **`@nxgt/mail-i18n` 0.5, v0.4.0** — the peer moves to `^0.5.0`, the version
  that gives every template `dir`. The e-mails do not change; a project
  building the presets in a right-to-left locale gets `NxLayout`'s and the
  other `@nxgt/mail-ui` components' mirroring for free.
- **Messages under `kebab-case` keys, v0.3.0** — each preset's group is named
  after its file (`verify-email.*`, not `verifyEmail.*`), and the shared ones
  are `presets.link-expires`, `presets.code-expires`, `presets.link-fallback`
  and `presets.not-you`; an override under the old key is no longer read. The
  full list is in the [CHANGELOG](../CHANGELOG.md).
- **How long a link or a code lives, v0.2.0** — `verify-email`,
  `reset-password`, `magic-link`, `sign-in-code` and `invitation` take a
  required `expiresIn`, a duration your code writes in the recipient's
  language (`'1 hour'`, `'1 heure'`), and say
  `This link expires in {{ expiresIn }}.`,
  `This code expires in {{ expiresIn }}.` or
  `This invitation expires in {{ expiresIn }}.`, in the HTML and the text
  part.
  Breaking: a send without it no longer compiles against `MailEmails`, and
  throws [`render: <email> needs the variable expiresIn`](troubleshooting.md#render-reset-password-needs-the-variable-expiresin).
- **`@nxgt/mail-ui` 0.2, v0.2.0** — the peer moves to `^0.2.0`, where a tag
  that resolves to no component fails the build, and the layout, content and
  details components come.
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
