# @nxgt/mail

The run-time side of transactional e-mail: the renderer that fills a Maizzle
build made with `@nxgt/mail-i18n`, the `Mailer` port a transport implements,
the shape it sends, the two errors it throws, a memory transport for tests, and
locale selection. **No dependency.**

```ts
import { createMemoryMailer } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' }); // the folder `maizzle build` wrote
const mailer = createMemoryMailer(); // in production, a transport's mailer — see below

const { messageId } = await mailer.send({
	to: { name: 'Ada Lovelace', address: 'ada@example.com' },
	from: 'noreply@example.com',
	...mails.render('verify-email', { name: 'Ada', link: 'https://app.example.com/verify?token=abc' }),
}); // 'memory-1' — or it throws
```

In production, `mailer` comes from a transport:
[`@nxgt/mail-smtp`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail-smtp)
on your nodemailer, or
[`@nxgt/mail-resend`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail-resend)
over `fetch`.

> **1.x.** Semantic versioning: a breaking change waits for the next major,
> and the changelog says what each release changes.

## Install

```sh
bun add @nxgt/mail
```

No runtime dependency. `typescript` (6) is a required peer. Your tsconfig
resolves as a bundler does (`"moduleResolution": "bundler"`): the declarations
import without extensions, so `nodenext` is not supported.

Runs on Node `>=20`, Bun or Deno; CI runs the tests on Bun, and
imports the packed package under Node 20.

## Subpaths

| Import | What it holds |
| --- | --- |
| `@nxgt/mail` | The port (`Mailer`, `MailMessage`, `Rendered`, `SentMail`, `MailBatchResult`, `Address`, `MailAttachment`), the errors (`MailError`, `MailFailure`, `MailRefused`, `MailScheduleRefused`), the neutral delivery events (`MailEvent` and its members, `MailWebhookRefused`), `createMemoryMailer`, `withRetry` with `MailRetryOptions` and `RetryExhausted`, `sendBatch`, `pickLocale` and `parseAcceptLanguage`, `listUnsubscribe` with `ListUnsubscribeOptions` and `ListUnsubscribeHeaders`, and what a transport calls first: `checkMessage`, `checkScheduledAt`, `recipientsOf`, `addressOf`. No Node built-in: it runs anywhere |
| `@nxgt/mail/renderer` | The renderer: `createMailRenderer`, `MailRenderer`, `MailRendererOptions`, `RenderOptions`, `MailVariables`, the types that type it with a build's `MailEmails` (`MailEmailsOf`, `AnyMailEmails`, `RenderArguments`), and `MANIFEST_FORMAT`, the newest manifest format it reads. Reads the build with `node:fs` |
| `@nxgt/mail/conformance` | **For transport authors**: `describeMailer`, its cases as data, `runMailerCase`, the messages they send (`sampleMessage`, `sampleAttachment`, `sampleInlineImage`), and the memory mailer's harness as a worked example |
| `@nxgt/mail/telemetry` | **Optional**: `withMailTelemetry` and `withMailRendererTelemetry`, a span per send and per render on `@opentelemetry/api` — an optional peer, installed only if this subpath is imported |

## Usage

### Rendering — `createMailRenderer`

Build the project with `maizzle build` and the `i18n()` plugin of
`@nxgt/mail-i18n`, deploy its output folder with your server, and create one
renderer at start-up. It reads `mail-manifest.json` and every built file once,
so a missing build fails there, not at the first send:

```ts
import { type Mailer, pickLocale } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';
import type { MailEmails } from './generated/mail'; // written by each build, git-ignored

export const mails = createMailRenderer<MailEmails>({ dir: 'dist' }); // throws now if dist/ is missing

export async function sendVerification(
	mailer: Mailer,
	user: { email: string; name: string; locale: string | null },
	link: string,
): Promise<void> {
	const locale = pickLocale(user.locale, mails.locales, 'en'); // 'fr-CA' renders 'fr'
	await mailer.send({ to: user.email, ...mails.render('verify-email', { name: user.name, link }, { locale }) });
}
```

Each value is HTML-escaped in `html` and written as is in `text` and the
subject; line breaks in the subject become a space. A variable that starts an
`href` or a `src` must be an `http:`, `https:` or `mailto:` URL, or `render`
throws `MailRefused`. A missing or unknown variable, e-mail or locale throws an
`Error`.

`<MailEmails>` is optional. `@nxgt/mail-i18n` writes it after each build, in
`generated/mail.ts`, from the manifest; git-ignore it, and build before
type-checking. With it, the compiler
refuses what `render` would throw: an e-mail the build does not have, a
variable missing or unknown, and a number for a URL variable, as
`Argument of type '"verify-emial"' is not assignable to parameter of type
'"sign-in-code" | "verify-email"'`. Without it, any name and any
`MailVariables` compile, and the same mistakes throw at run time. See
[Rendering](docs/guide/rendering.md) for the options, typing the renderer,
the locale chosen through `getLanguage`, and every error.

A renderer reads every manifest format up to its `MANIFEST_FORMAT`: a build
from any earlier `@nxgt/mail-i18n` keeps working with a newer `@nxgt/mail`, so
a package that ships a prebuilt format-1 build can peer `@nxgt/mail`
`>=0.1.0 <2` — the lower bound is the first `@nxgt/mail` that
reads the build's format. A build in a newer format fails at start-up with
`… is manifest format 2, newer than this @nxgt/mail reads (1) — upgrade
@nxgt/mail`. See
[Rendering — which builds it reads](docs/guide/rendering.md#which-builds-it-reads--manifest_format).

### Sending — the port and `MailMessage`

A `MailMessage` is a rendered e-mail — `subject`, `html`, `text` — plus its
addresses. `Rendered` is what `mails.render(…)` answers, and any function
answering the same shape fits, so an e-mail can also be written by hand:

```ts
import type { Mailer, Rendered, SentMail } from '@nxgt/mail';

function passwordChanged(): Rendered {
	return {
		subject: 'Your password was changed',
		html: '<p>Your password was changed. If it was not you, reset it now.</p>',
		text: 'Your password was changed. If it was not you, reset it now.',
	};
}

export function notifyPasswordChanged(mailer: Mailer, to: string): Promise<SentMail> {
	return mailer.send({
		...passwordChanged(),
		to,
		replyTo: { name: 'Support', address: 'support@example.com' },
		headers: { 'X-Entity-Ref-ID': 'password-changed' },
	});
}
```

`SentMail` is `{ messageId: string | null }`: `null` when the transport gives no
id — an absence, not a failure. See [Sending](docs/guide/sending.md).

### Attachments — bytes, never a path

A file goes with the e-mail as `attachments`: its name, its bytes as a
`Uint8Array` (a Node `Buffer` is one), and its type:

```ts
import { readFile } from 'node:fs/promises';
import type { Mailer, Rendered } from '@nxgt/mail';

export async function sendInvoice(mailer: Mailer, to: string, rendered: Rendered, pdfPath: string): Promise<void> {
	await mailer.send({
		...rendered,
		to,
		attachments: [
			{ filename: 'invoice-2026-09.pdf', content: await readFile(pdfPath), contentType: 'application/pdf' },
		],
	});
}
```

There is no `path`, no URL and no stream: a transport never reads a file or
fetches a URL for you, so a value from outside can never make it attach one.
`checkMessage` refuses a hole in the list, content that is not a `Uint8Array`,
a file name that is empty, `.` or `..`, or holds `/`, `\`, a line break, a
control character or a format character (a right-to-left override), and a
content type that is not a bare `type/subtype` or is a MIME container
(`multipart/*`, `message/*`). An empty list is the same as none.

**A large or sensitive file is a link, not an attachment.** Put a signed,
expiring URL in the template as a URL variable —
`mails.render('invoice-ready', { link: signedUrl })` — and the file never
sits in an inbox. Providers cap the whole message — about 25 MB sending
through Gmail, 40 MB at Resend once encoded — and base64 makes a file a third
larger on the way. See
[Sending — attachments](docs/guide/sending.md#attachments).

### Inline images — `cid:`

An attachment with a `contentId` is an **inline image**: the HTML shows it with
`<img src="cid:…">`, and it arrives with the e-mail instead of being fetched
from a server.

```html
<!-- emails/receipt.vue: the cid: is written in the template -->
<img src="cid:logo@acme.test" alt="Acme" width="120">
```

```ts
import { readFile } from 'node:fs/promises';
import type { Mailer, Rendered } from '@nxgt/mail';

const logo = await readFile('assets/logo.png'); // once, at start-up

export async function sendReceipt(mailer: Mailer, to: string, rendered: Rendered): Promise<void> {
	await mailer.send({
		...rendered,
		to,
		attachments: [{ filename: 'logo.png', content: logo, contentType: 'image/png', contentId: 'logo@acme.test' }],
	});
}
```

A `contentId` is the file's `Content-ID` (RFC 2392) without its angle
brackets: 1 to 127 letters, digits and `.` `_` `~` `+` `-`, with at most one
`@`, unique in the message. **Every `cid:` the HTML uses — an attribute value
or a CSS `url()` — must name an attachment's `contentId`**, or `checkMessage`
refuses the message with `MailRefused`, before a broken image goes out. A `cid:`
is written in the template, never filled at send time: a URL variable holding
`cid:…` is refused, like any URL that is not `http:`, `https:` or `mailto:`.
Some webmails show inline images as plain attachments, or not at all: an
`https:` image, as `@nxgt/mail-ui`'s logo, stays the most portable. See
[Sending — inline images](docs/guide/sending.md#inline-images--cid).

### Idempotency — a retry that delivers once

`idempotencyKey` names a send, so sending it again — a retry after a timeout,
a job run twice — delivers it once where the transport can deduplicate.
Derive it from what the e-mail is about, never from the time or a random
value. The memory mailer honours it, so a test can prove a retry is safe:

```ts
import { expect, it } from 'bun:test';
import { createMemoryMailer } from '@nxgt/mail';

it('sends one receipt, however often the job runs', async () => {
	const mailer = createMemoryMailer();
	const receipt = {
		to: 'ada@example.com',
		subject: 'Your receipt',
		html: '<p>Thank you for your order.</p>',
		text: 'Thank you for your order.',
		idempotencyKey: 'order-42/receipt', // 1 to 256 visible ASCII characters
	};

	const first = await mailer.send(receipt);
	const again = await mailer.send(receipt); // the retry

	expect(again).toEqual(first); // { messageId: 'memory-1' }
	expect(mailer.sent).toHaveLength(1); // delivered once
	expect(mailer.attempts).toBe(2);
});
```

A different message under a key already delivered is refused with
`MailRefused` — a key names one e-mail — and a failed send leaves its key
free, so its retry delivers. `@nxgt/mail-resend`
sends the key as Resend's `Idempotency-Key`, which Resend keeps for 24 hours;
`@nxgt/mail-smtp` ignores it — SMTP has no such mechanism, and a message sent
twice is delivered twice. A key that is not 1 to 256 visible ASCII characters
is refused with `MailRefused`. See
[Sending — idempotency](docs/guide/sending.md#idempotency--sending-once).

### Retrying — `withRetry`

`withRetry(mailer, options)` wraps any `Mailer` so a `MailFailure` — a
transient outage — is retried with exponential backoff and full jitter,
instead of reaching the caller on the first one. A `MailRefused` never is:
sending it again fails again.

```ts
import { type MailMessage, withRetry } from '@nxgt/mail';
import { createResendMailer } from '@nxgt/mail-resend';

declare const receipt: MailMessage;

const mailer = withRetry(createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '' }));

await mailer.send(receipt); // up to 5 tries, by default, before a MailFailure reaches you
```

A message with no `idempotencyKey` gets one, generated once for this logical
send and reused on every retry, so `@nxgt/mail-resend` delivers it once; a
message that already carries a key keeps it. Once every attempt has failed,
the error is the last `MailFailure`, with `attempts` on it:

```ts
import { MailFailure, type Mailer, type MailMessage, type RetryExhausted } from '@nxgt/mail';

declare const mailer: Mailer; // wrapped in withRetry
declare const receipt: MailMessage;

try {
	await mailer.send(receipt);
} catch (error) {
	if (error instanceof MailFailure) console.error(`gave up after ${(error as RetryExhausted).attempts} attempts`, error.cause);
	throw error;
}
```

**SMTP ignores the key outright.** A retry after an *ambiguous* SMTP failure
— a timeout waiting for the response to `DATA`, where the server may already
have accepted the message — can still duplicate the e-mail: `@nxgt/mail-smtp`
throws `MailFailure` for it, as for every other outage, since nothing tells
the two apart. `withRetry` therefore retries it like any other `MailFailure`;
pass `attempts: 1` to a mailer built on SMTP if that risk is not acceptable.
See [Sending — retrying](docs/guide/sending.md#retrying--withretry).

### Sending many at once — `sendBatch`

`sendBatch(mailer, messages)` sends many messages and answers one result per
message, in the same order — never a throw for one message's own outcome:

```ts
import { sendBatch } from '@nxgt/mail';
import type { Mailer, MailMessage } from '@nxgt/mail';

declare const mailer: Mailer;
declare const messages: readonly MailMessage[];

const results = await sendBatch(mailer, messages);
results.forEach((result, index) => {
	if (result.status !== 'sent') console.error(messages[index]?.subject, result.error.message);
});
```

Every message is checked with `checkMessage` before any of them is sent, so a
malformed one is reported `refused` on its own and never reaches the
transport — the others are unaffected. `@nxgt/mail-resend` implements
`sendBatch` with Resend's own `POST /emails/batch`, up to 100 messages per
request; `@nxgt/mail-smtp`, and any `Mailer` with no `sendBatch` of its own,
falls back to sending each message in turn over `send`. `withRetry` passes a
`sendBatch` through untouched (retry the ones that come back `failed`, one by
one, with `send`); `withMailTelemetry` gives it its own span. See
[Sending — sendBatch](docs/guide/sending.md#sending-many-at-once--sendbatch).

### Tags — labels for the provider

`tags` label a send for the provider's dashboard, webhooks and statistics:
what the e-mail is, which plan the account is on. A record of names to values,
each 1 to 256 ASCII letters, digits, `_` or `-`:

```ts
import type { Mailer, Rendered } from '@nxgt/mail';

export async function sendReceipt(mailer: Mailer, to: string, rendered: Rendered, plan: 'free' | 'enterprise'): Promise<void> {
	await mailer.send({ ...rendered, to, tags: { category: 'receipt', plan } });
}
```

A tag is never part of the e-mail: `@nxgt/mail-resend` sends them as Resend's
`tags`, `@nxgt/mail-smtp` ignores them, as it ignores `idempotencyKey`. They
land in the provider's logs: an id or a category, never an address or a
secret. A name or value outside the rule is refused with `MailRefused`,
naming the tag and never the value. See
[Sending — tags](docs/guide/sending.md#tags--labels-for-the-provider).

### Scheduling — `scheduledAt`

`scheduledAt` sends the e-mail later instead of now — a `Date`, no more than
30 days ahead:

```ts
import type { Mailer, Rendered } from '@nxgt/mail';

export async function sendReminder(mailer: Mailer, to: string, rendered: Rendered, remindAt: Date): Promise<void> {
	await mailer.send({ ...rendered, to, scheduledAt: remindAt });
}
```

**A transport either honours it or refuses it — never sends it now instead.**
`@nxgt/mail-resend` sends it as Resend's `scheduled_at`, ISO 8601: Resend
answers an id right away, and sends the e-mail itself later.
`@nxgt/mail-smtp` has no way to schedule a send, and refuses one with
`MailRefused` rather than sending it early. The memory mailer records it, and
includes it in the idempotency fingerprint — the same key rescheduled to a
different moment is a different message. See
[Sending — scheduling](docs/guide/sending.md#scheduling--scheduledat).

`checkMessage` refuses, before anything is sent:

| Written | Answer |
| --- | --- |
| a `Date` up to 30 days ahead, or a few seconds in the past (clock skew) | accepted |
| `'2027-01-01'`, `new Date(Number.NaN)` | `MailRefused`: `send: scheduledAt must be a valid Date` |
| a `Date` more than a minute in the past | `MailRefused`: `send: scheduledAt is in the past` |
| a `Date` more than 30 days ahead — Resend's own limit | `MailRefused`: `send: scheduledAt is more than 30 days ahead — Resend's own limit` |

Cancel a send Resend already accepted with the mailer's own `cancel(messageId)`,
or move it to a new time with `reschedule(messageId, scheduledAt)` — see
[`@nxgt/mail-resend`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail-resend#cancel-and-reschedule).

### One-click unsubscribe — `listUnsubscribe`

Gmail and Yahoo require bulk senders to offer one-click unsubscribe on
marketing mail. `listUnsubscribe` answers its two headers, to spread into
`headers`, with a URL per recipient:

```ts
import { listUnsubscribe, type Mailer, type Rendered } from '@nxgt/mail';

export async function sendNewsletter(
	mailer: Mailer,
	rendered: Rendered,
	subscriber: { email: string; unsubscribeToken: string },
): Promise<void> {
	await mailer.send({
		...rendered,
		to: subscriber.email,
		headers: {
			...listUnsubscribe({
				url: `https://example.com/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`,
				mailto: 'unsubscribe@example.com', // optional
			}),
		},
	});
}
// List-Unsubscribe: <https://example.com/unsubscribe?token=…>, <mailto:unsubscribe@example.com>
// List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

The URL must start with `https://`, be printable ASCII, carry no user or
password, and hold no `<`, `>`, double quote, raw comma (percent-encode
it: `%2C`) or `%` that starts no escape, and `mailto` must be a bare ASCII
address. The URL is written as a parser reads it (`new URL(url).href`: the
host lowered, an empty `@` or extra slashes dropped), and checked again:
`https://a%2Cb.test/` writes a raw comma, so it is refused. Anything else is a
`MailRefused` that never quotes the URL — its token is a credential. Your
endpoint must unsubscribe on a `POST` with the body
`List-Unsubscribe=One-Click`, with no login and no confirmation. It belongs on
marketing and bulk mail, not on a password reset or a sign-in code. See
[Sending — one-click unsubscribe](docs/guide/sending.md#one-click-unsubscribe)
for the endpoint and DKIM.

### Delivery events — `MailEvent`

What a provider reports **after** `send` hands a message over: delivered,
bounced, complained, delayed — and, if the provider tracks it, opened or
clicked. Neutral, provider-free: a webhook subpath like
`@nxgt/mail-resend/webhooks` verifies the provider's signature and maps its
own payload to this shape.

```ts
import type { MailEvent } from '@nxgt/mail';

function handle(event: MailEvent): void {
	if (event.type === 'bounced' && event.bounceType === 'hard') {
		// the address itself is bad: never send it again
	}
}
```

Every event carries `messageId` (the id `send` answered), `recipient`,
`timestamp`, `tags` and `raw` — the provider's own payload, untouched. **No
PII beyond what the provider already sends**: `recipient` is the address the
provider itself reports, and some providers put more inside `raw` for
`opened` and `clicked` (an IP address, a user agent) — read it only when you
accept that. An event type a package does not map is `null`, never a throw;
a webhook request that cannot be trusted throws `MailWebhookRefused`
(`INVALID_SIGNATURE`, `EXPIRED_TIMESTAMP`), so a handler answers `401`. See
[Delivery events](docs/guide/events.md) for the shape, and
[`@nxgt/mail-resend/webhooks`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail-resend#webhooks--delivery-events)
for verifying Resend's.

### Errors — switch on `code`

Both errors extend `MailError`, whose `code` is a union a `switch` exhausts.
`MailError` is abstract: catch it, but throw `MailFailure` or `MailRefused`.

```ts
import { MailError, type MailErrorCode, type Mailer, type MailMessage } from '@nxgt/mail';

function statusOf(code: MailErrorCode): number {
	switch (code) {
		case 'MAIL_FAILED':
			return 503; // nothing is known to have been sent: retry later, or say it failed
		case 'MAIL_REFUSED':
			return 422; // the e-mail itself is malformed: sending it again fails again
	}
}

export async function sendOrRespond(mailer: Mailer, message: MailMessage): Promise<Response> {
	try {
		await mailer.send(message);
		return new Response(null, { status: 202 });
	} catch (error) {
		if (!(error instanceof MailError)) throw error;
		return Response.json({ code: error.code }, { status: statusOf(error.code) });
	}
}
```

`MailFailure` carries the transport's own error as `cause`. An error's `message`
names **where** the problem is, never the value: never an address, a subject or
a link. See [Sending — errors](docs/guide/sending.md#errors).

### Testing — the memory mailer

`createMemoryMailer()` refuses what every transport refuses, keeps an outbox,
and can be told to fail:

```ts
import { expect, it } from 'bun:test';
import { createMemoryMailer, MailFailure } from '@nxgt/mail';

it('says so when the e-mail could not be sent', async () => {
	const mailer = createMemoryMailer();
	mailer.failNext(); // the next send rejects with MailFailure, as an outage would

	const error = await mailer
		.send({ to: 'ada@example.com', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' })
		.then(() => null, (e: unknown) => e);

	expect(error).toBeInstanceOf(MailFailure);
	expect(mailer.sent).toEqual([]); // the outbox
	expect(mailer.attempts).toBe(1); // nothing retried in secret
});
```

See [Testing](docs/guide/testing.md).

### Locales — `pickLocale` and `parseAcceptLanguage`

The locale of an e-mail is the **recipient's**: their stored preference first,
then, if the recipient is the visitor, their `Accept-Language`:

```ts
import { parseAcceptLanguage, pickLocale } from '@nxgt/mail';

const locale = pickLocale(
	['fr-CA', ...parseAcceptLanguage('de;q=0.9,en;q=0.8')],
	['en', 'fr'],
	'en',
); // 'fr' — typed 'en' | 'fr'
```

`fr-CA` matches `fr`; nothing matching answers the fallback. See
[Locales](docs/guide/locales.md).

### Writing a transport — `checkMessage` and `describeMailer`

A transport calls `checkMessage` first, quotes or encodes a recipient's name
itself (a name is free text), throws the classes imported from its `@nxgt/mail`
peer, and passes the conformance suite:

```ts
import { checkMessage, MailFailure, MailRefused, type Mailer, recipientsOf } from '@nxgt/mail';

// JSON has no bytes: an attachment travels as base64, read in slices.
function base64Of(bytes: Uint8Array): string {
	let binary = '';
	for (let start = 0; start < bytes.length; start += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
	}
	return btoa(binary);
}

export function createHttpMailer(endpoint: string, apiKey: string): Mailer {
	return {
		async send(message) {
			checkMessage(message); // MailRefused, naming where, never the value
			const { idempotencyKey, ...fields } = message; // names the send: never in the body
			const attachments = message.attachments?.length
				? message.attachments.map((file) => ({ ...file, content: base64Of(file.content) }))
				: undefined; // an empty list is none
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					authorization: `Bearer ${apiKey}`,
					'content-type': 'application/json',
					// if the provider deduplicates; a transport whose provider cannot ignores the key
					...(idempotencyKey === undefined ? {} : { 'idempotency-key': idempotencyKey }),
				},
				body: JSON.stringify({ ...fields, to: recipientsOf(message), attachments }),
			}).catch((cause: unknown) => {
				throw new MailFailure('send: the provider could not be reached', { cause });
			});
			const cause = new Error(`the provider answered HTTP ${response.status}`);
			if (response.status === 400 || response.status === 422) {
				throw new MailRefused('send: the provider refused the message', { cause });
			}
			if (!response.ok) throw new MailFailure('send: the provider failed', { cause });
			return { messageId: response.headers.get('x-message-id') }; // null when absent
		},
	};
}
```

```ts
import { describe, it } from 'bun:test';
import { describeMailer, referenceMailerHarness } from '@nxgt/mail/conformance';

describeMailer({
	name: 'the memory mailer',
	harness: referenceMailerHarness(), // yours: open() a fresh mailer, read back what it delivered
	runner: { describe, it },
});
```

See [Writing a transport](docs/guide/transports.md) for the harness, faults and
skips.

### Observability — `withMailTelemetry` and `withMailRendererTelemetry`

`@nxgt/mail/telemetry` wraps a `Mailer` or a `MailRenderer` with a span, on
`@opentelemetry/api` — an **optional peer**: with none installed, every call
still runs, and produces nothing.

```ts
import { withMailTelemetry, withMailRendererTelemetry } from '@nxgt/mail/telemetry';
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = withMailRendererTelemetry(createMailRenderer({ dir: 'dist' })); // span mail.render, per call
const mailer = withMailTelemetry(resendMailer, { transport: 'resend' }); // span mail.send, per call

await mailer.send({ to, ...mails.render('verify-email', { name, link }) });
```

`mail.send` (kind `CLIENT`) carries the transport's name, the recipient
**count**, the tags' **names** (never their values), whether an idempotency
key or a schedule was set, the e-mail's name when `emailName` is given (there
being nothing on `MailMessage` that carries it), and the outcome. `mail.render`
carries the e-mail's name — always known there — and the outcome; `render`
stays synchronous, the span opening and closing within the one call. Both
record a duration histogram and a counter, by outcome.

**Never an address, a subject, a body, an attachment or a placeholder's
value** — only a shape, the same invariant `MailError`'s own messages hold.
`telemetry.spec.ts` asserts it: the address, the subject and the body used in
its fixtures never occur in any attribute or event either function writes.

**A refusal is an answer.** `MailRefused` ends the span `ok`, with
`mail.outcome: 'refused'` and `error.type` set to its code; `MailFailure` (or
anything else) ends it `error`, with `mail.outcome: 'failure'` and the
exception recorded — as a name and the `MailErrorCode`, **never the thrown
error's own `message` or `stack`**, which a hand-rolled `Mailer` may have
built from the message. Either way the error is rethrown unchanged:
telemetry only observes.

**With a retry decorator, `withMailTelemetry` goes on the outside**:
`withMailTelemetry(withRetry(mailer), { transport })`. One call from your code is
one span, its duration and outcome the whole retried attempt — the shape a
caller reads a trace for. Put it inside instead
(`withRetry(withMailTelemetry(mailer, { transport }))`) only to see each attempt
of its own, at the cost of several `mail.send` spans for one `send()` call.

See [Observability](docs/guide/observability.md) for every attribute, and the
metric names.

## Traps

**A failure throws; never map it to "sent".** A mailer that could not hand an
e-mail over rejects with `MailFailure`; it never answers `false`, and it never
logs and resolves. A caller that reports a failed send as sent has told a user
to check an inbox that will stay empty. The conformance suite fails a transport
that breaks the rule.

**Deploy the build with the server, and point `dir` at it.** `dir` is read
from the working directory; resolve it from the module when the process may
start elsewhere: `fileURLToPath(new URL('../mails/dist', import.meta.url))`.

**The renderer needs a file system.** `@nxgt/mail/renderer` imports
`node:fs`: it runs on Node, Bun and Deno, not on an edge runtime without `fs`.
`@nxgt/mail` itself imports no Node built-in.

**Create the renderer once.** It reads the whole build when created; one per
request reads it every time, and a rebuild is only seen by a new renderer.

**`{ locale }` must be one of `mails.locales`, spelled the same.** `'fr-CA'`
throws where the build has `fr`; pass
`pickLocale(user.locale, mails.locales, 'en')`.

**A URL variable is refused unless it is `http:`, `https:` or `mailto:`.**
`render` throws `MailRefused` before anything is sent, so keep it inside the
`try` that handles `MailError`.

**A string address is only an address.** `'Ada <ada@example.com>'` is refused
with `MailRefused`; write `{ name: 'Ada', address: 'ada@example.com' }`.

**Never fire and forget a send.** `void mailer.send(message)` turns a failure
into an unhandled rejection and the user into someone waiting for an e-mail
that never comes. `await` it, or hand it to a queue that does.

**An attachment is bytes you already hold.** Read the file first
(`await readFile(path)`, `new Uint8Array(await response.arrayBuffer())`);
a `path` or a URL is a compile error and a `MailRefused`. Past a few
megabytes, send a signed link instead.

**A `cid:` in the HTML needs its attachment.** `<img src="cid:logo">` with no
attachment whose `contentId` is `logo` — or one spelled `<logo>`, or in other
capitals — is a `MailRefused`: attach the image, with the id written as the
HTML writes it.

**A custom header cannot set an address.** `headers: { Bcc: '…' }` would add
a recipient no check saw: `checkMessage` refuses `To`, `Cc`, `Bcc`, `From`,
`Sender`, `Reply-To`, `Return-Path`, `Subject`, `MIME-Version` and
`Content-*` among `headers`, in any case. Use `to`, `from` and `replyTo`.

**A refusal is not worth retrying; a failure may be.** `MAIL_REFUSED` fails
again unchanged. Nothing in this package retries a `MAIL_FAILED`: a retry is
your decision, made where you can see it.

**An idempotency key from the clock or a random value protects nothing.**
``idempotencyKey: `receipt-${Date.now()}` `` gives the retry a new key, and
the e-mail goes out twice; write ``idempotencyKey: `order-${order.id}/receipt` ``.

**`scheduledAt` is not a queue.** It sends later through the transport's own
mechanism (Resend keeps it, SMTP has none); it does not survive a process
restart on its own, and rescheduling it is not supported — send a new message
with a new `scheduledAt` instead, under a new `idempotencyKey` if the old one
already reached the transport.

**The locale is the recipient's, not the request's.** An administrator who
invites a user sends the invitation in the *user's* locale:
`pickLocale(invitee.locale, supported, fallback)`.

**A transport defines no error class.** It throws `MailFailure` and
`MailRefused` from its `@nxgt/mail` peer; its own copy fails `instanceof`, and
the conformance suite with it.

**Under `bun test`, pass `runner: { describe, it }` to `describeMailer`.** Bun
gives a test file `describe` and `it` as bare identifiers, not on `globalThis`.

## Type safety, counted

**31 plausible mistakes, 31 refused** at compile time, each measured by a
`@ts-expect-error` in
[`test/types/refusals.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/test/types/refusals.ts)
that fails the typecheck the moment it stops holding:

1. A `MailMessage` without `to`.
2. A `MailMessage` without a `text` part.
3. An address object without its `address`.
4. A `Mailer` without `send`.
5. A `Mailer` whose `send` answers a boolean.
6. A `SentMail` whose `messageId` is `undefined` rather than `null`.
7. A `pickLocale` fallback that is not one of the supported locales.
8. A `MailErrorCode` the union does not declare.
9. A bare `new MailError(…)` — it is abstract, so nothing throws an error that
   passes a `code` check and fails `instanceof MailFailure`.
10. A `createMailRenderer` without `dir`, the build's output folder.
11. A `getLanguage` given as a locale rather than a function answering one.
12. A `render` variable that is neither a string nor a number (a `URL`).

With the renderer given the build's `MailEmails`
(`createMailRenderer<MailEmails>(…)`):

The name written as a literal and the variables at the call, as usual:

13. An e-mail the build does not have (`render('verify-emial', …)`).
14. A variable the e-mail does not take.
15. A variable the e-mail takes, left out.
16. The variables left out altogether, for an e-mail that takes some.
17. A number for a URL variable: a URL is a string.

And an attachment:

18. Its `content` as a string: an attachment is bytes, a `Uint8Array`.
19. A `path` instead of the bytes: no transport reads a file for you.
20. No `contentType`: nothing guesses it from the file name.
21. One attachment, not in a list.

And the idempotency key:

22. A number (`idempotencyKey: order.id`): the key is a string, as
    `order-42/receipt`.

And one-click unsubscribe:

23. A `URL` object as `listUnsubscribe`'s `url`: the header holds text, so
    pass `url.href`.

And an inline image:

24. nodemailer's `cid` instead of `contentId` on an attachment.

And tags:

25. Tags written as Resend's list of `{ name, value }`: the port's are a
    record, `{ category: 'receipt' }`.

And scheduling:

26. `scheduledAt` given as an ISO string: the field is a `Date`, checked at
    run time.

And `withRetry`:

27. `attempts` given as a numeral string (`'5'`): it is a number, checked at
    wiring time.

And delivery events:

28. A `MailEventType` the union does not declare (`'unsubscribed'`): an
    unmapped webhook event is `null`, never a seventh member.
29. A `MailBouncedEvent` without its `bounceType`: every provider that reports
    a bounce classifies it hard or soft.

And `sendBatch`:

30. A `Mailer`'s `sendBatch` answering booleans: each message's outcome is
    `sent`, `refused` or `failed`, never a bare `boolean`, as `send` never
    answers one either.
31. A `MailScheduleErrorCode` the union does not declare: a provider's
    `cancel` or `reschedule` refuses with `ALREADY_SENT` or `UNKNOWN_ID`,
    never a third code of its own.

The same file holds the calls that must keep compiling: a refusal that refuses
the correct call is a bug.

## Documentation

- [The guides](docs/README.md) — one page per area, with every option and error.
- [Troubleshooting](docs/troubleshooting.md) — an error message, its cause and
  its fix.
- [Roadmap](docs/roadmap.md) — what is next, and what is deliberately not
  planned.
- [Vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md)
  — the words these pages use, defined once.
- [The starter](https://github.com/softistx/nxgt-mail/tree/develop/examples/starter)
  — a Maizzle project that builds, renders and sends one e-mail, to copy.

## Licence

MIT
