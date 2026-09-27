# Roadmap

Where `@nxgt/mail-smtp` is heading. A direction, not a commitment: there are
no dates here, and the version something shipped in is the only number.

## Now

- **An SMTP transport on your nodemailer** — `createSmtpMailer({ transporter,
  from })`: every SMTP option is nodemailer's, set where you create the
  transporter. Each message is checked as every transport checks it, a name is
  quoted by nodemailer so it names one recipient, and nothing is read from a
  file or a URL. Built, not yet published.
- **Errors you can act on** — a permanent `5xx` on a recipient or the content
  is a `MailRefused`; an unreachable server, a timeout, a `4xx` or refused
  credentials is a `MailFailure`, nodemailer's error on `cause`. The classes
  are `@nxgt/mail`'s, so `instanceof` holds. Built, not yet published.
- **Proven against a real server** — the `@nxgt/mail/conformance` suite
  passes against a local `smtp-server`, what arrived read back with
  `mailparser`. Built, not yet published.

## Next

- **The first release, 0.1.0** — on npm with `@nxgt/mail` and the other
  packages.

## Later

Nothing planned yet. Say what you need in an issue.

## Not planned

- **SMTP options of our own** — host, port, TLS, pooling, DKIM and timeouts
  are nodemailer's; wrapping them would lag behind it. You create the
  transporter.
- **Silent retries** — the transport tries once. A retry is the caller's
  decision, made where it can be seen; a hidden one can send the same e-mail
  twice.
- **A transport's own error class** — it throws `@nxgt/mail`'s `MailFailure`
  and `MailRefused`, so `instanceof` holds whichever transport you wire.
- **Attachments and files read by nodemailer** — a message is three strings;
  `disableFileAccess` and `disableUrlAccess` stay on.
- **Bundling nodemailer** — it is a peer: one copy, the version you choose.

## Shipped

Nothing yet: everything under **Now** ships with the first release, 0.1.0.
From then on, the last ten items are listed here, newest first, and
`CHANGELOG.md` holds the rest.
