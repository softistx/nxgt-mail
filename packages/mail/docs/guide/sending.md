# Sending

This page is for calling `mailer.send`: the shape of what it takes, the
addresses and headers it accepts, what it answers, and what it throws.

```ts
import { createMemoryMailer } from '@nxgt/mail';

const mailer = createMemoryMailer(); // in production, a transport's mailer

const sent = await mailer.send({
	to: 'ada@example.com',
	from: { name: 'Example', address: 'noreply@example.com' },
	subject: 'Your password was changed',
	html: '<p>Your password was changed.</p>',
	text: 'Your password was changed.',
});

sent.messageId; // 'memory-1'
```

## The port

```ts
interface Mailer {
	send(message: MailMessage): Promise<SentMail>;
}

interface SentMail {
	readonly messageId: string | null;
}
```

`send` resolves **only once the transport has handed the e-mail over** to its
provider. `messageId` is the id the provider gave it, or `null` when it gives
none — an absence, not a failure. It is not a promise the e-mail reached an
inbox: a bounce happens after the hand-over, and `send` does not report it.

Anything else rejects, with one of the two errors below. A mailer never
resolves `false` and never logs and resolves.

Depend on `Mailer`, not on a transport, so a test can pass the memory mailer
where production passes SMTP:

```ts
import type { Mailer } from '@nxgt/mail';

export class Accounts {
	constructor(private readonly mailer: Mailer) {}

	async passwordChanged(user: { email: string }): Promise<void> {
		await this.mailer.send({
			to: user.email,
			subject: 'Your password was changed',
			html: '<p>Your password was changed.</p>',
			text: 'Your password was changed.',
		});
	}
}
```

## The message

```ts
interface Rendered {
	readonly subject: string;
	readonly html: string;
	readonly text: string;
}

interface MailMessage extends Rendered {
	readonly to: Address | readonly Address[];
	readonly from?: Address;
	readonly replyTo?: Address;
	readonly headers?: Readonly<Record<string, string>>;
}
```

| Field | Type | Required | Effect |
| --- | --- | --- | --- |
| `subject` | `string` | yes | The subject line. No line break: a line break in a subject is a header injection |
| `html` | `string` | yes | The HTML part, sent as is — escaping is the renderer's job |
| `text` | `string` | yes | The plain-text part. Every e-mail has one |
| `to` | `Address \| readonly Address[]` | yes | One recipient or several, at least one |
| `from` | `Address` | no | The sender. `checkMessage` does not require one: a transport is usually wired with a default sender, and one without a default may refuse a message without `from` — see its documentation |
| `replyTo` | `Address` | no | Where replies go |
| `headers` | `Record<string, string>` | no | Extra headers, such as `List-Unsubscribe` |

`Rendered` is what the renderer answers — `mails.render('verify-email', { name, link })`
fills the values only known at send time into a built Maizzle template — and a
rendered e-mail is spread into the message and addressed:

```ts
import { type Mailer } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' });

export async function sendVerification(mailer: Mailer, to: string, name: string, link: string): Promise<void> {
	await mailer.send({ to, ...mails.render('verify-email', { name, link }) });
}
```

See [Rendering](rendering.md). Any function answering the same shape fits too:

```ts
import type { Mailer, Rendered } from '@nxgt/mail';

// Hand-written: any function answering Rendered is accepted.
function welcome(): Rendered {
	return {
		subject: 'Welcome aboard',
		html: '<p>Welcome aboard.</p>',
		text: 'Welcome aboard.',
	};
}

export async function sendWelcome(mailer: Mailer, email: string): Promise<void> {
	await mailer.send({ ...welcome(), to: email });
}
```

Escaping is the renderer's job: `createMailRenderer` HTML-escapes every value
it fills into `html` ([Rendering — escaping](rendering.md#escaping)). A
hand-written function that interpolates a value must escape it in `html`
itself.

## Addresses

```ts
type Address = string | { readonly name: string; readonly address: string };
```

A string is **only** an address. A display name goes in the object form, so a
transport never parses one. A name is free text — `Doe, John` is a name — and
is refused only when it holds a line break; quoting or encoding it in a header
is the transport's job, which the conformance suite checks:

```ts
import type { MailMessage, Rendered } from '@nxgt/mail';

declare const rendered: Rendered;

const message: MailMessage = {
	...rendered,
	to: ['ada@example.com', { name: 'Grace Hopper', address: 'grace@example.com' }],
	from: { name: 'Example', address: 'noreply@example.com' },
	replyTo: 'support@example.com',
};
```

What is checked is deliberately loose: one `@`, something on each side, no
whitespace and no angle bracket. Whether the mailbox exists is the receiving
server's question.

| Written | Answer |
| --- | --- |
| `'ada@example.com'` | accepted |
| `{ name: 'Ada', address: 'ada@example.com' }` | accepted |
| `'Ada <ada@example.com>'` | `MailRefused`: `send: to is not an e-mail address` |
| `{ name: 'Doe, John', address: 'john@example.com' }` | accepted: a name is free text |
| no `to`, or `to: []` | `MailRefused`: `send: to must hold at least one address` |
| `to: [undefined]` | `MailRefused`: `send: to[0] is not an e-mail address` |
| `{ name: 'A\r\nBcc: x@y.z', address: 'a@b.c' }` in `from` | `MailRefused`: `send: from.name must be a string without a line break` |
| `{ name: 'Ada' }` | a compile error: `address` is required |

`addressOf(address)` answers the bare address of either form, and
`recipientsOf(message)` every recipient's, in order — mostly useful to a
transport:

```ts
import { addressOf, recipientsOf } from '@nxgt/mail';

addressOf({ name: 'Ada', address: 'ada@example.com' }); // 'ada@example.com'
recipientsOf({
	to: ['a@example.com', { name: 'B', address: 'b@example.com' }],
	subject: 's',
	html: 'h',
	text: 't',
}); // ['a@example.com', 'b@example.com']
```

## Headers

A header name is letters, digits and hyphens; neither a name nor a value may
hold a line break:

```ts
import type { MailMessage, Rendered } from '@nxgt/mail';

declare const rendered: Rendered;

const message: MailMessage = {
	...rendered,
	to: 'ada@example.com',
	headers: {
		'List-Unsubscribe': '<https://example.com/unsubscribe?u=42>',
		'X-Entity-Ref-ID': 'welcome-42',
	},
};
```

| Written | Answer |
| --- | --- |
| `{ 'X Bad': 'v' }` | `MailRefused`: `send: a header name must be letters, digits and hyphens` |
| `{ 'X-Ref': 'a\r\nb' }` | `MailRefused`: `send: header X-Ref must be a string without a line break` |

## Errors

```ts
type MailErrorCode = 'MAIL_FAILED' | 'MAIL_REFUSED';

interface MailErrorOptions {
	readonly cause?: unknown; // the error that caused this one, typically the transport's
}

abstract class MailError extends Error {
	abstract readonly code: MailErrorCode;
	constructor(message: string, options?: MailErrorOptions);
}
class MailFailure extends MailError {
	readonly code: 'MAIL_FAILED';
}
class MailRefused extends MailError {
	readonly code: 'MAIL_REFUSED';
}
```

| Code | Class | When | Sending it again |
| --- | --- | --- | --- |
| `MAIL_FAILED` | `MailFailure` | The transport could not hand the e-mail over: a refused connection, a timeout, a 5xx from the provider, an expired credential. The transport's error is the `cause`. **Nothing was sent** | May work later. Never report it as sent |
| `MAIL_REFUSED` | `MailRefused` | The e-mail itself was refused, before or by the transport: no recipient, something that is not an address, a line break in the subject or a header, or the provider answering that the message is malformed | Fails again, unchanged |

`MailError` is **abstract**: catch it, test `instanceof MailError`, but
`new MailError(…)` does not compile — a bare one would pass a `code` check and
fail `instanceof MailFailure`. What is thrown is always one of the two
subclasses. `MailError` extends `Error`, not `TypeError`, so a `catch` needs no
ordering.
`code` is a union, so a `switch` over it is exhaustive: when a code is added, a
function like `statusOf` below stops compiling instead of answering
`undefined`.

```ts
import { MailError, type MailErrorCode, type Mailer, type MailMessage } from '@nxgt/mail';

export function statusOf(code: MailErrorCode): number {
	switch (code) {
		case 'MAIL_FAILED':
			return 503;
		case 'MAIL_REFUSED':
			return 422;
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

**An error's `message` reports a shape, never a value.** It names where the
problem is — `send: to[1] is not an e-mail address` — and never the address,
the subject or a link: the link in a verification e-mail is a credential, and
an address is personal data. What the provider said is on `cause`, for your
logs.

A refusal that can only come from how the application was wired — a bad option
passed to a transport's factory — is a bare `TypeError`. No request handler
should answer one, so none needs to tell it apart.

## A realistic case — a sign-up handler

The account is created whatever happens to the e-mail; what the visitor is told
depends on whether the e-mail left:

```ts
import { MailError, type Mailer } from '@nxgt/mail';
import { type MailRenderer } from '@nxgt/mail/renderer';

// Yours: your user store, your token issuer.
declare function createUser(email: string): Promise<{ id: string; email: string }>;
declare function issueVerificationToken(userId: string): Promise<string>;

export function signUpHandler(mailer: Mailer, mails: MailRenderer) {
	return async (request: Request): Promise<Response> => {
		const { email } = (await request.json()) as { email: string };
		const user = await createUser(email);
		const token = await issueVerificationToken(user.id);
		const link = `https://app.example.com/verify?token=${encodeURIComponent(token)}`;

		try {
			// Inside the try: render throws MailRefused for a link that is not a safe URL.
			await mailer.send({ to: user.email, ...mails.render('verify-email', { link }) });
		} catch (error) {
			if (!(error instanceof MailError)) throw error;
			// MAIL_FAILED: offer "send it again" later. MAIL_REFUSED: the address is unusable.
			return Response.json({ userId: user.id, emailSent: false, code: error.code }, { status: 201 });
		}
		return Response.json({ userId: user.id, emailSent: true }, { status: 201 });
	};
}
```

## See also

- [Rendering](rendering.md) — filling a Maizzle build into the `Rendered` a message spreads.
- [Testing](testing.md) — the memory mailer, and making a send fail on purpose.
- [Locales](locales.md) — choosing the locale an e-mail is rendered in.
- [Writing a transport](transports.md) — implementing the port.
- [Troubleshooting](../troubleshooting.md) — each error message, its cause and
  its fix.
