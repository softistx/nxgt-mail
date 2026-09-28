# Rendering

This page is for turning a Maizzle build made with `@nxgt/mail-i18n` into an
e-mail ready to send: `createMailRenderer` reads the built files once, and
`render` fills the values only known at send time, escaped, in the locale
wanted.

```ts
import { createMemoryMailer } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' }); // the folder `maizzle build` wrote
const mailer = createMemoryMailer(); // in production, a transport's mailer

await mailer.send({
	to: 'ada@example.com',
	...mails.render('verify-email', {
		name: 'Ada',
		link: 'https://app.example.com/verify?token=abc',
	}),
});
```

`render` answers `{ subject, html, text }` — a `Rendered` — which is spread
into the `MailMessage` and addressed. See [Sending](sending.md) for the rest
of the message.

## What it reads

`maizzle build`, with the `i18n()` plugin of `@nxgt/mail-i18n`, writes one
HTML and one text file per e-mail and locale, and `mail-manifest.json` beside
them:

```text
dist/
  mail-manifest.json
  en/verify-email.html
  en/verify-email.txt
  fr/verify-email.html
  fr/verify-email.txt
```

The manifest lists each e-mail's variables, the ones that must be URLs, its
subject in each locale and its files. The renderer reads nothing else. Its
shape is described in `@nxgt/mail-i18n`'s
[manifest guide](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/guide/manifest.md).

Nothing is evaluated at send time: no template engine and no Maizzle run in
your server. `render` replaces each `{{ name }}` the build left in place, and
nothing else.

### Which builds it reads — `MANIFEST_FORMAT`

The manifest carries its format, `formatVersion`, and the renderer exports the
newest format it reads:

```ts
import { MANIFEST_FORMAT } from '@nxgt/mail/renderer';

MANIFEST_FORMAT; // 1 — the newest manifest format this @nxgt/mail reads
```

```ts
const MANIFEST_FORMAT = 1;
```

The promise:

- **A renderer reads every format up to its own.** A build from any earlier
  `@nxgt/mail-i18n` keeps working with a newer `@nxgt/mail`: a package that
  ships a prebuilt format-1 build can peer `@nxgt/mail` `>=0.1.0 <2`.
  The peer's lower bound is the first `@nxgt/mail` that reads the build's
  format.
- **A manifest without `formatVersion` is format 1**, as `@nxgt/mail-i18n`
  0.1 and 0.2 wrote it.
- **The format changes only when the manifest's shape does.** A new
  `@nxgt/mail-i18n` that writes the same shape writes the same format.

So upgrade `@nxgt/mail` no later than `@nxgt/mail-i18n`. From 0.5.1, a
renderer refuses a newer format when it starts, before reading any other
field. 0.1.0 to 0.5.0 know no format and read only format 1: a build in a
later format must peer at least the first `@nxgt/mail` that reads it.

| The manifest's `formatVersion` | At start-up |
| --- | --- |
| absent | Read as format 1 |
| `1` to `MANIFEST_FORMAT` | Read |
| an integer above `MANIFEST_FORMAT` | `Error`: `createMailRenderer: dist/mail-manifest.json is manifest format 2, newer than this @nxgt/mail reads (1) — upgrade @nxgt/mail` |
| anything else — `0`, `1.5`, `'1'`, `null` | `Error`: `createMailRenderer: dist/mail-manifest.json is not a manifest of @nxgt/mail-i18n — build with its i18n() plugin` |

`@nxgt/mail` 0.5.0 and earlier do not export `MANIFEST_FORMAT` and ignore
`formatVersion`; they read format 1. A package that ships its build checks the
format it wrote against the renderers it supports when it builds: see
[the manifest guide — shipping a build in a package](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/guide/manifest.md#shipping-a-build-in-a-package).

## `createMailRenderer`

```ts
type WantedLocales = string | null | undefined | readonly (string | null | undefined)[];

interface MailRendererOptions {
	readonly dir: string;
	readonly getLanguage?: () => WantedLocales;
	readonly fallbackLocale?: string;
}

type MailEmailsOf<E> = { readonly [K in keyof E]: MailVariables };
type AnyMailEmails = Readonly<Record<string, MailVariables>>;
type RenderArguments<V> =
	Readonly<Record<string, never>> extends V
		? [variables?: V, options?: RenderOptions]
		: [variables: V, options?: RenderOptions];

interface MailRenderer<E extends MailEmailsOf<E> = AnyMailEmails> {
	readonly emails: readonly (keyof E & string)[];
	readonly locales: readonly string[];
	render<N extends keyof E & string>(email: N, ...rest: RenderArguments<E[N]>): Rendered;
}

function createMailRenderer<E extends MailEmailsOf<E> = AnyMailEmails>(
	options: MailRendererOptions,
): MailRenderer<E>;
```

`E` is optional: left out, it is `AnyMailEmails`, and `render` takes any
name and `MailVariables`, as `render(email: string, variables?:
MailVariables, options?: RenderOptions)`. Given the build's `MailEmails`, it
checks the names and the variables at compile time: see
[Typing the renderer](#typing-the-renderer).

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `dir` | `string` | required | The build's output folder, where `mail-manifest.json` is. A relative path is read from the process's working directory |
| `getLanguage` | `() => WantedLocales` | none: the fallback locale | Asked **at each render** for the wanted locales, most wanted first, then matched against the build's locales with [`pickLocale`](locales.md) |
| `fallbackLocale` | `string` | the manifest's `fallbackLocale` | The locale when nothing wanted is built. Must be one of the build's locales |

The renderer it answers is frozen:

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' });

mails.emails; // ['sign-in-code', 'verify-email'] — sorted
mails.locales; // ['en', 'fr'] — in the manifest's order
```

### Everything is read once, at creation

The manifest and every file it lists are read when `createMailRenderer` is
called, and kept in memory. A missing or broken build **throws there**, when
your server starts, not at the first send an hour later. Create one renderer
at start-up and share it; creating one per request reads the whole build each
time.

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';

// At start-up: a missing build stops the process here.
export const mails = createMailRenderer({ dir: process.env.MAIL_DIR ?? 'dist' });
```

A rebuild is not picked up by a running renderer: create a new one, or
restart.

## `render`

```ts
type MailVariables = Readonly<Record<string, string | number>>;

interface RenderOptions {
	readonly locale?: string;
}

interface Rendered {
	readonly subject: string;
	readonly html: string;
	readonly text: string;
}
```

`render(email, variables, options)` answers the e-mail named `email` — its
template's path under `emails/`, without `.vue`, as `verify-email` or
`auth/reset-password` — with every variable filled:

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' });

mails.render('sign-in-code', { code: 123456 }, { locale: 'fr' });
// {
//   subject: 'Votre code de connexion : 123456',
//   html: '<!DOCTYPE html>\n<html lang="fr"><body><p>123456</p></body></html>\n',
//   text: 'Votre code : 123456\n',
// }
```

- **Every variable of the manifest is required**, and no other is accepted:
  a missing one or an unknown one throws. `variables` defaults to `{}`, for an
  e-mail that takes none.
- **A value is a string or a finite number.** A number is written as
  `String(n)`; `NaN`, `Infinity`, `null`, `undefined`, an object, an array or
  a `URL` are refused, so nothing renders as `[object Object]`. Pass
  `url.href` for a `URL`.
- **The names are checked at run time**, against the manifest, typed or not.
  Untyped, the compiler checks that each value is a string or a number, not
  that `verify-email` takes `link`; given the build's `MailEmails`, it checks
  that too — see [Typing the renderer](#typing-the-renderer).

## Typing the renderer

After each `maizzle build`, `@nxgt/mail-i18n` writes `generated/mail.ts` in
the project: `MailEmails`, each e-mail of the build with the variables it
takes. Git-ignore it — each build rewrites it — and run `maizzle build`
before type-checking, as `"typecheck": "maizzle build && tsc --noEmit"`
does; then pass it to `createMailRenderer`:

```ts
// generated/mail.ts — written by the build, never edited
export interface MailEmails {
	"auth/reset-password": { readonly email: string | number; readonly resetLink: string };
	"sign-in-code": { readonly code: string | number };
	"verify-email": { readonly link: string; readonly name: string | number };
	"welcome": Readonly<Record<string, never>>;
}
```

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';
import type { MailEmails } from './generated/mail';

const mails = createMailRenderer<MailEmails>({ dir: 'dist' });

mails.render('verify-email', { name: 'Ada', link: 'https://app.example.com/verify?token=abc' });
mails.render('sign-in-code', { code: 123456 }, { locale: 'fr' }); // a number, where it is not a URL
mails.render('welcome'); // an e-mail that takes no variable needs no variables argument
mails.emails; // typed readonly ('auth/reset-password' | 'sign-in-code' | 'verify-email' | 'welcome')[]
```

A URL variable (one of the manifest's `urlVariables`) is `string`; any other
variable is `string | number`, as `render` writes it. How the file is
written, where, and how to turn it off is in `@nxgt/mail-i18n`'s
[manifest guide](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/guide/manifest.md#the-renderers-types--generatedmailts).

### What it refuses

Each is what `render` would throw at run time, moved to the compiler, with the
message `tsc` prints:

| Call | Compile error |
| --- | --- |
| `mails.render('verify-emial', { name, link })` | `TS2345: Argument of type '"verify-emial"' is not assignable to parameter of type '"auth/reset-password" \| "sign-in-code" \| "verify-email" \| "welcome"'.` |
| `mails.render('sign-in-code', { code: 1, name: 'Ada' })` | `TS2353: Object literal may only specify known properties, and 'name' does not exist in type '{ readonly code: string \| number; }'.` |
| `mails.render('verify-email', { link })` | `TS2345: … Property 'name' is missing in type '{ link: string; }' but required in type '{ readonly link: string; readonly name: string \| number; }'.` |
| `mails.render('sign-in-code')` | `TS2554: Expected 2-3 arguments, but got 1.` |
| `mails.render('verify-email', { link: 42, name: 'Ada' })` | `TS2322: Type 'number' is not assignable to type 'string'.` |

The compiler checks a name written as a literal, with its variables written as
an object literal at the call. Two calls still compile, and throw at the send:

- **Variables built beforehand** with a property too many:
  `const variables = { code: 1, name: 'Ada' }; mails.render('sign-in-code', variables)`
  — TypeScript flags an unknown property only in an object literal.
- **A name typed as a union**, as `'sign-in-code' | 'verify-email'`: its
  variables are checked against one of the e-mails, not all of them.

A hand-written `MailEmails` writes each e-mail's variables as a type literal,
as the generated file does: an `interface` has no index signature, and
`createMailRenderer` refuses it.

The run-time checks are unchanged: a renderer typed with a `MailEmails` older
than the deployed build still throws on a name or a variable the build does
not have, and `mails.emails` may hold a name `MailEmails` does not. When the
build changes, the next `maizzle build` rewrites
`generated/mail.ts`, and the compiler points at every call it breaks.

### Untyped

Without the type parameter, `E` is `AnyMailEmails`: every name compiles, and
`variables` is `MailVariables`. That is the choice for variables built at run
time, as a `Record<string, string>` read from a queue — the typed `render`
refuses it — and for a renderer over a build this code does not know.

```ts
import { createMailRenderer, type MailVariables } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' });

declare const job: { email: string; variables: MailVariables };
mails.render(job.email, job.variables); // checked at run time only
```

A `MailRenderer<MailEmails>` is accepted where a `MailRenderer` is expected,
so a helper written for any build takes a typed renderer.

The manifest guide also shows
[a test that holds the two sides together](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-i18n/docs/guide/manifest.md#checking-your-application-against-it),
for an application that only installs the built project, or is not
written in TypeScript.

## Choosing the locale

Each render picks its locale in this order:

1. `options.locale`, when given — used **as is**: it must be spelled exactly
   as one of `mails.locales`, or `render` throws.
2. Otherwise, `pickLocale(getLanguage(), mails.locales, fallbackLocale)`:
   the first wanted locale the build has, matched on the language when the
   region is not built (`fr-CA` renders `fr`), else the fallback locale.
3. Without `getLanguage`, the fallback locale.

The locale of an e-mail is the **recipient's**, not the request's (see
[Whose locale](locales.md#whose-locale)). The plainest way to say whose is to
pick it where you know the recipient, with `pickLocale`, and pass it:

```ts
import { pickLocale } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' });

declare const user: { email: string; name: string; locale: string | null };

const locale = pickLocale(user.locale, mails.locales, 'en'); // 'fr' for 'fr-CA'
const rendered = mails.render('verify-email', { name: user.name, link: 'https://app.example.com/v' }, { locale });
```

`getLanguage` is for code that already carries the recipient's locale in a
context — as `@nxgt/i18n`'s language provider does. It is asked at each
render, so it reads the context of the current call:

```ts
import { AsyncLocalStorage } from 'node:async_hooks';
import { createMailRenderer } from '@nxgt/mail/renderer';

const recipient = new AsyncLocalStorage<{ locale: string | null }>();

const mails = createMailRenderer({
	dir: 'dist',
	getLanguage: () => recipient.getStore()?.locale, // undefined: the fallback locale
	fallbackLocale: 'en',
});

recipient.run({ locale: 'fr-CA' }, () => mails.render('sign-in-code', { code: 1 })); // in fr
```

`getLanguage` may answer a string, `null`, `undefined`, or a list such as
`[user.locale, ...parseAcceptLanguage(header)]`. What it answers never throws:
a locale the build lacks falls back. Only `options.locale` can name a locale
that does not exist.

## Escaping

A value is data, never markup and never a header. Where it lands decides what
is done to it:

| Part | What happens to a value |
| --- | --- |
| `html` | HTML-escaped: `&` `<` `>` `"` `'` become `&amp;` `&lt;` `&gt;` `&quot;` `&#39;`. Safe in text and in a quoted attribute |
| `text` | Written as is: a plain-text part has no markup to escape |
| `subject` | Written as is, then each run of line breaks becomes one space, and the subject is trimmed |

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' });
const name = '<script>alert("x")</script> & \'Ada\'';

const { html, text } = mails.render('verify-email', { name, link: 'https://app.example.com/v' });
// html: <p>Hello &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;Ada&#39;,</p>
// text: Hello <script>alert("x")</script> & 'Ada',
```

Each placeholder is replaced in one pass, so a value is never read again: a
value holding `{{ link }}` is written as `{{ link }}`, not as the link.

### URL variables

A variable that starts an `href`, a `src` or another URL attribute in the
build is a **URL variable** (`urlVariables` in the manifest). Its value must
be a URL a mail client cannot run:

- it starts with `http://`, `https://` or `mailto:`, in any case;
- it holds no whitespace, no control character, no quote, no `<`, `>` or
  backtick;
- it parses as a URL.

Anything else throws `MailRefused`, before the e-mail is sent:

| Value of `link` | Answer |
| --- | --- |
| `https://app.example.com/verify?token=abc&next=%2F` | accepted; `&` is written `&amp;` in `html` |
| `mailto:ada@example.com` | accepted |
| `javascript:alert(1)`, `JaVaScRiPt:alert(1)`, ` javascript:alert(1)` | `MailRefused` |
| `data:text/html,…` | `MailRefused` |
| `//evil.example`, `/relative` | `MailRefused`: a URL in an e-mail is absolute |
| `https://app.example.com/"onmouseover="alert(1)` | `MailRefused`: a quote |
| `https://app.example.com/` followed by a line break | `MailRefused` |
| `https://` | `MailRefused`: does not parse |

`mailto:` is accepted in **every** URL variable, `src` included: the manifest
records which variables start a URL attribute, not which attribute. A
`mailto:` image source loads nothing, which is harmless, so a template that
takes an image URL from a variable should expect `https:`, and the code that
sends it should pass one.

A variable later in the attribute — `href="https://app.example.com/verify?token={{ token }}"`
— is not a URL variable: the scheme is already written, so any string is
accepted, HTML-escaped. Encode it for a URL yourself
(`encodeURIComponent(token)`) when it may hold `&`, `#` or `?`.

### The subject

The subject is a header. Each run of line breaks in it — `\r`, `\n`, a
vertical tab, a form feed, `U+0085`, `U+2028`, `U+2029` — becomes **one
space**, and the result is trimmed, so a value cannot add a header:

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' });

mails.render('verify-email', {
	name: 'Ada\r\nBcc: victim@example.com',
	link: 'https://app.example.com/v',
}).subject;
// 'Confirm your address, Ada Bcc: victim@example.com'
```

## Errors

Every message names the e-mail, the locale or the variable — **never a
value**: a link in a verification e-mail is a credential.

### When the renderer is created

A mistake in the options is a bare `TypeError`; a build that is missing or
broken is an `Error`, the file system's error as `cause` when a file cannot be
read. The paths are `dir` joined with the file, as you passed `dir`.

| Message | Class | Cause |
| --- | --- | --- |
| `createMailRenderer: options must be an object, as { dir: 'dist' }` | `TypeError` | No options object |
| `createMailRenderer: dir must be the folder maizzle build wrote, as dist` | `TypeError` | `dir` missing, empty or not a string |
| `createMailRenderer: getLanguage must be a function that answers the wanted locales, as () => user.locale` | `TypeError` | `getLanguage` given as a locale rather than a function |
| `createMailRenderer: dist/mail-manifest.json cannot be read — run maizzle build, and deploy its output folder` | `Error` | No build at `dir`: not built, not deployed, or `dir` read from another working directory |
| `createMailRenderer: dist/mail-manifest.json is not valid JSON` | `Error` | The manifest was cut or edited |
| `createMailRenderer: dist/mail-manifest.json is not a manifest of @nxgt/mail-i18n — build with its i18n() plugin` | `Error` | A JSON file without `locales`, `fallbackLocale` and `emails`, or with a `formatVersion` that is not a positive integer |
| `createMailRenderer: dist/mail-manifest.json is manifest format 2, newer than this @nxgt/mail reads (1) — upgrade @nxgt/mail` | `Error` | A build from a newer `@nxgt/mail-i18n`, whose manifest format this renderer predates — see [which builds it reads](#which-builds-it-reads--manifest_format) |
| `createMailRenderer: fallbackLocale must be one of the build's locales, en, fr` | `TypeError` | `fallbackLocale` names a locale the build does not have |
| `createMailRenderer: mail-manifest.json describes verify-email in a shape its format does not have — it was changed after the build; run maizzle build again` | `Error` | An entry of the manifest lacks a field, or a locale: every format has them, so the file was edited, merged or cut after `maizzle build` wrote it |
| `createMailRenderer: verify-email has no text part in fr — keep Maizzle's plaintext on, as @nxgt/mail-config sets it` | `Error` | The project turned Maizzle's `plaintext` off; every e-mail sent has a text part |
| `createMailRenderer: dist/fr/verify-email.txt cannot be read — run maizzle build, and deploy its output folder` | `Error` | A file the manifest lists is gone: only part of the build was deployed |

### When an e-mail is rendered

Checked in this order: the e-mail, the locale, then the variables.

| Message | Class | Cause |
| --- | --- | --- |
| `render: welcome is not an e-mail of the build — one of sign-in-code, verify-email` | `Error` | No template `emails/welcome.vue` was built |
| `render: the locale asked for is not one of the build's, en, fr` | `Error` | `{ locale: 'de' }`, or a spelling the build does not use (`fr-CA`, `FR`). Pick it with `pickLocale` |
| `render: the variables of sign-in-code must be an object, as { name: 'Ada' }` | `TypeError` | `variables` is not a plain object |
| `render: sign-in-code has no variable name — it takes code` | `Error` | A variable the e-mail does not take (`— it takes none` for an e-mail without variables) |
| `render: sign-in-code: code must be a string or a finite number` | `TypeError` | `null`, `undefined`, `NaN`, an object, an array |
| `render: verify-email needs the variable link` | `Error` | A variable the e-mail takes was not passed |
| `render: verify-email: link must be an http:, https: or mailto: URL` | `MailRefused` | A URL variable holding anything else — see [URL variables](#url-variables) |

Every one but the last is a mistake in the code: it fails the same way for
every recipient. `MailRefused` carries `code: 'MAIL_REFUSED'`, like a
malformed message refused by `send`, so a handler that turns a `MailError`
into a response covers it when `render` is inside the same `try`
([Sending — errors](sending.md#errors)).

## Deploying

- **Ship the build's output folder with your server.** `dist/`, with
  `mail-manifest.json` and every locale folder, is read at run time: build it
  in CI and copy it into the image, or publish it in a package the server
  depends on.
- **Point `dir` at it independently of the working directory** when the
  process may start elsewhere:

  ```ts
  import { fileURLToPath } from 'node:url';
  import { createMailRenderer } from '@nxgt/mail/renderer';

  const mails = createMailRenderer({
  	dir: fileURLToPath(new URL('../mails/dist', import.meta.url)),
  });
  ```

- **The renderer needs a file system.** It imports `node:fs` and `node:path`,
  so it runs on Node, Bun and Deno — not on an edge runtime without `fs`.
  That is why it is its own entry, `@nxgt/mail/renderer`: `@nxgt/mail` and
  `@nxgt/mail/conformance` import no Node built-in, so the port, the errors
  and a transport run anywhere.

## A realistic case — the account e-mails of a service

One renderer, created at start-up, and a mailer, passed in so a test can use
the memory mailer:

```ts
import { MailError, type Mailer, pickLocale } from '@nxgt/mail';
import { type MailRenderer } from '@nxgt/mail/renderer';
import type { MailEmails } from './generated/mail';

interface User {
	readonly email: string;
	readonly name: string;
	readonly locale: string | null;
}

export class AccountMails {
	constructor(
		private readonly mailer: Mailer,
		private readonly mails: MailRenderer<MailEmails>, // a renamed variable fails tsc here
	) {}

	/** true when the e-mail left; false when it failed or was refused. */
	async sendVerification(user: User, token: string): Promise<boolean> {
		const link = `https://app.example.com/verify?token=${encodeURIComponent(token)}`;
		const locale = pickLocale(user.locale, this.mails.locales, 'en');
		try {
			await this.mailer.send({
				to: { name: user.name, address: user.email },
				...this.mails.render('verify-email', { name: user.name, link }, { locale }),
			});
			return true;
		} catch (error) {
			if (!(error instanceof MailError)) throw error; // a mistake in the code: let it fail loudly
			return false; // MAIL_FAILED: offer to send it again; MAIL_REFUSED: the address or the link is unusable
		}
	}
}
```

Its test renders the real build and reads the outbox:

```ts
import { expect, it } from 'bun:test';
import { createMemoryMailer } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';
import { AccountMails } from './account-mails';
import type { MailEmails } from './generated/mail';

const mails = createMailRenderer<MailEmails>({ dir: 'dist' });

it("sends the verification e-mail in the recipient's locale", async () => {
	const mailer = createMemoryMailer();
	const accounts = new AccountMails(mailer, mails);

	expect(await accounts.sendVerification({ email: 'ada@example.com', name: 'Ada', locale: 'fr-CA' }, 'abc')).toBe(true);

	const [sent] = mailer.sent;
	expect(sent?.subject).toBe('Confirmez votre adresse, Ada');
	expect(sent?.text).toContain('https://app.example.com/verify?token=abc');
});
```

## See also

- [Sending](sending.md) — the `MailMessage` the rendered e-mail is spread into,
  and the errors of `send`.
- [Locales](locales.md) — `pickLocale` and `parseAcceptLanguage`.
- [Testing](testing.md) — the memory mailer and its outbox.
- [Troubleshooting](../troubleshooting.md) — an error message, its cause and
  its fix.
