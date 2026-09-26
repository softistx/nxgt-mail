# Catalogues

This page is for writing the catalogues — one JSON file of ICU messages per
locale — and compiling them: every form a message can take, what each argument
becomes in TypeScript, how sources merge, and every way the build fails.
`nxgt-mail build` reads them from `messages/` with the templates (see
[Building](building.md)); this page also shows `compileMessages`, which
compiles them alone.

```json
{
	"verifyEmail": {
		"subject": "Confirm your e-mail address",
		"expires": "This link expires in {hours, plural, one {# hour} other {# hours}}."
	}
}
```

```ts
// scripts/build-messages.ts — run from the project root
import { mkdir, writeFile } from 'node:fs/promises';
import { compileMessages, readCatalogues } from '@nxgt/mail-build';

const locales = ['en', 'fr'];
const { module } = compileMessages({
	locales,
	fallbackLocale: 'en',
	sources: [{ name: 'messages/', catalogues: await readCatalogues('messages', locales) }],
});

await mkdir('src/generated', { recursive: true });
await writeFile('src/generated/messages.ts', module);
```

```ts
import { t } from './generated/messages';

t('en', 'verifyEmail.expires', { hours: 1 }); // 'This link expires in 1 hour.'
```

That script is for a project with catalogues and no templates. With
templates, `nxgt-mail build` compiles both into `src/generated/mail.ts`, which
exports the same `t` beside `mails`. What the emitted module exports is in
[The generated module](generated-module.md).

## Files and keys

- **One file per locale**: `messages/en.json`, `messages/fr.json`,
  `messages/pt-BR.json`. The file name is the locale, a BCP 47 tag.
- **The fallback locale is the reference.** Every other locale must hold
  exactly its keys, and may only use the arguments its messages declare.
- **Keys nest.** A nested object is a namespace; a string is a message. The
  key of a message is its path, dotted: `verifyEmail.subject`.
- **Every segment is `camelCase`**, starting with a lowercase letter:
  `verifyEmail`, `passwordReset2`. `verify_email`, `VerifyEmail` and
  `verify-email` fail the build. Arguments are `camelCase` too: `{firstName}`.
- **A key never holds a dot.** `{ "verifyEmail.title": "…" }` fails the build:
  nest it, one object per segment.
- **A leaf is a string.** A number, a boolean, an array or `null` where a
  message is expected fails the build.

```json
{
	"verifyEmail": {
		"subject": "Confirm your e-mail address",
		"reminder": {
			"subject": "You have not confirmed your address yet",
			"body": "Hello {name}, your link is still waiting."
		}
	}
}
```

```ts
import { t } from './generated/messages';

t('en', 'verifyEmail.subject');
t('en', 'verifyEmail.reminder.body', { name: 'Ada' });
```

## Every form a message takes

The outputs below are what `t` answers in `en` and `fr`, for the message shown
and its French translation. A date is `new Date('2026-09-25T21:30:00Z')`.
Some French outputs hold a no-break space where a space is shown.

### Plain text

```json
{ "verifyEmail": { "subject": "Confirm your e-mail address" } }
```

```ts
t('en', 'verifyEmail.subject'); // 'Confirm your e-mail address'
```

No argument: `t` takes none. An empty `{}` is accepted; any property is a
compile error — `t('en', 'verifyEmail.subject', { name: 'Ada' })` is refused,
which is the call left behind when the fallback locale's message drops its
`{name}`.

### An argument — `{name}`

```json
{ "verifyEmail": { "body": "Hello {name}, confirm this address to finish signing up." } }
```

```ts
t('en', 'verifyEmail.body', { name: 'Ada' });
// 'Hello Ada, confirm this address to finish signing up.'
```

A `string`, written as given — no formatting, no escaping. A plain `{n}` is a
string too, unless the same message also uses `n` as a number or a date (see
[How arguments are typed](#how-arguments-are-typed)).

### Plural — `{count, plural, …}`, with `=0`

```json
{ "order": { "summary": "{count, plural, =0 {No items} one {One item} other {# items}}" } }
```

```ts
t('en', 'order.summary', { count: 0 }); // 'No items'
t('en', 'order.summary', { count: 1 }); // 'One item'
t('en', 'order.summary', { count: 1200 }); // '1,200 items'
t('fr', 'order.summary', { count: 1200 }); // '1 200 articles'
```

- `count` is a `number`.
- `=0`, `=1`, … match the **exact value** and win over a category.
- `one`, `two`, `few`, `many`, `other` are the categories of **the locale's**
  plural rule (`Intl.PluralRules`), which differ between languages. In French,
  `0` is `one`; in English it is `other`:

```json
{ "verifyEmail": { "expires": "This link expires in {hours, plural, one {# hour} other {# hours}}." } }
```

```ts
t('en', 'verifyEmail.expires', { hours: 0 }); // 'This link expires in 0 hours.'
t('fr', 'verifyEmail.expires', { hours: 0 }); // 'Ce lien expire dans 0 heure.'
```

- `#` is the number, formatted in the locale.
- `other` is **required**: it is the branch taken when the message has none
  for the locale's category. A plural without it fails the build
  (`MESSAGE_UNPARSABLE`, `MISSING_OTHER_CLAUSE`).

### Plural with an offset — `offset:1`

```json
{
	"order": {
		"guests": "{guests, plural, offset:1 =0 {Nobody is coming} =1 {{host} is coming} one {{host} and one guest are coming} other {{host} and # guests are coming}}"
	}
}
```

```ts
t('en', 'order.guests', { guests: 0, host: 'Ada' }); // 'Nobody is coming'
t('en', 'order.guests', { guests: 1, host: 'Ada' }); // 'Ada is coming'
t('en', 'order.guests', { guests: 2, host: 'Ada' }); // 'Ada and one guest are coming'
t('en', 'order.guests', { guests: 5, host: 'Ada' }); // 'Ada and 4 guests are coming'
```

`=N` compares the value **before** the offset; the category and `#` use the
value **minus** the offset. A message nested in a branch (`{host}`) is typed
like any other: `host` is a `string`.

### Ordinal — `{position, selectordinal, …}`

```json
{ "order": { "rank": "Your {position, selectordinal, one {#st} two {#nd} few {#rd} other {#th}} order" } }
```

```json
{ "order": { "rank": "Votre {position, selectordinal, one {#re} other {#e}} commande" } }
```

```ts
t('en', 'order.rank', { position: 1 }); // 'Your 1st order'
t('en', 'order.rank', { position: 22 }); // 'Your 22nd order'
t('en', 'order.rank', { position: 11 }); // 'Your 11th order'
t('fr', 'order.rank', { position: 1 }); // 'Votre 1re commande'
t('fr', 'order.rank', { position: 2 }); // 'Votre 2e commande'
```

A `number`. The categories are the locale's **ordinal** rule: English has four,
French two — each translation lists the ones its language uses.

### Select — `{method, select, …}`

```json
{
	"order": {
		"shipping": "{method, select, express {Express delivery} pickup {Pick-up in store} other {Standard delivery}}"
	}
}
```

```ts
t('en', 'order.shipping', { method: 'express' }); // 'Express delivery'
t('en', 'order.shipping', { method: 'drone' }); // 'Standard delivery'
```

A `string`, **not** a union of the branch names: any value compiles, and a
value with no branch takes `other` — including a name inherited from
`Object.prototype`, such as `'toString'`. As in a plural, `other` is
required.

### Numbers — `{n, number}`, `integer`, `percent`

```json
{
	"order": {
		"weight": "{kilos, number} kg",
		"items": "{count, number, integer} items",
		"discount": "{ratio, number, percent} off"
	}
}
```

```ts
t('en', 'order.weight', { kilos: 1234.567 }); // '1,234.567 kg'
t('fr', 'order.weight', { kilos: 1234.567 }); // '1 234,567 kg'
t('en', 'order.items', { count: 1234.5 }); // '1,235 items' — rounded
t('en', 'order.discount', { ratio: 0.25 }); // '25% off'
t('fr', 'order.discount', { ratio: 0.25 }); // '25 % de remise'
```

| Style | `Intl.NumberFormat` options |
| --- | --- |
| none | `{}` — the locale's default |
| `integer` | `{ maximumFractionDigits: 0 }` |
| `percent` | `{ style: 'percent' }` — `0.25` is `25%` |
| `::` skeleton | parsed at build time, below |
| `currency`, or any other name | **fails the build** (`MESSAGE_UNSUPPORTED`): write a skeleton |

### Number skeletons — `::currency/EUR`, `::compact-short`

A skeleton after `::` is parsed at build time into `Intl.NumberFormat` options
and written into the module as data.

```json
{
	"order": {
		"total": "Total: {total, number, ::currency/EUR}",
		"views": "{views, number, ::compact-short} views"
	}
}
```

```ts
t('en', 'order.total', { total: 1234.5 }); // 'Total: €1,234.50'
t('fr', 'order.total', { total: 1234.5 }); // 'Total : 1 234,50 €'
t('en', 'order.views', { views: 1234567 }); // '1.2M views'
t('fr', 'order.views', { views: 1234567 }); // '1,2 M vues'
```

The currency is part of the message: a price in another currency is another
message, or a `select` on the currency code.

A skeleton is checked at build time, so a wrong one fails the build
(`MESSAGE_UNSUPPORTED`) instead of every call:

| Skeleton | Why it fails |
| --- | --- |
| `::percent scale/100` | `scale` is an option `Intl.NumberFormat` does not read: it would be ignored, and the wrong number written |
| `::.00 rounding-mode-floor`, `::.00/w` | `roundingMode`, `trailingZeroDisplay` and the other rounding options are ES2023: a consumer compiling for an older `lib` refuses them, and an older run time ignores them |
| `::currency` | no currency code: `Intl.NumberFormat` refuses the options, in every locale |
| `::precision-unlimited`, or any skeleton that sets no option | nothing to format with: drop the skeleton |

### Dates and times — `{at, date}`, `{at, time}`

```json
{ "verifyEmail": { "requestedAt": "Requested on {at, date, long} at {at, time, short}." } }
```

```ts
const at = new Date('2026-09-25T21:30:00Z');

t('en', 'verifyEmail.requestedAt', { at }); // 'Requested on September 25, 2026 at 9:30 PM.'
t('fr', 'verifyEmail.requestedAt', { at }); // 'Demandé le 25 septembre 2026 à 21:30.'
t('fr', 'verifyEmail.requestedAt', { at }, { timeZone: 'Europe/Paris' });
// 'Demandé le 25 septembre 2026 à 23:30.'
```

A `Date`. **Written in UTC** unless the fourth argument of `t` names a time
zone — pass the recipient's, not the server's.

| `date` style | `en` | `fr` |
| --- | --- | --- |
| `short` | `9/25/26` | `25/09/26` |
| `medium`, or none | `Sep 25, 2026` | `25 sept. 2026` |
| `long` | `September 25, 2026` | `25 septembre 2026` |
| `full` | `Friday, September 25, 2026` | `vendredi 25 septembre 2026` |

| `time` style | `en` | `fr` |
| --- | --- | --- |
| `short` | `9:30 PM` | `21:30` |
| `medium`, or none | `9:30:00 PM` | `21:30:00` |
| `long`, `full` | `9:30:00 PM UTC` | `21:30:00 UTC` |

A date skeleton after `::` works as a number's does:

```json
{ "order": { "deliveryDay": "{at, date, ::EEEEMMMMd}" } }
```

```ts
const at = new Date('2026-09-25T21:30:00Z');

t('en', 'order.deliveryDay', { at }); // 'Friday, September 25'
t('fr', 'order.deliveryDay', { at }); // 'vendredi 25 septembre'
```

Any other style name (`{at, date, weekday}`) fails the build with
`MESSAGE_UNSUPPORTED`, and so does a date skeleton whose options `Intl` does
not read or refuses.

### Quoting — `'{…}'` and `''`

```json
{ "order": { "quoted": "Write '{name}' where your name goes, and it''s done" } }
```

```ts
t('en', 'order.quoted'); // "Write {name} where your name goes, and it's done"
```

ICU quoting: `'{name}'` is literal text, not an argument; `''` is one
apostrophe. A lone apostrophe elsewhere (`L'équipe`) is kept as written.

### Tags are text

```json
{ "order": { "markup": "Keep <b>this</b> & that as text" } }
```

```ts
t('en', 'order.markup'); // 'Keep <b>this</b> & that as text'
```

A tag is never parsed and never markup: `t` answers the characters, and a
render function escapes them in `html`. Emphasis, links and layout belong in
the [template](templates.md).

## How arguments are typed

An argument's type comes from how the **fallback locale's** message uses it.

| In the message | `ArgumentKind` | TypeScript |
| --- | --- | --- |
| `{name}` | `'string'` | `string` |
| `{method, select, …}` | `'string'` | `string` |
| `{count, plural, …}`, `{position, selectordinal, …}` | `'number'` | `number` |
| `{total, number}`, with any style or skeleton | `'number'` | `number` |
| `{at, date}`, `{at, time}`, with any style or skeleton | `'date'` | `Date` |
| no argument at all | — | `{ readonly [argument: string]: never }`: `{}` or nothing |

- A plain `{n}` in a message that also uses `n` as a number or a date takes
  that type:

  ```json
  { "a": "{n} ({n, plural, one {one} other {many}})" }
  ```

  `n` is a `number`; the plain `{n}` writes it unformatted (`1234`, not
  `1,234`).
- One message using an argument as two kinds (`{x, number} {x, date}`) fails
  the build.
- Every argument of the fallback locale's message is **required** in `t`, in
  every locale — even one whose translation leaves it out.

### Across locales

| A translation… | Result |
| --- | --- |
| uses the same arguments, the same kinds | compiles |
| leaves out an argument the fallback locale uses | compiles; the argument is still required, and not written |
| uses an argument the fallback locale does not declare | `ARGUMENT_UNDECLARED` |
| uses an argument as another kind — `{n}` against `{n, plural, …}` | `ARGUMENT_TYPE_MISMATCH` |
| has other plural or ordinal categories (`one`, `few`, …) | compiles: each locale lists its own |

```json
{ "order": { "reference": "Reference {ref}" } }
```

```json
{ "order": { "reference": "Référence" } }
```

```ts
t('fr', 'order.reference', { ref: 'A-42' }); // 'Référence' — ref is still required
```

To add an argument, add it to the fallback locale first; the other locales can
follow.

## Merging sources — presets, then the application

`sources` is a list of catalogues by locale, **earliest first**: presets, then
the application's own `messages/`. For each locale, the sources are merged key
by key before anything is checked.

```ts
import { compileMessages, readCatalogues } from '@nxgt/mail-build';

const locales = ['en', 'fr'];

const { module } = compileMessages({
	locales,
	fallbackLocale: 'en',
	sources: [
		{
			name: 'shared',
			catalogues: {
				en: { common: { greeting: 'Hello {name},', signOff: 'The team' } },
				fr: { common: { greeting: 'Bonjour {name},', signOff: "L'équipe" } },
			},
		},
		{ name: 'messages/', catalogues: await readCatalogues('messages', locales) },
	],
});
```

- **A later source overrides a message**, one key at a time. With
  `{ "common": { "signOff": "Ada, for Example Inc." } }` in `messages/en.json`,
  `common.signOff` is replaced in English, `common.greeting` is kept, and the
  French `common.signOff` stays `L'équipe`.
- **A namespace is never replaced whole.** Writing `"common": "Hi"` over a
  preset's `common` namespace fails the build with `KEY_CONFLICT`, and so does
  the reverse.
- **A source may leave a locale out** — `null`, as `readCatalogues` answers for
  a missing file, or absent. The merged catalogue of each locale is what must
  hold every key of the fallback locale's.
- **An override is checked like the rest**: a message you override must keep
  to the arguments of the fallback locale's merged message.

## Compiling — the API

```ts
function readCatalogues(
	dir: string,
	locales: readonly string[],
): Promise<Record<string, Catalogue | null>>;

function compileMessages(options: CompileMessagesOptions): CompiledMessages;

interface Catalogue {
	readonly [key: string]: string | Catalogue;
}

interface MessageSource {
	readonly name: string;
	readonly catalogues: Readonly<Record<string, Catalogue | null | undefined>>;
}

interface CompileMessagesOptions {
	readonly locales: readonly string[];
	readonly fallbackLocale: string;
	readonly sources: readonly MessageSource[];
}

interface CompiledMessages {
	readonly module: string;
	readonly args: ReadonlyMap<string, ReadonlyMap<string, ArgumentKind>>;
}

type ArgumentKind = 'string' | 'number' | 'date';
```

### `readCatalogues(dir, locales)`

Reads `<dir>/<locale>.json` for each locale — `dir` is resolved against the
current directory. A locale with no file answers `null`, an absence the merge
treats as empty (so a locale missing everywhere fails with `KEY_MISSING`). A
file that is not JSON fails with `CATALOGUE_INVALID`; any other read error is
thrown as is.

### `compileMessages(options)`

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `locales` | `readonly string[]` | required | Every locale the build supports, as BCP 47 tags (`en`, `pt-BR`). Their order is the order of the emitted `locales` |
| `fallbackLocale` | `string` | required | One of `locales`: the reference every other locale is checked against, and the source of every argument's type |
| `sources` | `readonly MessageSource[]` | required | Catalogues by locale, earliest first. `name` appears in error messages — `'preset nxgt'`, `'messages/'` |

It answers:

- `module` — the TypeScript source of the module, deterministic: the same
  catalogues give the same string. Write it where you import it from,
  `src/generated/messages.ts`.
- `args` — every key, with the kind of each argument, from the fallback locale:

```ts
import { compileMessages } from '@nxgt/mail-build';

const { args } = compileMessages({
	locales: ['en'],
	fallbackLocale: 'en',
	sources: [{ name: 'messages/', catalogues: { en: { a: '{n, plural, one {#} other {#}} {name} {at, date}' } } }],
});

Object.fromEntries(args.get('a') ?? []); // { n: 'number', name: 'string', at: 'date' }
```

## What fails the build

Every failure is a `MailBuildError` with a `code`, the `locale`, and the `key`
when there is one. Its `message` names the locale, the key and the argument —
**never the text of a message**, which may hold a secret.

```ts
class MailBuildError extends Error {
	name: string; // 'MailBuildError'
	readonly code: MailBuildErrorCode;
	readonly locale: string | undefined;
	readonly key: string | undefined;
	readonly template: string | undefined; // set by a template's errors — see Templates
}
```

The codes below are the catalogues'; the templates' (`TEMPLATE_*`,
`SUBJECT_MISSING`) are in [Templates](templates.md).

| `code` | Example `message` |
| --- | --- |
| `CATALOGUE_INVALID` | `messages: en: messages/en.json is not valid JSON` |
| `CATALOGUE_INVALID` | `messages: en: (root) in messages/ must be an object of messages` |
| `CATALOGUE_INVALID` | `messages: en: a.b in messages/ must be a message (a string) or an object of messages` |
| `MESSAGE_UNPARSABLE` | `messages: en: greeting.hello is not a valid ICU message (EXPECT_ARGUMENT_CLOSING_BRACE)` |
| `MESSAGE_UNPARSABLE` | `messages: en: a is not a valid ICU message (MISSING_OTHER_CLAUSE)` |
| `MESSAGE_UNSUPPORTED` | `messages: en: a uses the number style currency, which is not supported` |
| `MESSAGE_UNSUPPORTED` | `messages: en: a uses the date style weekday, which is not supported` |
| `MESSAGE_UNSUPPORTED` | `messages: en: a uses a number skeleton option Intl does not read (scale), which is not supported` |
| `MESSAGE_UNSUPPORTED` | `messages: en: a uses a number skeleton Intl refuses in en, which is not supported` |
| `MESSAGE_UNSUPPORTED` | `messages: en: a uses a number skeleton that sets no option, which is not supported` |
| `KEY_NOT_CAMEL_CASE` | `messages: en: verify_email in messages/ is not camelCase — every segment of a key is camelCase, as verifyEmail.title` |
| `KEY_NOT_CAMEL_CASE` | `messages: en: verifyEmail.title in messages/ holds a dot — nest it instead, one object per segment` |
| `KEY_NOT_CAMEL_CASE` | `messages: en: a uses {first_name}, which is not camelCase — an argument is a camelCase name, as {firstName}` |
| `KEY_CONFLICT` | `messages: en: common is a namespace in preset and a message in messages/ — a later catalogue overrides a message, never a namespace` |
| `KEY_CONFLICT` | `messages: en: common is a message in preset and a namespace in messages/ — a later catalogue overrides a message, never a namespace` |
| `KEY_MISSING` | `messages: fr: greeting.hello is missing — en, the fallback locale, has it` |
| `KEY_UNKNOWN` | `messages: fr: greeting.bye is not a key of en, the fallback locale` |
| `ARGUMENT_UNDECLARED` | `messages: fr: greeting.hello uses {nom}, which en does not declare` |
| `ARGUMENT_TYPE_MISMATCH` | `messages: fr: a uses {n} as string, and en declares it as number` |
| `ARGUMENT_TYPE_MISMATCH` | `messages: en: a uses {x} as number and as date` |

The build stops at the first failure. A mistake in the options themselves is a
wiring mistake, a bare `TypeError`:

| Mistake | `TypeError` message |
| --- | --- |
| `locales: []` | `compileMessages: locales must hold at least one locale` |
| `locales: ['en', 'en']` | `compileMessages: locales holds the same locale twice` |
| `fallbackLocale` not in `locales` | `compileMessages: fallbackLocale must be one of locales` |
| `locales: ['en_US']` | `compileMessages: en_US is not a locale — write it as a BCP 47 tag, as en or pt-BR` |

### A catalogue check in your tests

Compiling in a spec fails CI on a broken catalogue before any build script
runs, with the locale and the key in the report:

```ts
import { expect, it } from 'bun:test';
import { compileMessages, readCatalogues } from '@nxgt/mail-build';

it('compiles every catalogue', async () => {
	const locales = ['en', 'fr'];
	const catalogues = await readCatalogues('messages', locales);

	const { args } = compileMessages({
		locales,
		fallbackLocale: 'en',
		sources: [{ name: 'messages/', catalogues }],
	});

	expect(args.get('verifyEmail.expires')?.get('hours')).toBe('number');
});
```
