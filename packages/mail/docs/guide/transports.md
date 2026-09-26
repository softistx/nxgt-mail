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
6. **never retries in secret**, never resolves `false`, never logs and
   resolves;
7. **defines no error class of its own**. It throws the classes imported from
   `@nxgt/mail`, declared as a required peer, so `error instanceof MailFailure`
   holds in the application whichever transport threw it. `MailError` is
   abstract, so a bare one cannot be thrown:

```json
{
	"peerDependencies": {
		"@nxgt/mail": "^0.1.0"
	}
}
```

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
| a recipient that is not an address, `undefined` included | `send: to is not an e-mail address`, `send: to[0] is not an e-mail address` |
| an address object with a bad address | `send: from.address is not an e-mail address` |
| a line break in a name | `send: from.name must be a string without a line break` |
| a part that is not a string | `send: text must be a string` |
| a line break in the subject | `send: subject must not hold a line break` |
| a header name that is not letters, digits and hyphens | `send: a header name must be letters, digits and hyphens` |
| a line break in a header value | `send: header X-Ref must be a string without a line break` |

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

			let response: Response;
			try {
				response = await post(options.endpoint, {
					method: 'POST',
					headers: { authorization: `Bearer ${options.apiKey}`, 'content-type': 'application/json' },
					body: JSON.stringify({ ...message, from: message.from ?? options.from }),
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
| `faults` | `boolean` | — | `false` declares that the harness has no faults: the failure cases are skipped, with the reason in their name |

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
| `send.refusesNoRecipient` | no recipient throws `MailRefused`, and nothing is delivered | no |
| `send.refusesLineBreakInSubject` | a line break in the subject throws `MailRefused`, and nothing is delivered | no |
| `send.refusesWithoutTheValue` | a refusal's `message` does not hold the refused value | no |
| `failure.outage` | an outage throws `MailFailure` — **the class from `@nxgt/mail`** — with code `MAIL_FAILED` and a `cause`; one attempt; nothing delivered | yes |
| `failure.refusal` | a provider's refusal throws `MailRefused` with code `MAIL_REFUSED` and a `cause`; one attempt | yes |
| `failure.recovers` | after a failure, the next send goes through | yes |

The message they send is exported as `sampleMessage`, and the cases as data:
`sendCases`, `failureCases`, `allMailerCases`.

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
  asked to send.
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
import { type MailMessage, recipientsOf } from '@nxgt/mail';
import type { DeliveredMail, MailerFaults } from '@nxgt/mail/conformance';

export function fakeProvider() {
	const inbox: MailMessage[] = [];
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
			inbox.push(JSON.parse(String(init.body)) as MailMessage);
			return Response.json({ id: `fake-${inbox.length}` });
		},
		delivered(): DeliveredMail[] {
			return inbox.map((mail) => ({ to: recipientsOf(mail), subject: mail.subject, html: mail.html, text: mail.text }));
		},
	};
}
```

With the transport and the fake above, the example at the top of this page
passes all ten cases.

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

`runMailerCase(case, harness)` runs one case against a harness, closes it, and
answers `{ passed: true }` or `{ skipped: reason }`; it throws when the case
fails. The cases depend on no assertion library, so they run under any
framework, or none:

```ts
import { allMailerCases, referenceMailerHarness, runMailerCase } from '@nxgt/mail/conformance';

for (const mailerCase of allMailerCases) {
	const result = await runMailerCase(mailerCase, referenceMailerHarness());
	console.log(mailerCase.id, 'skipped' in result ? `skipped: ${result.skipped}` : 'passed');
}
```

`referenceMailerHarness()` is the memory mailer's harness — the transport the
suite is proven against, and a second worked example of a harness.

## See also

- [Sending](sending.md) — the message shape and the errors, from the caller's
  side.
- [Testing](testing.md) — the memory mailer, when you test an application
  rather than a transport.
