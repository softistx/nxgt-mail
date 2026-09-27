# Testing with the memory mailer

This page is for testing code that sends e-mail: `createMemoryMailer()` keeps
what it accepts in an outbox, refuses what every transport refuses, and can be
told to fail, so a test proves what your code does when a send throws.

```ts
import { expect, it } from 'bun:test';
import { createMemoryMailer } from '@nxgt/mail';

it('sends one e-mail', async () => {
	const mailer = createMemoryMailer();

	await mailer.send({ to: 'ada@example.com', subject: 'Hello', html: '<p>Hello</p>', text: 'Hello' });

	expect(mailer.sent.map((mail) => [mail.messageId, mail.subject])).toEqual([['memory-1', 'Hello']]);
});
```

## The signature

```ts
function createMemoryMailer(): MemoryMailer;

interface MemoryMailer extends Mailer {
	readonly sent: readonly MemoryMail[];
	readonly attempts: number;
	failNext(error?: MailError): void;
	clear(): void;
}

interface MemoryMail extends MailMessage {
	readonly messageId: string;
}
```

A `MemoryMailer` **is** a `Mailer`: pass it wherever your code takes the port.
It takes no option.

## `sent` — the outbox

Every message accepted so far, oldest first, each with the id it was answered:
`memory-1`, `memory-2`, … The counter is per mailer.

`sent` is **a copy** on every read: mutating it, or the message you passed to
`send`, changes nothing in the outbox.

```ts
import { createMemoryMailer } from '@nxgt/mail';

const mailer = createMemoryMailer();
const headers = { 'X-Ref': 'a' };
await mailer.send({ to: 'ada@example.com', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi', headers });
headers['X-Ref'] = 'changed';

mailer.sent[0]?.headers; // { 'X-Ref': 'a' }
```

### Attachments in the outbox

An attachment is kept with its bytes **copied** when it is sent: a caller that
reuses or fills its buffer afterwards does not change what the outbox holds,
and each read of `sent` hands out a fresh copy again. A Node `Buffer` comes
back as a plain `Uint8Array` of the same bytes — compare the bytes, not the
class:

```ts
import { expect, it } from 'bun:test';
import { createMemoryMailer } from '@nxgt/mail';

it('attaches the invoice', async () => {
	const mailer = createMemoryMailer();
	const pdf = Buffer.from('%PDF-1.7');

	await mailer.send({
		to: 'ada@example.com',
		subject: 'Your invoice',
		html: '<p>Your invoice is attached.</p>',
		text: 'Your invoice is attached.',
		attachments: [{ filename: 'invoice-42.pdf', content: pdf, contentType: 'application/pdf' }],
	});
	pdf.fill(0); // changes nothing in the outbox

	const [file] = mailer.sent[0]?.attachments ?? [];
	expect(file?.filename).toBe('invoice-42.pdf');
	expect(file?.contentType).toBe('application/pdf');
	expect(new TextDecoder().decode(file?.content)).toBe('%PDF-1.7');
});
```

An inline image keeps its `contentId`, so a test can check the image the HTML
shows went with it:

```ts
import { expect, it } from 'bun:test';
import { createMemoryMailer } from '@nxgt/mail';

it('sends the logo the receipt shows', async () => {
	const mailer = createMemoryMailer();
	await mailer.send({
		to: 'ada@example.com',
		subject: 'Your receipt',
		html: '<img src="cid:logo@acme.test" alt="Acme"><p>Thank you.</p>',
		text: 'Thank you.',
		attachments: [{ filename: 'logo.png', content: new Uint8Array([0x89, 0x50]), contentType: 'image/png', contentId: 'logo@acme.test' }],
	});
	expect(mailer.sent[0]?.attachments?.[0]?.contentId).toBe('logo@acme.test');
});
```

A `cid:` the HTML shows with no attachment of that `contentId` is refused
with `MailRefused` before anything reaches the outbox, as by every transport.

## `failNext(error?)` — making a send fail

The next send that reaches the hand-over rejects with `error` — by default a
`MailFailure`, as an outage would, with a `cause` (an `Error` whose message is
`memory mailer: failNext`) as a real transport's has. Calls queue: two calls fail the next two
sends, in order. The send after them goes through.

```ts
import { createMemoryMailer, MailRefused } from '@nxgt/mail';

const mailer = createMemoryMailer();
const refused = new MailRefused('send: the provider refused the message');
mailer.failNext(refused); // the first send rejects with this very error
mailer.failNext(); // the second with a MailFailure
```

Settle the expected rejection where it is created, with `.then(ok, ko)`, so a
send that resolves by mistake fails the test rather than slipping past it:

```ts
import { expect, it } from 'bun:test';
import { createMemoryMailer, MailFailure } from '@nxgt/mail';

it('fails the next send when told to', async () => {
	const mailer = createMemoryMailer();
	mailer.failNext();

	const error = await mailer
		.send({ to: 'ada@example.com', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' })
		.then(() => null, (e: unknown) => e);

	expect(error).toBeInstanceOf(MailFailure);
	expect(mailer.sent).toEqual([]);
});
```

## `attempts` — proving nothing retries in secret

How many sends reached the hand-over, failed ones included. A message refused
as malformed never reaches it, and a queued failure keeps waiting for one that
does:

```ts
import { createMemoryMailer } from '@nxgt/mail';

const mailer = createMemoryMailer();
mailer.failNext();

await mailer
	.send({ to: [], subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' })
	.then(() => null, (e: unknown) => e); // MailRefused: to must hold at least one address

mailer.attempts; // 0 — and the failure is still queued for the next well-formed send
```

## `idempotencyKey` — a retry delivers once

The memory mailer honours a message's
[`idempotencyKey`](sending.md#idempotency--sending-once) as Resend does:

- the **same message** under a key it already delivered answers that
  delivery's `messageId`, and nothing more reaches `sent`;
- a **different message** under that key — another subject, another
  recipient, other attachment bytes, any field — is refused with
  `MailRefused`: `send: idempotencyKey was already used for a different message — a key names one e-mail`,
  as Resend answers `409 invalid_idempotent_request`;
- a send that **failed** delivered nothing, so its key stays free, and the
  retry delivers;
- each send still counts in `attempts`, the answered duplicate and the
  refused reuse included: both reached the hand-over;
- `clear()` forgets the keys.

A test proving that a job run twice e-mails once:

```ts
import { expect, it } from 'bun:test';
import { createMemoryMailer, type Mailer, MailRefused } from '@nxgt/mail';

// The code under test: a job that may run more than once for the same order.
async function sendReceipt(mailer: Mailer, orderId: string): Promise<string | null> {
	const { messageId } = await mailer.send({
		to: 'ada@example.com',
		subject: 'Your receipt',
		html: '<p>Thank you for your order.</p>',
		text: 'Thank you for your order.',
		idempotencyKey: `order-${orderId}/receipt`,
	});
	return messageId;
}

it('sends one receipt, however often the job runs', async () => {
	const mailer = createMemoryMailer();

	const first = await sendReceipt(mailer, '42');
	const again = await sendReceipt(mailer, '42');

	expect(again).toBe(first); // 'memory-1', both times
	expect(mailer.sent).toHaveLength(1);
	expect(mailer.attempts).toBe(2);
});

it('refuses another e-mail under the same key', async () => {
	const mailer = createMemoryMailer();
	await sendReceipt(mailer, '42');

	const error = await mailer
		.send({
			to: 'ada@example.com',
			subject: 'Your order has shipped', // another e-mail, the receipt's key
			html: '<p>Your order has shipped.</p>',
			text: 'Your order has shipped.',
			idempotencyKey: 'order-42/receipt',
		})
		.then(() => null, (e: unknown) => e);

	expect(error).toBeInstanceOf(MailRefused); // give it its own key: order-42/shipped
	expect(mailer.sent).toHaveLength(1);
});

it('delivers the retry of a send that failed', async () => {
	const mailer = createMemoryMailer();
	mailer.failNext();

	await sendReceipt(mailer, '42').then(() => null, (e: unknown) => e); // MailFailure
	await sendReceipt(mailer, '42');

	expect(mailer.sent).toHaveLength(1);
	expect(mailer.sent[0]?.idempotencyKey).toBe('order-42/receipt');
});
```

"The same message" is what it would deliver: every field of `MailMessage`,
read by name, the attachments by their bytes. How the object was written
does not count — the order of its fields, of its headers or of its tags,
`to` as one address or a list of one, no `headers`, `attachments` or `tags`
or an empty one,
the bytes in a `Buffer` or a plain `Uint8Array` — and neither does a field
`MailMessage` does not have. SMTP ignores
the key altogether, so this is the behaviour of a deduplicating transport,
not of every one. A queued `failNext` fails the next send even when its key
was already delivered.

## `clear()`

Forgets the outbox, the attempts, any queued failure, and the idempotency
keys. The id counter keeps going, so an id is never reused within one mailer.

## What it refuses

Exactly what every transport refuses, because it calls
[`checkMessage`](transports.md#checkmessage-first) first: no recipient, something
that is not an address, a line break in a name, the subject or a header, a
missing part, an attachment that is not bytes or whose file name or type is
malformed, or an idempotency key that is not 1 to 256 visible ASCII
characters. A test that passes against the memory mailer does not pass by
accident a message a real transport would refuse. The full list is in
[Sending](sending.md#addresses) and
[Sending — attachments](sending.md#attachments).

## A realistic case — the failure path of a service

A service that depends on the port gets the memory mailer in its test, and the
test proves the user is told the truth when the send fails:

```ts
import { describe, expect, it } from 'bun:test';
import { createMemoryMailer, MailError, type Mailer } from '@nxgt/mail';

// The code under test: it answers whether the e-mail left.
async function sendReset(mailer: Mailer, email: string): Promise<{ sent: boolean }> {
	try {
		await mailer.send({
			to: email,
			subject: 'Reset your password',
			html: '<p>Follow the link to reset your password.</p>',
			text: 'Follow the link to reset your password.',
		});
		return { sent: true };
	} catch (error) {
		if (error instanceof MailError) return { sent: false };
		throw error;
	}
}

describe('sendReset', () => {
	it('reports a sent e-mail as sent', async () => {
		const mailer = createMemoryMailer();
		expect(await sendReset(mailer, 'ada@example.com')).toEqual({ sent: true });
		expect(mailer.sent[0]?.to).toBe('ada@example.com');
	});

	it('never reports a failed e-mail as sent, and does not retry it', async () => {
		const mailer = createMemoryMailer();
		mailer.failNext();

		expect(await sendReset(mailer, 'ada@example.com')).toEqual({ sent: false });
		expect(mailer.sent).toEqual([]);
		expect(mailer.attempts).toBe(1);
	});
});
```

## See also

- [Sending](sending.md) — the message shape and the two errors.
- [Writing a transport](transports.md) — the memory mailer is also the
  reference transport the conformance suite is proven against.
