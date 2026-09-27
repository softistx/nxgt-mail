# Testing

Two different things to test, with two different tools:

- **An application that sends e-mail.** Do not call Resend, nor fake it: wire
  `createMemoryMailer()` from `@nxgt/mail` in the tests, read its outbox, and
  make a send fail with `failNext()`. See
  [`@nxgt/mail` — testing](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/testing.md).
- **This transport.** A local server answering as Resend's API does, and
  `baseUrl` pointed at it: the transport's real `fetch`, real HTTP, real JSON.
  That is how this package passes `@nxgt/mail/conformance`, and the rest of
  this page shows it.

## A local Resend

It checks the key, keeps what it accepted, and fails on demand **the way
Resend fails** — a `503` for an outage, a `422 validation_error` for a
refusal — so the suite proves the transport's reading of Resend's answers,
not a wrapper's:

```ts
import type { DeliveredMail } from '@nxgt/mail/conformance';

export const API_KEY = 're_test';

/** The bare addresses of `"name" <address>` or `address`: a quoted name names no one. */
const addressOf = (entry: string) => entry.match(/<([^<>]+)>$/)?.[1] ?? entry;

export function startResend() {
	const delivered: DeliveredMail[] = [];
	const faults: ('outage' | 'refusal')[] = [];
	let attempts = 0;
	const answer = (statusCode: number, name: string, message: string) =>
		Response.json({ statusCode, name, message }, { status: statusCode });

	const server = Bun.serve({
		port: 0,
		hostname: '127.0.0.1',
		async fetch(request) {
			if (request.method !== 'POST' || new URL(request.url).pathname !== '/emails') {
				return answer(404, 'not_found', 'The requested endpoint does not exist.');
			}
			if (request.headers.get('authorization') !== `Bearer ${API_KEY}`) {
				return answer(401, 'missing_api_key', 'Missing API key in the authorization header.');
			}
			attempts += 1; // one hand-over
			const fault = faults.shift();
			if (fault === 'outage') return answer(503, 'internal_server_error', 'Service unavailable.');
			if (fault === 'refusal') return answer(422, 'validation_error', 'Invalid `to` field.');

			const body = (await request.json()) as { to: string[]; subject: string; html: string; text: string };
			delivered.push({ to: body.to.map(addressOf), subject: body.subject, html: body.html, text: body.text });
			return Response.json({ id: `resend-${delivered.length}` });
		},
	});
	return {
		baseUrl: `http://127.0.0.1:${server.port}`,
		delivered,
		faults,
		attempts: () => attempts,
		close: () => server.stop(true),
	};
}
```

`addressOf` above takes the address after the last `<`, which is enough for
the transport's own output. The package's spec reads each `to` entry as an
RFC 5322 address list instead — quoted strings, escapes, commas — as Resend
does, so a transport that forgot to quote a name would deliver to two
addresses there, and fail `send.hostileName`.

## The conformance suite

One fresh server per case, stopped after it:

```ts
import { describe, it } from 'bun:test';
import { describeMailer } from '@nxgt/mail/conformance';
import { createResendMailer } from '@nxgt/mail-resend';
import { API_KEY, startResend } from './local-resend';

describeMailer({
	name: 'createResendMailer',
	runner: { describe, it }, // bun test puts neither on globalThis
	harness: {
		async open() {
			const resend = startResend();
			return {
				mailer: createResendMailer({ apiKey: API_KEY, baseUrl: resend.baseUrl }),
				delivered: async () => [...resend.delivered],
				faults: {
					failNext: async (kind) => {
						resend.faults.push(kind);
					},
					attempts: async () => resend.attempts(),
				},
				close: () => resend.close(),
			};
		},
	},
});
```

All ten cases pass: a send answers `SentMail`, the message arrives byte for
byte (accents, an emoji, `&amp;` in a link), every recipient is delivered to,
a hostile name reaches only its own address, the refusals, and the three
failure cases — an outage is a `MailFailure` with its `cause` and one attempt,
a refusal a `MailRefused`, and the next send goes through.

## Beyond the suite

The package's own specs
([`src/index.spec.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-resend/src/index.spec.ts))
add what the suite does not ask of every transport:

- a `400` is a `MailRefused`; a `403`, a `429` and a `503` are a `MailFailure`
  with the status on `cause`, each tried once;
- a server that is not listening ends in `MailFailure` —
  `send: Resend could not be reached` — with the `fetch` error as `cause`;
- a server that does not answer within `timeoutMs` ends in `MailFailure`, a
  `TimeoutError` as `cause`;
- no message — the error's nor its cause's — holds the key, a recipient's
  address or what Resend said;
- the request: `POST /emails`, the bearer key, JSON, a quoted name,
  `reply_to` and `headers`;
- a `2xx` with no id, or with a body that is not JSON, answers
  `{ messageId: null }`;
- every `TypeError` at wiring.

A `fetch` of your own needs no server at all, when a test only needs to see
the request:

```ts
import { expect, test } from 'bun:test';
import { sampleMessage } from '@nxgt/mail/conformance';
import { createResendMailer } from '@nxgt/mail-resend';

test('posts the message to /emails', async () => {
	const requests: { url: string; body: unknown }[] = [];
	const mailer = createResendMailer({
		apiKey: 're_test',
		fetch: async (url, init) => {
			requests.push({ url, body: JSON.parse(String(init.body)) });
			return Response.json({ id: 'email-1' });
		},
	});
	expect(await mailer.send(sampleMessage)).toEqual({ messageId: 'email-1' });
	expect(requests[0]?.url).toBe('https://api.resend.com/emails');
});
```

## See also

- [`@nxgt/mail` — writing a transport](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/transports.md)
  — the contract, the harness and every case.
- [Errors](errors.md) — the mapping these tests pin down.
