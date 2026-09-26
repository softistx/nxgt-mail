# @nxgt/mail-build

The build side of `@nxgt/mail`. It compiles ICU message catalogues — one JSON
file per locale — into a TypeScript module whose `t(locale, key, args)` is
typed from the ICU: a missing, misspelled or mistyped argument, an unknown
locale or an unknown key is a compile error. It runs **at build time only**, as
a devDependency; the module it writes imports nothing and uses only `Intl`.

```ts
import { t } from './generated/messages';

t('fr', 'verifyEmail.expires', { hours: 0 }); // 'Ce lien expire dans 0 heure.'
t('en', 'verifyEmail.expires', { hours: 0 }); // 'This link expires in 0 hours.'

t('en', 'verifyEmail.expires', { hours: '24' });
//                               ~~~~~ Type 'string' is not assignable to type 'number'
```

> **Not published yet.** The package is `private`. This is its first part, the
> message compiler, which you call from a script of your own. The templates
> (Maizzle, Tailwind CSS), the `nxgt-mail` CLI and `defineMailConfig` come in
> the next part, which turns these messages into render functions answering
> `{ subject, html, text }`.

## Install

```sh
bun add -d @nxgt/mail-build
```

A devDependency: nothing of it reaches your server. `typescript` (6) is a
required peer. Your tsconfig resolves as a bundler does
(`"moduleResolution": "bundler"`): the declarations import without extensions,
so `nodenext` is not supported.

## Setup

```jsonc
// biome.json — the module is generated: do not lint or format it
{ "files": { "includes": ["**", "!**/generated"] } }
```

The module is written to `src/generated/` and replaced on every build. Keep it
out of your linter and your coverage; commit it or ignore it in git, as you
prefer — the same catalogues always produce the same bytes. Your compiler does
check it, and it compiles under the strictest options — `strict`,
`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noUnusedLocals`,
`noUnusedParameters`, `noPropertyAccessFromIndexSignature`, down to an ES2020
`lib`.

## Usage

### Writing catalogues

One catalogue per locale, `messages/<locale>.json`. Keys nest, and every
segment is `camelCase`; a leaf is one ICU message.

```json
{
	"verifyEmail": {
		"subject": "Confirm your e-mail address",
		"body": "Hello {name}, confirm this address to finish signing up.",
		"expires": "This link expires in {hours, plural, one {# hour} other {# hours}}.",
		"requestedAt": "Requested on {at, date, long} at {at, time, short}."
	}
}
```

```json
{
	"verifyEmail": {
		"subject": "Confirmez votre adresse e-mail",
		"body": "Bonjour {name}, confirmez cette adresse pour terminer votre inscription.",
		"expires": "Ce lien expire dans {hours, plural, one {# heure} other {# heures}}.",
		"requestedAt": "Demandé le {at, date, long} à {at, time, short}."
	}
}
```

Every form a message can take — plural with `=0` and `offset`,
`selectordinal`, `select`, numbers, currencies, dates — is in
[Catalogues](docs/guide/catalogues.md).

### Compiling — `readCatalogues` and `compileMessages`

```ts
// scripts/build-messages.ts — run from the project root: bun run scripts/build-messages.ts
import { mkdir, writeFile } from 'node:fs/promises';
import { compileMessages, readCatalogues } from '@nxgt/mail-build';

const locales = ['en', 'fr'];
const catalogues = await readCatalogues('messages', locales); // messages/en.json, messages/fr.json

const { module } = compileMessages({
	locales,
	fallbackLocale: 'en', // the reference every other catalogue is checked against
	sources: [{ name: 'messages/', catalogues }],
});

await mkdir('src/generated', { recursive: true });
await writeFile('src/generated/messages.ts', module);
```

`module` is the TypeScript source, as a string; writing it is yours. A build
that cannot be right throws before anything is written, so the script exits
non-zero.

### Using the generated module — `t`

```ts
import { t } from './generated/messages';

t('en', 'verifyEmail.subject'); // 'Confirm your e-mail address' — no arguments, none passed
t('fr', 'verifyEmail.body', { name: 'Ada' });
t('en', 'verifyEmail.requestedAt', { at: new Date() }, { timeZone: 'Europe/Paris' });
```

The module also exports `locales`, `Locale`, `fallbackLocale`, `MessageKey`,
`MessageArgs` and `FormatOptions`. See
[The generated module](docs/guide/generated-module.md).

### How arguments are typed

From the way the **fallback locale's** message uses them:

| In the message | Argument type |
| --- | --- |
| `{name}` | `string` |
| `{method, select, express {…} other {…}}` | `string` |
| `{count, plural, …}`, `{position, selectordinal, …}` | `number` |
| `{total, number}`, `{total, number, ::currency/EUR}`, `{ratio, number, percent}` | `number` |
| `{at, date, long}`, `{at, time, short}` | `Date` |
| `{n}` in a message that also has `{n, plural, …}` | `number` — the plain use takes the other's type |
| no argument | none: `t(locale, key)` — passing one is a compile error |

Every argument of a message is **required**, including the ones a translation
leaves out.

### Presets, then the application

`sources` is a list, earliest first. A later source overrides a **message**,
one key at a time; it never replaces a namespace.

```ts
import { compileMessages, readCatalogues } from '@nxgt/mail-build';

const locales = ['en', 'fr'];
const shared = {
	en: { common: { greeting: 'Hello {name},', signOff: 'The team' } },
	fr: { common: { greeting: 'Bonjour {name},', signOff: "L'équipe" } },
};

const { module } = compileMessages({
	locales,
	fallbackLocale: 'en',
	sources: [
		{ name: 'shared', catalogues: shared }, // a preset's messages
		{ name: 'messages/', catalogues: await readCatalogues('messages', locales) }, // yours, last
	],
});
// With { "common": { "signOff": "Ada, for Example Inc." } } in messages/en.json,
// common.signOff is replaced in English and common.greeting is kept.
```

A source may leave a locale out (`null` or absent). What is checked is the
merged catalogue of each locale.

### What fails the build — `MailBuildError`

A catalogue that cannot be right throws a `MailBuildError` naming the locale
and the key — never the text of the message. Nothing falls back to the raw
message.

```ts
import { compileMessages, MailBuildError } from '@nxgt/mail-build';

try {
	compileMessages({
		locales: ['en', 'fr'],
		fallbackLocale: 'en',
		sources: [
			{
				name: 'messages/',
				catalogues: {
					en: { greeting: { hello: 'Hello {name}' } },
					fr: { greeting: { hello: 'Salut {nom}' } },
				},
			},
		],
	});
} catch (error) {
	if (!(error instanceof MailBuildError)) throw error;
	console.error(error.code, error.locale, error.key);
	// ARGUMENT_UNDECLARED fr greeting.hello
	// error.message: 'messages: fr: greeting.hello uses {nom}, which en does not declare'
	process.exit(1);
}
```

| `code` | When |
| --- | --- |
| `CATALOGUE_INVALID` | A file is not JSON, or a catalogue is not an object of objects and strings (`{ "a": 42 }`) |
| `MESSAGE_UNPARSABLE` | A message is not valid ICU — a missing `}`, a plural or select without `other` |
| `MESSAGE_UNSUPPORTED` | A message parses but cannot become a correct `Intl` call: an unknown style (`{n, number, currency}`), a skeleton option `Intl` does not read (`::percent scale/100`), options `Intl` refuses (`::currency` with no currency code) |
| `KEY_NOT_CAMEL_CASE` | A key segment or an argument is not `camelCase` — `verify_email`, `{first_name}` — or a JSON key holds a dot (`"verifyEmail.title"`: nest it) |
| `KEY_CONFLICT` | A later source turns a namespace into a message, or the reverse |
| `KEY_MISSING` | A key of the fallback locale is missing in another locale |
| `KEY_UNKNOWN` | A locale holds a key the fallback locale does not |
| `ARGUMENT_UNDECLARED` | A translation uses an argument the fallback locale's message does not |
| `ARGUMENT_TYPE_MISMATCH` | An argument is a number in one place and a string or a date in another |

A mistake in how the build is **wired** — no locale, the same locale twice, a
`fallbackLocale` that is not in `locales`, `en_US` for `en-US` — is a bare
`TypeError`. See
[Catalogues — what fails the build](docs/guide/catalogues.md#what-fails-the-build).

## Traps

**Dates are written in UTC unless you pass a time zone.** Pass the
recipient's: `t(locale, key, { at }, { timeZone: user.timeZone })`.

**A tag is text.** `<b>` in a message stays the characters `<b>`, never
markup: `t` answers it as is, and the render functions of the next part escape
it in `html`. Styling belongs in the template.

**`{n}` in one locale and `{n, plural, …}` in another fails the build**
(`ARGUMENT_TYPE_MISMATCH`): a plain `{n}` is a string. Use the same kind in
every locale — `{n, number}` where a translation needs only the number.

**A plain `{n}` is not formatted.** `{n}` with `1234` writes `1234`;
`{n, number}` writes `1,234` in English and `1 234` in French.

**A translation may omit an argument, never invent one.** The fallback locale
declares the arguments: `fr` may leave `{name}` out, but `{nom}` fails the
build (`ARGUMENT_UNDECLARED`). Add an argument to the fallback locale first.

## Documentation

- [The guides](docs/README.md) — one page per area, with every case and every
  error.
- [Troubleshooting](docs/troubleshooting.md) — a build error or a compile
  error, its cause and its fix.
- [Roadmap](docs/roadmap.md) — what is next, and what is deliberately not
  planned.
- [Vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md)
  — the words these pages use, defined once.

## Type safety, counted

**8 plausible mistakes, 8 refused** at compile time, each measured by a
`@ts-expect-error` in
[`test/types/messages.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/test/types/messages.ts),
checked against a module the compiler emitted from a fixture — not a
hand-written one:

1. A missing argument: `t('fr', 'verifyEmail.body', {})`.
2. No arguments at all, for a message that has some.
3. A misspelled argument: `{ nom: 'Ada' }` for `{name}`.
4. A string where a plural expects a number: `{ hours: '24' }`.
5. A string where a date expects a `Date`: `{ at: '2026-09-25' }`.
6. A locale the build does not support: `t('de', …)`.
7. A key that does not exist: `'verifyEmail.titel'`.
8. An argument passed to a message that takes none:
   `t('en', 'verifyEmail.title', { name: 'Ada' })` — the call left behind when
   a message drops its `{name}`.

The same file holds the calls that must keep compiling: a refusal that refuses
the correct call is a bug.

## Licence

MIT
