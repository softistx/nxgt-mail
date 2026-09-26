# Roadmap

Where `@nxgt/mail-preset` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

`@nxgt/mail-preset` is the default preset of `@nxgt/mail-build`, used at build
time only. How presets are applied — in order, the application's own files
last — is on the
[`@nxgt/mail-build` roadmap](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/roadmap.md).

## Now

Built on the current branch, not yet published: the package is still private
and ships with the first release of `@nxgt/mail-build`.

- **`nxgtPreset()`** — a preset you add to `defineMailConfig({ presets })` and
  get plain, neutral e-mails without writing a layout:
  - a neutral theme — grey and one accent, fonts every client already has —
    as Tailwind CSS 4 tokens (`color.primary`, `font.mono`, `radius.button`…).
    Change the accent and the logo with `brand`, or any token with `theme`; a
    token the preset does not have is a compile error in your config, and a
    `TypeError` from `nxgtPreset()` when the config is loaded;
  - `TransactionalLayout` and the `MailHeading`, `MailText`, `MailButton`,
    `MailLink`, `MailDivider`, `MailSpacer` and `MailCode` components, each
    one replaceable by a file of the same name in your `components/` folder;
  - the shared messages `common.greeting`, `common.footer.why` and
    `common.footer.ignore` in English and French, each one overridable by a
    key of the same name in your catalogues.

## Next

- **Checked in real e-mail clients** — the layout and every component opened
  in Gmail, Outlook and Apple Mail, with the result written down. Until then,
  what the preset uses has been checked against caniemail data only.
- **A dark colour scheme** — tokens for dark mode, so a client that darkens
  e-mails shows the preset's own dark colours. The layout declares a light
  scheme only today.

## Later

- **More locales** — the shared messages in languages beyond English and
  French, so an application in one of them has nothing to translate for the
  layout.
- **More layouts** — layouts beside `TransactionalLayout`, for e-mails that
  are not a single call to action.
- **A warning for a class naming a missing token** — a Tailwind class such as
  `bg-brand` that names none of the preset's tokens is reported at build
  time, where today Tailwind drops it silently. It is built in
  `@nxgt/mail-build`: see
  [its roadmap](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/roadmap.md#later).

## Not planned

- **Components named like Maizzle's own (`Button`, …)** — the preset does not
  replace a component Maizzle ships, and `@nxgt/mail-build` refuses a preset
  or an application component that tries: a replaced built-in could no longer
  be wrapped by a preset's component. The preset's components carry the
  `Mail` prefix instead (`MailButton`); give yours a name of its own.

## Shipped

Nothing yet: what is under **Now** ships with the first release. From then
on, the last ten items are listed here, newest first, and
`CHANGELOG.md` holds the rest.
