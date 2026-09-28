# Writing a transport

This page is for implementing the `Mailer` port on a provider of your choice —
an HTTP API, an SMTP relay, a queue — and proving it keeps the contract with
`@nxgt/mail/conformance`. If you only use an existing transport, you do not need
it.

```ts
import { describe, it } from 'bun:test';
import { describeMailer } from '@nxgt/mail/conformance';
import { createHttpMailer } from './http-mailer'; // yours, below
import { fakeProvider } from './fake-provider'; // yours, below

describeMailer({
	name: 'the HTTP mailer',
	runner: { describe, it },
	harness: {
		async open() {
			const provider = fakeProvider(); // one per case, never shared
			return {
				mailer: createHttpMailer({ endpoint: 'https://mail.example.test/send', apiKey: 'test', fetch: provider.fetch }),
				delivered: async () => provider.delivered(),
				faults: provider.faults,
			};
		},
	},
});
```

## The contract

```ts
interface Mailer {
	send(message: MailMessage): Promise<SentMail>; // { messageId: string | null }
}
```

A transport:

1. **calls `checkMessage(message)` first**, so every transport refuses the same
   things with the same messages;
2. resolves **only after the hand-over**, with the provider's id, or `null`
   when it gives none;
3. **throws `MailFailure`** when it could not hand the e-mail over — a refused
   connection, a timeout, a 5xx, an expired credential — with the provider's
   error as `cause`;
4. **throws `MailRefused`** when the provider refused the message as malformed,
   with its error as `cause`;
5. **quotes or encodes a recipient's name** as its provider needs it — a
   separate field when the API has one, a quoted or encoded display name in a
   header otherwise. A name is free text: `Ada <mallory@example.test>, "Eve"`
   is a name, and it must reach only its own address;
6. **sends each attachment's bytes as they are**, with its file name and its
   type — base64 in a JSON body, a MIME part over SMTP, the name encoded when
   it is not ASCII — and **never reads a file or fetches a URL** to attach
   one: `MailAttachment` holds bytes only;
7. **uses `idempotencyKey` if the provider deduplicates, and ignores it
   otherwise** — see [The idempotency key](#the-idempotency-key). It never
   refuses a message for carrying one, and never writes it into the e-mail;
8. **never retries in secret**, never resolves `false`, never logs and
   resolves;
9. **defines no error class of its own**. It throws the classes imported from
   `@nxgt/mail`, declared as a required peer, so `error instanceof MailFailure`
   holds in the application whichever transport threw it. `MailError` is
   abstract, so a bare one cannot be thrown:

```json
{
	"peerDependencies": {
		"@nxgt/mail": "^1.0.0"
	}
}
```

A caret covers a major: `^1.0.0` is `>=1.0.0 <2.0.0`. A new `MailMessage`
field arrives in a minor: set the lower bound to the minor whose fields your
transport reads, and release your transport when `@nxgt/mail` adds one it
should handle, or moves to the next major.

An error's `message` reports a shape, never a value: never an address, a
subject, a link, an API key or a connection string. What the provider said goes
on `cause`.

A bad option passed to the transport's factory is a wiring mistake: throw a
bare `TypeError`, at wiring time, not a `MailError` at the first send.

## `checkMessage` first

```ts
function checkMessage(message: MailMessage): void;
```

Throws `MailRefused`, naming **where** the problem is and never the value:

| Refused | `message` |
| --- | --- |
| not an object | `send: the message must be an object` |
| no `to`, or `to: []` | `send: to must hold at least one address` |
| a recipient that is not a bare address — a display name, whitespace, `,`, `;` or `:` in a string — `undefined` included | `send: to is not an e-mail address`, `send: to[0] is not an e-mail address` |
| an address object with a bad address | `send: from.address is not an e-mail address` |
| a line break in a name | `send: from.name must be a string without a line break` |
| a part that is not a string | `send: text must be a string` |
| a line break in the subject | `send: subject must not hold a line break` |
| a header name that is not letters, digits and hyphens | `send: a header name must be letters, digits and hyphens` |
| a line break in a header value | `send: header X-Ref must be a string without a line break` |
| a header the transport writes from the message — `To`, `Cc`, `Bcc`, `From`, `Sender`, `Reply-To`, `Return-Path`, `Subject`, `MIME-Version`, `Content-*`, in any case | `send: header Bcc is reserved — addresses, the subject and the MIME structure are never custom headers` |
| `attachments` that is not an array | `send: attachments must be an array` |
| an attachment that is not an object | `send: attachments[0] must be an object, as { filename, content, contentType }` |
| an attachment whose `content` is not a `Uint8Array` — a string, a path, an `ArrayBuffer` | `send: attachments[0].content must be a Uint8Array — the file's bytes, never a path or a URL` |
| a file name that is empty, `.` or `..`, or holds `/`, `\`, a line break, a control character or a format character | `send: attachments[0].filename must be a file name — not empty, not . or .., without / or \, a line break or a control character` |
| a content type that is not a bare `type/subtype`, or is `multipart/*` or `message/*` | `send: attachments[0].contentType must be a file's type/subtype, as application/pdf — never multipart/* or message/*` |
| a `contentId` that is not 1 to 127 letters, digits and `.` `_` `~` `+` `-` with at most one `@` — angle brackets, a space, a `%`, not a string | `send: attachments[0].contentId must be 1 to 127 letters, digits and . _ ~ + -, with at most one @, as logo@acme.test` |
| two attachments under one `contentId` | `send: attachments[1].contentId is already another attachment's — a contentId names one file` |
| a `cid:` URL the HTML uses — an attribute value, quoted or not, or a CSS `url()` — that no attachment's `contentId` names, percent-decoded | `send: html shows a cid: URL that no attachment's contentId names — attach the image with that contentId` |
| `tags` that is not an object — an array, `null`, a string | `send: tags must be an object of names to values, as { category: 'receipt' }` |
| a tag name that is not 1 to 256 ASCII letters, digits, `_` or `-` | `send: a tag name must be 1 to 256 ASCII letters, digits, _ or -` |
| a tag value that is not 1 to 256 ASCII letters, digits, `_` or `-`, or not a string | `send: tag category must be 1 to 256 ASCII letters, digits, _ or -` |
| an `idempotencyKey` that is not 1 to 256 visible ASCII characters — empty, a space, a line break, a letter outside ASCII, not a string | `send: idempotencyKey must be 1 to 256 visible ASCII characters, as order-42/receipt` |

An empty `attachments` is accepted, and is the same as none: send no
attachment field to the provider then. A `contentId` that passes is safe in
a `Content-ID` header once the transport wraps it in angle brackets, and in
a JSON body as it is. A key that passes is safe to write in
an HTTP header as it is: no line break, no character a header would need to
encode.

Two helpers turn addresses into what a provider wants:

```ts
function addressOf(address: Address): string; // the bare address of either form
function recipientsOf(message: MailMessage): string[]; // every recipient's, in order
```

## A transport, over HTTP

```ts
// http-mailer.ts
import { type Address, checkMessage, MailFailure, type Mailer, MailRefused } from '@nxgt/mail';

export interface HttpMailerOptions {
	readonly endpoint: string;
	readonly apiKey: string;
	/** The sender when a message has none. */
	readonly from?: Address;
	/** For tests; the global fetch otherwise. */
	readonly fetch?: (url: string, init: RequestInit) => Promise<Response>;
}

/** Base64 with no Node built-in, read in slices so a large file spreads no huge argument list. */
function base64Of(bytes: Uint8Array): string {
	let binary = '';
	for (let start = 0; start < bytes.length; start += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
	}
	return btoa(binary);
}

export function createHttpMailer(options: HttpMailerOptions): Mailer {
	// Wiring mistakes: a bare TypeError, now, and never the value.
	if (!/^https?:\/\//.test(options.endpoint)) {
		throw new TypeError('createHttpMailer: endpoint must be an http or https URL');
	}
	if (options.apiKey === '') {
		throw new TypeError('createHttpMailer: apiKey must not be empty');
	}
	const post = options.fetch ?? ((url, init) => fetch(url, init));

	return {
		async send(message) {
			checkMessage(message);
			// The key names the send; it is not part of the e-mail, so it stays out of the body.
			const { idempotencyKey, ...fields } = message;
			// A JSON API takes an attachment's bytes as base64.
			// An empty list is none: the field is left out of the request.
			const attachments = message.attachments?.length
				? message.attachments.map((file) => ({
						filename: file.filename,
						content: base64Of(file.content),
						contentType: file.contentType,
						// An inline image: the HTML shows it as cid:<contentId>. Drop it, and
						// send.inlineImage fails.
						...(file.contentId === undefined ? {} : { contentId: file.contentId }),
					}))
				: undefined;

			let response: Response;
			try {
				response = await post(options.endpoint, {
					method: 'POST',
					headers: {
						authorization: `Bearer ${options.apiKey}`,
						'content-type': 'application/json',
						// This provider deduplicates on a header; with one that does not, leave the key out.
						...(idempotencyKey === undefined ? {} : { 'idempotency-key': idempotencyKey }),
					},
					body: JSON.stringify({ ...fields, from: message.from ?? options.from, attachments }),
				});
			} catch (cause) {
				throw new MailFailure('send: the provider could not be reached', { cause });
			}

			if (!response.ok) {
				const cause = new Error(`the provider answered HTTP ${response.status}`);
				if (response.status === 400 || response.status === 422) {
					throw new MailRefused('send: the provider refused the message', { cause });
				}
				throw new MailFailure('send: the provider failed', { cause });
			}

			// Handed over. A body that is not what we expected is not a failure.
			const body = (await response.json().catch(() => null)) as { id?: unknown } | null;
			return { messageId: typeof body?.id === 'string' && body.id !== '' ? body.id : null };
		},
	};
}
```

## The idempotency key

`idempotencyKey` names a send, so that sending the same message again — a
retry after a timeout, a job run twice — delivers it once. What a transport
does with it depends on its provider:

| The provider | The transport |
| --- | --- |
| deduplicates requests on a key — an `Idempotency-Key` header, a field of its API | passes the key there, as it is. A repeated key answers the first send's id: resolve with it, as for any hand-over. Map the provider's answers: a key reused for a **different** message is a `MailRefused` (sending it again fails again); a key whose first send is **still in progress** is a `MailFailure` (a later retry may work) |
| has no such mechanism — SMTP, most relays | ignores the key. It does not refuse the message, and does not emulate deduplication with state of its own: a cache in one process is not what the caller was promised |

Either way, **never put the key in the e-mail** — not in the body, not as a
header the recipient receives. It names the send, not the message, and it is
derived from what the e-mail is about (`order-42/receipt`): a caller did not
choose to show it. `@nxgt/mail-resend` sends it as Resend's `Idempotency-Key`;
`@nxgt/mail-smtp` ignores it.

Document which one yours does, and for how long the provider remembers a key:
past that window, a retry delivers again.

The conformance suite checks what both kinds share, in `send.idempotencyKey`:
a message with a key is delivered, and the key is in none of its recipients,
subject, HTML or text. The suite reads back no header and no provider request,
so where the key goes is yours to test, as is whether a retry is
deduplicated: the key reaches the provider where it should, and nowhere else.

```ts
import { expect, test } from 'bun:test';
import { sampleMessage } from '@nxgt/mail/conformance';
import { createHttpMailer } from './http-mailer';

test('sends the idempotency key as a header, never in the body', async () => {
	const requests: { headers: Headers; body: Record<string, unknown> }[] = [];
	const mailer = createHttpMailer({
		endpoint: 'https://mail.example.test/send',
		apiKey: 'test',
		fetch: async (_url, init) => {
			requests.push({ headers: new Headers(init.headers), body: JSON.parse(String(init.body)) });
			return Response.json({ id: 'm-1' });
		},
	});
	await mailer.send({ ...sampleMessage, idempotencyKey: 'order-42/receipt' });
	expect(requests[0]?.headers.get('idempotency-key')).toBe('order-42/receipt');
	expect('idempotencyKey' in (requests[0]?.body ?? {})).toBe(false);
});
```

## Tags

`tags` label a send for the provider — its dashboard, its webhooks. A
provider that takes tags gets them in its own shape (Resend: a list of
`{ name, value }`); one that has none ignores them, as SMTP does. Never write
a tag into the e-mail: `send.tags` fails a transport that does. `checkMessage`
has already held each name and value to 1 to 256 ASCII letters, digits, `_`
or `-`, which Resend and Amazon SES both take; a provider's own limit on how
many — Resend's 75 — is the transport's to refuse with `MailRefused`, before
sending.

## Scheduling

`scheduledAt` sends a message later instead of now. `checkMessage` has
already refused anything but a valid `Date` up to 30 days ahead — Resend's own
limit, held for every transport — so a transport only decides what to do with
one that is left:

| Can the provider schedule? | The transport |
| --- | --- |
| yes, an API field or header | sends it there, in the format the provider wants (Resend: `scheduled_at`, ISO 8601, `message.scheduledAt.toISOString()`) |
| no | throws `MailRefused` — never sends the message at once, which would be exactly the mistake `scheduledAt` exists to prevent |

`send.scheduled` sends a message a day ahead and accepts either answer, never
a silent send: it fails a transport whose `delivered()` shows the message
without the `scheduledAt` it was sent with, which is what a transport that
drops the field and sends anyway looks like.

## Batch sending — optional

`sendBatch(messages)` is optional on `Mailer`: implement it only to use your
provider's own batching (Resend's `POST /emails/batch`). Without one, callers
of the exported `sendBatch(mailer, messages)` helper get one `send` per
message, in turn — a correct, if slower, answer every transport gets for
free. Implement it when the provider answers many messages in one request,
and:

- **pre-check every message** with `checkMessage`, before any request goes
  out, so a message near the end that is malformed is known from the start
  and never reaches the provider;
- **answer one `MailBatchResult` per message given, in the same order, never
  fewer** — `{ status: 'sent', sentMail }`, `{ status: 'refused', error }` or
  `{ status: 'failed', error }` — and never throw for one message's own
  outcome: unlike `send`, a batch holds many messages, and one bad one must
  never hide what happened to the others;
- refuse, on its own message, anything the provider's batch call cannot carry
  that a single `send` can (Resend: an attachment, or a message's own
  `idempotencyKey` — Resend takes one per *request*, never one per message);
- when the provider answers a whole request as one — refused, or
  unreachable — report every message of that request the same way, since
  there is no way to tell which one it was about.

`batch.deliversEach` and `batch.refusalPerMessage`, below, call the
`sendBatch` helper against your transport either way — with or without your
own `sendBatch` — so they hold for a transport that relies on the fallback
too.

## The conformance suite

```ts
function describeMailer(options: {
	readonly name: string;
	readonly harness: MailerHarness;
	readonly runner?: MailerRunner;
	readonly skip?: Readonly<Record<string, string>>;
	readonly faults?: boolean;
}): void;
```

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `name` | `string` | — | Heads the `describe` block: `<name> — @nxgt/mail conformance` |
| `harness` | `MailerHarness` | — | Opens a fresh transport and receiving end for each case |
| `runner` | `{ describe, it }` | the global `describe` and `it` | The test framework's functions. **Pass it under `bun test`**, which does not put them on `globalThis` |
| `skip` | `Record<caseId, reason>` | `{}` | Cases to skip, each with its reason, which appears in the test's name |
| `faults` | `boolean` | absent | Absent: the failure cases run, and on a harness without faults they **fail** with `conformance: failure.outage: faults not provided: … — pass faults: false to describeMailer to skip it on purpose`. `false` declares that the harness has no faults: the failure cases are skipped, with the reason in their name |

`runner` is the smallest part of a test framework the suite needs:

```ts
interface MailerRunner {
	describe(name: string, body: () => void): void;
	it: {
		(name: string, body: () => Promise<void>): void;
		skip(name: string, body: () => Promise<void>): void;
	};
}
```

bun:test, vitest and jest all have it. A hand-rolled runner needs `it.skip`
too: every skip — from `skip`, or from `faults: false` — goes through it.

It throws a `TypeError` when no runner is found
(`describeMailer: no test runner found — pass runner: { describe, it } from your test framework`)
and when `skip` names a case that does not exist
(`describeMailer: skip names no case: send.nothing`).

### The cases

| Id | Proves | Needs faults |
| --- | --- | --- |
| `send.answersSentMail` | a send answers `SentMail`, with a non-empty string id or `null` | no |
| `send.deliversBytes` | the subject, the HTML and the text are delivered byte for byte: accents, an emoji, `&amp;` in a link | no |
| `send.recipients` | every recipient is delivered to, written as a string or with a name | no |
| `send.hostileName` | a name holding `<…>`, a comma and quotes — `Ada <mallory@example.test>, "Eve" <eve@example.test>;` — reaches only its own address: quoting the name is the transport's job | no |
| `send.attachment` | an attachment — `sampleAttachment`, every byte from 0 to 255 named `reçu n° 42.pdf`, `application/pdf` — is delivered byte for byte, with its file name and its type (compared without case), and the parts beside it as sent | no |
| `send.inlineImage` | an inline image — `sampleInlineImage`, a PNG with `contentId: 'logo-7f3a@example.test'` — is delivered with that content id (no angle brackets), byte for byte, with its type, and the HTML that shows it as `cid:logo-7f3a@example.test` as sent | no |
| `send.idempotencyKey` | a message with an `idempotencyKey` is delivered — never refused for it — and the key appears in none of its recipients, its subject, its HTML or its text. A fresh key per run, so a harness that remembers keys still delivers | no |
| `send.tags` | a message with `tags` is delivered — never refused for them — and no tag value appears in its recipients, its subject, its HTML or its text. A fresh value per run | no |
| `send.scheduled` | a message scheduled a day ahead is either delivered with its `scheduledAt`, or refused with `MailRefused` — never sent as though `scheduledAt` were absent | no |
| `send.refusesNoRecipient` | no recipient throws `MailRefused`, and nothing is delivered | no |
| `send.refusesLineBreakInSubject` | a line break in the subject throws `MailRefused`, and nothing is delivered | no |
| `send.refusesAddressHeader` | a `Bcc` among the custom headers throws `MailRefused` without the address in its message, and nothing is delivered: it would add a recipient no check saw | no |
| `send.refusesAttachmentPath` | an attachment named with a path (`../…/report.pdf`) throws `MailRefused` without the name in its message, and nothing is delivered: a mail client could save it elsewhere | no |
| `send.refusesWithoutTheValue` | a refusal's `message` does not hold the refused value | no |
| `batch.deliversEach` | `sendBatch(mailer, messages)` — the exported helper, not your transport's own `sendBatch` directly — delivers three messages and reports each `sent`, in order | no |
| `batch.refusalPerMessage` | one message with no recipient is reported `refused`, on its own; the message before it and the one after are still `sent` and delivered | no |
| `failure.outage` | an outage throws `MailFailure` — **the class from `@nxgt/mail`** — with code `MAIL_FAILED` and a `cause`; one attempt; nothing delivered | yes |
| `failure.refusal` | a provider's refusal throws `MailRefused` with code `MAIL_REFUSED` and a `cause`; one attempt | yes |
| `failure.recovers` | after a failure, the next send goes through | yes |

The message they send is exported as `sampleMessage`, its attachment as
`sampleAttachment`, its inline image as `sampleInlineImage`, and the cases as
data: `sendCases` (the fourteen `send.*`), `batchCases` (the two `batch.*`),
`failureCases` (the three `failure.*`) and `allMailerCases` (all three, in the
order above). A transport's own tests can reuse them — send the sample
through your transport, or run only the cases that need no faults:

```ts
import { expect, it } from 'bun:test';
import { recipientsOf } from '@nxgt/mail';
import { failureCases, type MailerHarness, runMailerCase, sampleMessage, sendCases } from '@nxgt/mail/conformance';

declare const harness: MailerHarness; // yours

it('delivers the sample message as sent', async () => {
	const { mailer, delivered, close } = await harness.open();
	await mailer.send(sampleMessage);
	const [mail] = await delivered();
	expect(mail?.to).toEqual(recipientsOf(sampleMessage));
	expect(mail?.subject).toBe(sampleMessage.subject);
	await close?.();
});

for (const mailerCase of sendCases) {
	it(mailerCase.id, async () => {
		await runMailerCase(mailerCase, harness);
	});
}

failureCases.map((c) => c.needs); // ['faults', 'faults', 'faults']
```

## The harness

```ts
interface MailerHarness {
	open(): Promise<OpenedMailer>;
}

interface OpenedMailer {
	readonly mailer: Mailer;
	delivered(): Promise<readonly DeliveredMail[]>;
	readonly faults?: MailerFaults;
	close?(): Promise<void>;
}

interface DeliveredMail {
	readonly to: readonly string[]; // bare addresses, in order
	readonly subject: string;
	readonly html: string;
	readonly text: string;
	readonly attachments?: readonly MailAttachment[]; // as they arrived: [] when none did, with each contentId
	readonly scheduledAt?: Date; // when the message it delivered carried one
}

interface MailerFaults {
	failNext(kind: 'outage' | 'refusal'): Promise<void>;
	attempts(): Promise<number>;
}
```

- `open()` is called **once per case** and must answer a fresh transport and a
  fresh receiving end, so no case sees another's messages.
- `delivered()` reads back what **the receiving end** got — the test SMTP
  server, the recorded request, the fake provider — not what the mailer was
  asked to send. That includes each attachment, decoded back to bytes:
  `mailparser`'s `attachments` over SMTP, the base64 `content` of a JSON body
  otherwise. `attachments` is optional so a harness written before it still
  compiles, but `send.attachment` **fails** on a harness that leaves it out,
  saying so — read them back, or skip the case with its reason. An inline
  image carries its `contentId` as the receiving end read it, without angle
  brackets: `mailparser`'s `cid`, or the id in the JSON body. Over SMTP, parse
  with `simpleParser(stream, { skipImageLinks: true })`: by default
  `mailparser` rewrites each `cid:` in the HTML as a `data:` URL, and
  `send.inlineImage` then reads back HTML that was never sent. `scheduledAt`
  is optional the same way: read back for a message that carried one — Resend's
  `scheduled_at`, re-parsed — or left out on a transport that refuses instead
  of scheduling, whose `send.scheduled` never reaches `delivered()`.
- `close()`, when present, is called after the case, pass or fail.

### Faults — failing the way the provider fails

`faults.failNext('outage')` makes the next hand-over fail as the provider's
outage does — a refused connection, a 503 — and `failNext('refusal')` as its
"malformed message" answer does. `attempts()` answers how many hand-overs the
receiving end saw, failed ones included: it is what proves nothing is retried.

Inject the fault **at the provider**, not in a wrapper that throws in front of
the transport: a wrapper would prove the wrapper, and not the transport's
translation of its provider's errors.

```ts
// fake-provider.ts
import { addressOf, type MailMessage } from '@nxgt/mail';
import type { DeliveredMail, MailerFaults } from '@nxgt/mail/conformance';

/** What the HTTP mailer above posts: a message, its attachments' bytes as base64. */
type Posted = Omit<MailMessage, 'attachments'> & {
	readonly attachments?: readonly { filename: string; content: string; contentType: string; contentId?: string }[];
};

export function fakeProvider() {
	const inbox: Posted[] = [];
	let attempts = 0;
	let next: 'outage' | 'refusal' | null = null;

	const faults: MailerFaults = {
		async failNext(kind) {
			next = kind;
		},
		async attempts() {
			return attempts;
		},
	};

	return {
		faults,
		async fetch(_url: string, init: RequestInit): Promise<Response> {
			attempts += 1;
			const fault = next;
			next = null;
			if (fault === 'outage') return new Response('unavailable', { status: 503 });
			if (fault === 'refusal') return Response.json({ error: 'malformed' }, { status: 422 });
			inbox.push(JSON.parse(String(init.body)) as Posted);
			return Response.json({ id: `fake-${inbox.length}` });
		},
		delivered(): DeliveredMail[] {
			return inbox.map((mail) => ({
				to: (Array.isArray(mail.to) ? mail.to : [mail.to]).map(addressOf),
				subject: mail.subject,
				html: mail.html,
				text: mail.text,
				attachments: (mail.attachments ?? []).map((file) => ({
					filename: file.filename,
					content: Uint8Array.from(atob(file.content), (char) => char.charCodeAt(0)),
					contentType: file.contentType,
					...(file.contentId === undefined ? {} : { contentId: file.contentId }),
				})),
			}));
		},
	};
}
```

With the transport and the fake above, the example at the top of this page
passes all nineteen cases.

### Without faults

A harness that cannot inject faults leaves `faults` out. The failure cases then
**fail**, saying why, until you declare it:

```ts
import { describe, it } from 'bun:test';
import { describeMailer, type MailerHarness } from '@nxgt/mail/conformance';

declare const harness: MailerHarness; // yours, with no faults

describeMailer({ name: 'my transport', harness, runner: { describe, it }, faults: false });
// failure.outage: … (skipped: faults not provided: the failure contract is not proven for this transport)
```

A skip is always reported with its reason, never passed over. The same holds
for `skip`:

```ts
import { describe, it } from 'bun:test';
import { describeMailer, type MailerHarness } from '@nxgt/mail/conformance';

declare const harness: MailerHarness;

describeMailer({
	name: 'my transport',
	harness,
	runner: { describe, it },
	skip: { 'send.recipients': 'the sandbox accepts one recipient per message' },
});
```

## Without `describeMailer`

```ts
function runMailerCase(
	mailerCase: MailerCase,
	harness: MailerHarness,
): Promise<{ readonly skipped: string } | { readonly passed: true }>;

interface MailerCase {
	readonly id: string; // unique and stable: 'send.deliversBytes', 'failure.outage'
	readonly title: string; // what the case proves, as a sentence
	readonly needs?: 'faults'; // present when the case can only run with MailerFaults
	run(context: MailerCaseContext): Promise<void>; // throws on failure, resolves on success
}

interface MailerCaseContext {
	readonly mailer: Mailer;
	delivered(): Promise<readonly DeliveredMail[]>;
	readonly faults: MailerFaults | null; // null, never undefined, when the harness has none
}
```

`runMailerCase(case, harness)` opens the harness, builds the
`MailerCaseContext`, runs the case, and closes the harness, pass or fail — a
close that fails after a failed case does not hide the case's error. It answers
`{ passed: true }`, or `{ skipped: reason }` when the case needs faults the
harness does not have; it throws when the case fails. The cases depend on no
assertion library, so they run under any framework, or none:

```ts
import { allMailerCases, referenceMailerHarness, runMailerCase } from '@nxgt/mail/conformance';

for (const mailerCase of allMailerCases) {
	const result = await runMailerCase(mailerCase, referenceMailerHarness());
	console.log(mailerCase.id, 'skipped' in result ? `skipped: ${result.skipped}` : 'passed');
}
```

The reasons a case can be skipped for are exported as `MAILER_SKIP_REASONS`.
Its one entry, `MAILER_SKIP_REASONS.faults`, is the text `runMailerCase` answers
as `skipped`, and the text `describeMailer` puts in a skipped test's title —
`failure.outage: … (skipped: faults not provided: the failure contract is not
proven for this transport)`. Compare against the constant, not a copy of the
text:

```ts
import { allMailerCases, MAILER_SKIP_REASONS, type MailerHarness, runMailerCase } from '@nxgt/mail/conformance';

declare const harnessWithoutFaults: MailerHarness; // yours

const outage = allMailerCases.find((c) => c.id === 'failure.outage');
if (outage !== undefined) {
	const result = await runMailerCase(outage, harnessWithoutFaults);
	if ('skipped' in result && result.skipped === MAILER_SKIP_REASONS.faults) {
		console.warn('the failure contract is not proven: add faults to the harness');
	}
}
```

Calling a case directly — to run it under your own reporting, say — takes
a context you build from an opened harness:

```ts
import type { MailerCase, MailerCaseContext, MailerHarness } from '@nxgt/mail/conformance';

export async function runDirectly(mailerCase: MailerCase, harness: MailerHarness): Promise<void> {
	const opened = await harness.open();
	const context: MailerCaseContext = {
		mailer: opened.mailer,
		delivered: () => opened.delivered(),
		faults: opened.faults ?? null,
	};
	try {
		await mailerCase.run(context);
	} finally {
		await opened.close?.();
	}
}
```

`referenceMailerHarness()` is the memory mailer's harness — the transport the
suite is proven against, and a second worked example of a harness.

## See also

- [Sending](sending.md) — the message shape and the errors, from the caller's
  side.
- [Testing](testing.md) — the memory mailer, when you test an application
  rather than a transport.
