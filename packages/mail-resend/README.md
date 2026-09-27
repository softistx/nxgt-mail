# @nxgt/mail-resend

A [Resend](https://resend.com) transport for
[`@nxgt/mail`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail),
over `fetch`, with no SDK and no dependency. It throws the `MailFailure` and
`MailRefused` of its `@nxgt/mail` peer, so `instanceof` holds whichever
transport is wired, and it passes the `@nxgt/mail/conformance` suite against a
local server answering as Resend's API does.

```ts
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({
	apiKey: process.env.RESEND_API_KEY ?? '',
	from: { name: 'Acme', address: 'noreply@acme.test' },
});

const { messageId } = await mailer.send({
	to: 'ada@example.com',
	subject: 'Confirm your address',
	html: '<p>…</p>',
	text: '…',
}); // Resend's id — or it throws
```

> **Not published yet.** The package is `private` while the rest of the
> repository — a starter — is written. It is published at `0.1.0` with the
> other packages; the surface below is the one that will ship.

## Install

```sh
bun add @nxgt/mail-resend @nxgt/mail
```

Peers, all required:

- `@nxgt/mail` — the port and the errors. One copy in your tree, so
  `error instanceof MailFailure` holds.
- `typescript` (6). Bundler resolution (`"moduleResolution": "bundler"`) is
  what is supported and tested; `nodenext` is out of contract.

It runs wherever `fetch` does — Node, Bun, Deno, an edge runtime — and imports
no Node built-in.

## Exports

| Export | What it is |
| --- | --- |
| `createResendMailer(options)` | A `Mailer` that sends each message with `POST /emails` |
| `ResendMailerOptions` | `{ apiKey, from?, baseUrl?, fetch?, timeoutMs? }` |
| `formatAddress(address)` | An `Address` as Resend reads it: bare, or `"name" <address>` with the name quoted |

## Usage

### Options

| Option | Type | Default | |
| --- | --- | --- | --- |
| `apiKey` | `string` | required | The Resend API key, `re_…` |
| `from` | `Address` | none | The sender of a message that names none |
| `baseUrl` | `string` | `https://api.resend.com` | Where `POST /emails` goes: a proxy, or a test server |
| `fetch` | `(url, init) => Promise<Response>` | the global `fetch` | For a proxy agent, or a test |
| `timeoutMs` | `number` | `30000` | A send taking longer fails with `MailFailure` |

```ts
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '', timeoutMs: 10_000 });

await mailer.send({
	to: [{ name: 'Doe, John', address: 'john@example.com' }],
	from: 'billing@acme.test', // required here: this mailer has no default
	replyTo: 'support@acme.test', // sent as reply_to
	headers: { 'List-Unsubscribe': '<https://acme.test/unsubscribe>' },
	subject: 'Your invoice',
	html: '<p>…</p>',
	text: '…',
});
```

- Every message is checked by `checkMessage` from `@nxgt/mail` first: the
  same refusals, with the same messages, as every transport.
- A message's own `from` wins over the default.
- A name is sent as a quoted string — `"Doe, John" <john@example.com>` — so a
  comma or an angle bracket in it never names another recipient.
- `messageId` is Resend's `id`, or `null` when the answer carries none.

### Errors — a refusal or a failure

| When | Throws | `cause` |
| --- | --- | --- |
| `400`, `422` — Resend refuses the message | `MailRefused` — `send: Resend refused the message` | an `Error` with `status`, `errorName` and Resend's `detail` |
| `401`, `403`, `429`, `5xx`, any other status | `MailFailure` — `send: Resend could not take the message` | the same |
| A network error | `MailFailure` — `send: Resend could not be reached` | the `fetch` error |
| No answer within `timeoutMs` | `MailFailure` — `send: Resend did not answer within 30000 ms` | the `TimeoutError` |
| No sender, on the message or as a default | `MailRefused` — `send: from is missing — give the message a from, or createResendMailer a default one` | — |
| A bad option | `TypeError` from `createResendMailer` | — |

```ts
import { MailFailure, MailRefused } from '@nxgt/mail';

try {
	await mailer.send(message);
} catch (error) {
	if (error instanceof MailRefused) {
		// sending it again unchanged fails again: fix the address or the content
	} else if (error instanceof MailFailure) {
		// nothing was sent: a bad key, a rate limit, an outage — retry later, from a queue
	}
	throw error;
}
```

A message reports a shape, never a value: never the key, an address or what
Resend said — that is on `cause.detail`. Nothing is retried. Every case is in
[Errors](docs/guide/errors.md).

### Testing

In an application's tests, use `createMemoryMailer()` from `@nxgt/mail`. To
test this transport, see [Testing](docs/guide/testing.md): a local Bun server
answering as Resend does, `baseUrl` pointed at it, and `describeMailer`.

## Traps

**Read the key where the process starts, and decide its absence there.**
`apiKey: process.env.RESEND_API_KEY` does not compile (`string | undefined`);
`?? ''` makes an unset variable a `TypeError` at start-up, not a failure at
the first send.

**A key read from a file keeps its line break.** A key holding whitespace is
refused at wiring; trim it.

**A `403` is a failure, not a refusal.** An invalid key or an unverified
sending domain refuses every message alike: it is the wiring that is wrong.

**A `429` is a failure.** Resend rate-limits per second; slow down or queue.
The transport does not wait and retry for you.

## Type safety, counted

**7 plausible mistakes, 7 refused** at compile time, each measured by a
`@ts-expect-error` in
[`test/types/refusals.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-resend/test/types/refusals.ts)
that fails the typecheck the moment it stops holding:

1. No `apiKey`.
2. An `apiKey` that may be `undefined` — `process.env.RESEND_API_KEY` as is.
3. `timeoutMs` written as a duration (`'30s'`).
4. A default `from` without its `address`.
5. Resend's wire format in the options (`reply_to`): a message carries its
   `replyTo`.
6. A `retries` option: the transport tries once.
7. `messageId` read as a `string`: it is `string | null`.

The same file holds the calls that must keep compiling — among them a `fetch`
written as a plain function.

## Documentation

- [The guides](docs/README.md) — the options, the errors, testing.
- [Troubleshooting](docs/troubleshooting.md) — an error message, its cause and
  its fix.
- [Roadmap](docs/roadmap.md) — what is next, and what is deliberately not
  planned.
- [Vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md)
  — the words these pages use, defined once.

## Licence

MIT
