# @nxgt/mail

The run-time side of transactional e-mail: the renderer that fills a Maizzle
build made with `@nxgt/mail-i18n`, the `Mailer` port a transport implements,
the shape it sends, the two errors it throws, a memory transport for tests, and
locale selection. **No dependency.**

```ts
import { createMemoryMailer } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' }); // the folder `maizzle build` wrote
const mailer = createMemoryMailer(); // in production, a transport's mailer

const { messageId } = await mailer.send({
	to: { name: 'Ada Lovelace', address: 'ada@example.com' },
	from: 'noreply@example.com',
	...mails.render('verify-email', { name: 'Ada', link: 'https://app.example.com/verify?token=abc' }),
}); // 'memory-1' — or it throws
```

> **Not published yet.** The package is `private` while the rest of the
> repository — the transports and a starter — is written. It is published at
> `0.1.0` with them; the surface below is the one that will ship.

## Install

```sh
bun add @nxgt/mail
```

No runtime dependency. `typescript` (6) is a required peer. Your tsconfig
resolves as a bundler does (`"moduleResolution": "bundler"`): the declarations
import without extensions, so `nodenext` is not supported.

## Subpaths

| Import | What it holds |
| --- | --- |
| `@nxgt/mail` | The port (`Mailer`, `MailMessage`, `Rendered`, `SentMail`, `Address`), the errors (`MailError`, `MailFailure`, `MailRefused`), `createMemoryMailer`, `pickLocale` and `parseAcceptLanguage`, and what a transport calls first: `checkMessage`, `recipientsOf`, `addressOf`. No Node built-in: it runs anywhere |
| `@nxgt/mail/renderer` | The renderer: `createMailRenderer`, `MailRenderer`, `MailRendererOptions`, `RenderOptions`, `MailVariables`, and the types that type it with a build's `MailEmails` (`MailEmailsOf`, `AnyMailEmails`, `RenderArguments`). Reads the build with `node:fs` |
| `@nxgt/mail/conformance` | **For transport authors**: `describeMailer`, its cases as data, `runMailerCase`, and the memory mailer's harness as a worked example |

## Usage

### Rendering — `createMailRenderer`

Build the project with `maizzle build` and the `i18n()` plugin of
`@nxgt/mail-i18n`, deploy its output folder with your server, and create one
renderer at start-up. It reads `mail-manifest.json` and every built file once,
so a missing build fails there, not at the first send:

```ts
import { type Mailer, pickLocale } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';
import type { MailEmails } from './generated/mail'; // written by the build, committed

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
`generated/mail.ts`, from the manifest; commit it. With it, the compiler
refuses what `render` would throw: an e-mail the build does not have, a
variable missing or unknown, and a number for a URL variable, as
`Argument of type '"verify-emial"' is not assignable to parameter of type
'"sign-in-code" | "verify-email"'`. Without it, any name and any
`MailVariables` compile, and the same mistakes throw at run time. See
[Rendering](docs/guide/rendering.md) for the options, typing the renderer,
the locale chosen through `getLanguage`, and every error.

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

### Errors — switch on `code`

Both errors extend `MailError`, whose `code` is a union a `switch` exhausts.
`MailError` is abstract: catch it, but throw `MailFailure` or `MailRefused`.

```ts
import { MailError, type MailErrorCode, type Mailer, type MailMessage } from '@nxgt/mail';

function statusOf(code: MailErrorCode): number {
	switch (code) {
		case 'MAIL_FAILED':
			return 503; // nothing was sent: retry later, or say it failed
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

export function createHttpMailer(endpoint: string, apiKey: string): Mailer {
	return {
		async send(message) {
			checkMessage(message); // MailRefused, naming where, never the value
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
				body: JSON.stringify({ ...message, to: recipientsOf(message) }),
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

**A refusal is not worth retrying; a failure may be.** `MAIL_REFUSED` fails
again unchanged. Nothing in this package retries a `MAIL_FAILED`: a retry is
your decision, made where you can see it.

**The locale is the recipient's, not the request's.** An administrator who
invites a user sends the invitation in the *user's* locale:
`pickLocale(invitee.locale, supported, fallback)`.

**A transport defines no error class.** It throws `MailFailure` and
`MailRefused` from its `@nxgt/mail` peer; its own copy fails `instanceof`, and
the conformance suite with it.

**Under `bun test`, pass `runner: { describe, it }` to `describeMailer`.** Bun
gives a test file `describe` and `it` as bare identifiers, not on `globalThis`.

## Type safety, counted

**17 plausible mistakes, 17 refused** at compile time, each measured by a
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

## Licence

MIT
