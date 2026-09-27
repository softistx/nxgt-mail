# Troubleshooting `@nxgt/mail-resend`

Each entry is headed by the message you see. Search this page for the words of
your message.

How the messages are shaped:

- **A message names where the problem is, never the value.** Never the key,
  an address, a subject or what Resend said: Resend's answer is on the
  error's `cause` — `status`, `errorName`, and its own message as `detail`.
- **Every message starts with the call you wrote**: `send: …` or
  `createResendMailer: …`.
- **A `TypeError` is a wiring mistake**, thrown by `createResendMailer` when
  the application starts. Fix the code; no handler should answer one.
- **A `MailError` is a refusal at call time**: a `MailFailure`
  (`MAIL_FAILED`) or a `MailRefused` (`MAIL_REFUSED`), the classes of the
  `@nxgt/mail` peer.

A `send: …` message not on this page comes from `checkMessage` in
`@nxgt/mail` — a message no transport hands over. See
[its troubleshooting](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/troubleshooting.md#sending).

## Index

**Sending**
- [`send: Resend refused the message`](#send-resend-refused-the-message)
- [`send: Resend could not take the message`](#send-resend-could-not-take-the-message)
- [`send: Resend could not be reached`](#send-resend-could-not-be-reached)
- [`send: Resend did not answer within <timeoutMs> ms`](#send-resend-did-not-answer-within-timeoutms-ms)
- [`send: from is missing — give the message a from, or createResendMailer a default one`](#send-from-is-missing--give-the-message-a-from-or-createresendmailer-a-default-one)
- [`Resend answered <status> <name>`](#resend-answered-status-name)

**Wiring**
- [`createResendMailer: options must be an object, as { apiKey }`](#createresendmailer-options-must-be-an-object-as--apikey-)
- [`createResendMailer: apiKey must be a Resend API key — is the environment variable set?`](#createresendmailer-apikey-must-be-a-resend-api-key--is-the-environment-variable-set)
- [`createResendMailer: apiKey holds whitespace — trim the value it was read from`](#createresendmailer-apikey-holds-whitespace--trim-the-value-it-was-read-from)
- [`createResendMailer: baseUrl must be an http: or https: URL`](#createresendmailer-baseurl-must-be-an-http-or-https-url)
- [`createResendMailer: fetch must be a function`](#createresendmailer-fetch-must-be-a-function)
- [`createResendMailer: timeoutMs must be a positive integer`](#createresendmailer-timeoutms-must-be-a-positive-integer)
- [`createResendMailer: timeoutMs must be at most 2147483647 — a longer timer fires at once`](#createresendmailer-timeoutms-must-be-at-most-2147483647--a-longer-timer-fires-at-once)
- [`createResendMailer: from must be an e-mail address, as noreply@example.com or { name, address }`](#createresendmailer-from-must-be-an-e-mail-address-as-noreplyexamplecom-or--name-address-)

**Install and types**
- [`error instanceof MailFailure` is `false`](#error-instanceof-mailfailure-is-false)
- [`TS2322: Type 'string | undefined' is not assignable to type 'string'.`](#ts2322-type-string--undefined-is-not-assignable-to-type-string)
- [`TS2322: Type 'string | null' is not assignable to type 'string'.`](#ts2322-type-string--null-is-not-assignable-to-type-string)

## Sending

### `send: Resend refused the message`

A `MailRefused`, code `MAIL_REFUSED`.

**When:** Resend answered `400` or `422`: a field it does not accept — an
address in a form it refuses, a header it does not allow, a subject too long.

**Why:** Resend will refuse the same message again; retrying it unchanged is
pointless.

**Fix:** read `cause.errorName` and `cause.detail` — Resend's own words:

```ts
import { MailRefused } from '@nxgt/mail';

try {
	await mailer.send(message);
} catch (error) {
	if (error instanceof MailRefused && error.cause instanceof Error) {
		const { status, errorName, detail } = error.cause as Error & {
			status?: number;
			errorName?: string | null;
			detail?: string | null;
		};
		console.warn(status, errorName, detail); // 422 validation_error Invalid `to` field. …
	}
	throw error;
}
```

`detail` may quote an address: keep it out of logs that must not hold one.

### `send: Resend could not take the message`

A `MailFailure`, code `MAIL_FAILED`. **Nothing is known to have been sent**:
Resend answered that it did not take the message, but a `5xx` can come from
a server that accepted it before failing.

**When:** Resend answered with a status that is neither `2xx` nor a refusal:

| `cause.status` | Usually | Fix |
| --- | --- | --- |
| `401` | No key reached Resend | Check the key the process was started with |
| `403` | An invalid or revoked key; a sending domain not verified; a test key sending to someone else than the account's owner | Check the key, and verify the `from` domain in Resend |
| `429` | The rate limit or the daily quota | Send less often, or from a queue that spaces the sends |
| `5xx` | Resend is failing | Retry later |

The transport does not retry: a retry is yours to decide, where you can see
it.

### `send: Resend could not be reached`

A `MailFailure`. **Nothing is known to have been sent**: a connection that
dropped after the request left may have delivered it to Resend.

**When:** `fetch` threw before any answer: DNS, a refused connection, TLS, a
proxy in the way, or a `baseUrl` pointing nowhere. `cause` is the `fetch`
error.

**Fix:** check the network from the process's host
(`curl -I https://api.resend.com`), and `baseUrl` if you set one.

### `send: Resend did not answer within <timeoutMs> ms`

A `MailFailure`. `cause` is the `TimeoutError` that aborted the request.

**When:** no answer within `timeoutMs` (30 seconds by default) — whatever
`fetch` is used: one that ignores the signal is no longer waited for.

**Why:** the request was aborted: Resend may still have accepted the e-mail,
but the transport cannot know, and does not say it was sent.

**Fix:** a slow network or a slow proxy — raise `timeoutMs`, or retry later.
Before retrying, weigh that the first send may have gone through.

### `send: from is missing — give the message a from, or createResendMailer a default one`

A `MailRefused`, thrown before any request.

**When:** the message has no `from`, and the mailer was created without one.

**Fix:** give the mailer a default sender, or the message its own:

```ts
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({
	apiKey: process.env.RESEND_API_KEY ?? '',
	from: { name: 'Acme', address: 'noreply@acme.test' },
});
```

### `Resend answered <status> <name>`

The message of the `cause` of a `MailRefused` or a `MailFailure` — for
example `Resend answered 422 validation_error`, or `Resend answered 503` when
the body named no error. See the entry of the error it is the cause of,
above; `cause.detail` holds Resend's own message.

## Wiring

### `createResendMailer: options must be an object, as { apiKey }`

A `TypeError`. `createResendMailer` was called with nothing, or with the key
itself:

```ts
createResendMailer(process.env.RESEND_API_KEY ?? ''); // ✗
createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '' }); // ✓
```

### `createResendMailer: apiKey must be a Resend API key — is the environment variable set?`

A `TypeError`. `apiKey` is missing, empty or blank — most often an environment
variable that is not set where the process runs. The value is never printed.

**Fix:** set `RESEND_API_KEY` for that process (a deployment's secrets, a
`.env` the process actually loads).

### `createResendMailer: apiKey holds whitespace — trim the value it was read from`

A `TypeError`. The key holds a space or a line break — a key read from a file
or a secret mount keeps its final line break. Sent as is, every request would
fail.

```ts
import { readFileSync } from 'node:fs';
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({ apiKey: readFileSync('/run/secrets/resend', 'utf8').trim() });
```

### `createResendMailer: baseUrl must be an http: or https: URL`

A `TypeError`. `baseUrl` is not a string, or has no scheme:

```ts
createResendMailer({ apiKey, baseUrl: 'api.resend.com' }); // ✗
createResendMailer({ apiKey, baseUrl: 'https://api.resend.com' }); // ✓ — the default
```

### `createResendMailer: fetch must be a function`

A `TypeError`. `fetch` was given something that is not a function — a URL, or
an agent meant for another option. Pass a function `(url, init) =>
Promise<Response>`, or leave it out for the global `fetch`.

### `createResendMailer: timeoutMs must be a positive integer`

A `TypeError`. `timeoutMs` is `0`, negative, a fraction or not a number. It is
milliseconds: `10_000` for ten seconds.

### `createResendMailer: timeoutMs must be at most 2147483647 — a longer timer fires at once`

A `TypeError`. `timeoutMs` is above 2³¹ − 1 milliseconds, about 24.8 days —
often a value in microseconds, or a duration meant as "never". A timer that
long fires at once, and every send would time out.

**Fix:** a timeout in milliseconds, far below the bound; leave it out for the
default, 30 seconds:

```ts
createResendMailer({ apiKey, timeoutMs: Number.MAX_SAFE_INTEGER }); // ✗
createResendMailer({ apiKey, timeoutMs: 60_000 }); // ✓ — one minute
```

### `createResendMailer: from must be an e-mail address, as noreply@example.com or { name, address }`

A `TypeError`. The default `from` is not an address. Most often, a name
written inside the string:

```ts
createResendMailer({ apiKey, from: 'Acme <noreply@acme.test>' }); // ✗
createResendMailer({ apiKey, from: { name: 'Acme', address: 'noreply@acme.test' } }); // ✓
```

## Install and types

### `error instanceof MailFailure` is `false`

Two copies of `@nxgt/mail` are installed, and the transport throws the other
one's class. `@nxgt/mail` is a **peer** of this package: list it in your own
`package.json`, in a range this package accepts, and install again. `bun pm ls
@nxgt/mail` (or `npm ls @nxgt/mail`) should show one version.

### `TS2322: Type 'string | undefined' is not assignable to type 'string'.`

On `apiKey: process.env.RESEND_API_KEY`. Decide what an unset variable means
where you read it; `?? ''` makes it a `TypeError` at start-up:

```ts
const mailer = createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '' });
```

### `TS2322: Type 'string | null' is not assignable to type 'string'.`

`messageId` is `string | null`: an answer may carry no id, and an absence is
`null`. Decide what an absent id means where you read it:

```ts
const { messageId } = await mailer.send(message);
const reference = messageId ?? 'none';
```
