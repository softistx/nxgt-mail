# Troubleshooting `@nxgt/mail-build`

Each entry is headed by the text you see: a build error, a compiler error on
the generated module, or a symptom in a rendered e-mail. Search this page for
the words of your message; `<locale>`, `<key>` and the like stand for the
names in yours.

How the messages are shaped:

- **A build error starts with where the problem is**: `messages: <locale>:
  <key> …`. It names the locale, the dotted key and, when there is one, the
  argument — **never the text of the message**.
- **A `MailBuildError` is a build that cannot be right.** Its `code` is one of
  the `MailBuildErrorCode` literals below, and it carries `locale` and `key`.
  Nothing is caught and nothing falls back to the raw message: the build
  stops, and no module is written.
- **A `TypeError` starting with `compileMessages:` is a wiring mistake**: the
  options you passed, not a catalogue. Fix the build script.
- **A mistake in a call to the generated `t()` is a compile error**, not a
  run-time one: the module types every key and every argument from the ICU.

```ts
import { MailBuildError } from '@nxgt/mail-build';

try {
  // compileMessages({ … })
} catch (error) {
  if (error instanceof MailBuildError) {
    console.error(error.code, error.locale, error.key, error.message);
  }
  throw error;
}
```

## Index

**Wiring the build**
- [`compileMessages: locales must hold at least one locale`](#compilemessages-locales-must-hold-at-least-one-locale)
- [`compileMessages: <locale> is not a locale — write it as a BCP 47 tag, as en or pt-BR`](#compilemessages-locale-is-not-a-locale--write-it-as-a-bcp-47-tag-as-en-or-pt-br)
- [`compileMessages: locales holds the same locale twice`](#compilemessages-locales-holds-the-same-locale-twice)
- [`compileMessages: fallbackLocale must be one of locales`](#compilemessages-fallbacklocale-must-be-one-of-locales)

**Catalogues**
- [`CATALOGUE_INVALID` — `messages: <locale>: <path> is not valid JSON`](#catalogue_invalid--messages-locale-path-is-not-valid-json)
- [`CATALOGUE_INVALID` — `messages: <locale>: (root) in <source> must be an object of messages`](#catalogue_invalid--messages-locale-root-in-source-must-be-an-object-of-messages)
- [`CATALOGUE_INVALID` — `messages: <locale>: <key> in <source> must be a message (a string) or an object of messages`](#catalogue_invalid--messages-locale-key-in-source-must-be-a-message-a-string-or-an-object-of-messages)
- [`KEY_NOT_CAMEL_CASE` — `messages: <locale>: <key> in <source> holds a dot — nest it instead, one object per segment`](#key_not_camel_case--messages-locale-key-in-source-holds-a-dot--nest-it-instead-one-object-per-segment)
- [`KEY_NOT_CAMEL_CASE` — `messages: <locale>: <key> in <source> is not camelCase — every segment of a key is camelCase, as verifyEmail.title`](#key_not_camel_case--messages-locale-key-in-source-is-not-camelcase--every-segment-of-a-key-is-camelcase-as-verifyemailtitle)
- [`KEY_CONFLICT` — `messages: <locale>: <key> is a <kind> in <source> and a <kind> in <source> — a later catalogue overrides a message, never a namespace`](#key_conflict--messages-locale-key-is-a-kind-in-source-and-a-kind-in-source--a-later-catalogue-overrides-a-message-never-a-namespace)
- [`KEY_MISSING` — `messages: <locale>: <key> is missing — <fallback>, the fallback locale, has it`](#key_missing--messages-locale-key-is-missing--fallback-the-fallback-locale-has-it)
- [`KEY_UNKNOWN` — `messages: <locale>: <key> is not a key of <fallback>, the fallback locale`](#key_unknown--messages-locale-key-is-not-a-key-of-fallback-the-fallback-locale)

**Messages**
- [`MESSAGE_UNPARSABLE` — `messages: <locale>: <key> is not a valid ICU message (<reason>)`](#message_unparsable--messages-locale-key-is-not-a-valid-icu-message-reason)
- [`MESSAGE_UNSUPPORTED` — `messages: <locale>: <key> uses the <number|date|time> style <style>, which is not supported`](#message_unsupported--messages-locale-key-uses-the-numberdatetime-style-style-which-is-not-supported)
- [`MESSAGE_UNSUPPORTED` — `messages: <locale>: <key> uses a <number|date|time> skeleton Intl refuses in <locale>, which is not supported`](#message_unsupported--messages-locale-key-uses-a-numberdatetime-skeleton-intl-refuses-in-locale-which-is-not-supported)
- [`MESSAGE_UNSUPPORTED` — `messages: <locale>: <key> uses a <number|date|time> skeleton option Intl does not read (<options>), which is not supported`](#message_unsupported--messages-locale-key-uses-a-numberdatetime-skeleton-option-intl-does-not-read-options-which-is-not-supported)
- [`MESSAGE_UNSUPPORTED` — `messages: <locale>: <key> uses a number skeleton that sets no option, which is not supported`](#message_unsupported--messages-locale-key-uses-a-number-skeleton-that-sets-no-option-which-is-not-supported)
- [`KEY_NOT_CAMEL_CASE` — `messages: <locale>: <key> uses {<argument>}, which is not camelCase — an argument is a camelCase name, as {firstName}`](#key_not_camel_case--messages-locale-key-uses-argument-which-is-not-camelcase--an-argument-is-a-camelcase-name-as-firstname)
- [`ARGUMENT_UNDECLARED` — `messages: <locale>: <key> uses {<argument>}, which <fallback> does not declare`](#argument_undeclared--messages-locale-key-uses-argument-which-fallback-does-not-declare)
- [`ARGUMENT_TYPE_MISMATCH` — `messages: <locale>: <key> uses {<argument>} as <kind> and as <kind>`](#argument_type_mismatch--messages-locale-key-uses-argument-as-kind-and-as-kind)
- [`ARGUMENT_TYPE_MISMATCH` — `messages: <locale>: <key> uses {<argument>} as <kind>, and <fallback> declares it as <kind>`](#argument_type_mismatch--messages-locale-key-uses-argument-as-kind-and-fallback-declares-it-as-kind)

**Calling the generated `t()`**
- [`TS2345: Argument of type '{}' is not assignable to parameter of type '{ readonly <argument>: <type>; }'.`](#ts2345-argument-of-type--is-not-assignable-to-parameter-of-type--readonly-argument-type-)
- [`TS2554: Expected 3-4 arguments, but got 2.`](#ts2554-expected-3-4-arguments-but-got-2)
- [`TS2353: Object literal may only specify known properties, and '<argument>' does not exist in type '{ readonly <declared>: <type>; }'.`](#ts2353-object-literal-may-only-specify-known-properties-and-argument-does-not-exist-in-type--readonly-declared-type-)
- [`TS2322: Type 'string' is not assignable to type 'number'.`](#ts2322-type-string-is-not-assignable-to-type-number)
- [`TS2322: Type 'string' is not assignable to type 'Date'.`](#ts2322-type-string-is-not-assignable-to-type-date)
- [`TS2345: Argument of type '"<locale>"' is not assignable to parameter of type '"en" | "fr"'.`](#ts2345-argument-of-type-locale-is-not-assignable-to-parameter-of-type-en--fr)
- [`TS2345: Argument of type '"<key>"' is not assignable to parameter of type 'keyof MessageArgs'.`](#ts2345-argument-of-type-key-is-not-assignable-to-parameter-of-type-keyof-messageargs)
- [`TS2322: Type '<type>' is not assignable to type 'never'.`](#ts2322-type-type-is-not-assignable-to-type-never)

**In the rendered e-mail**
- [A date or a time is off by some hours](#a-date-or-a-time-is-off-by-some-hours)
- [`<b>` shows in the e-mail as text](#b-shows-in-the-e-mail-as-text)
- [`0` takes the plural in English and the singular in French](#0-takes-the-plural-in-english-and-the-singular-in-french)
- [A `zero {…}` branch is never chosen in English](#a-zero--branch-is-never-chosen-in-english)
- [An argument shows as `{name}`, and an apostrophe is gone](#an-argument-shows-as-name-and-an-apostrophe-is-gone)
- [`RangeError: Invalid time zone specified: <zone>`](#rangeerror-invalid-time-zone-specified-zone)
- [`RangeError: Invalid time value`](#rangeerror-invalid-time-value)
- [A bug in `@nxgt/mail-build` itself](#a-bug-in-nxgtmail-build-itself)

The examples below build from `messages/<locale>.json` and write the module
to `src/generated/messages.ts`:

```ts
import { writeFile } from 'node:fs/promises';
import { compileMessages, readCatalogues } from '@nxgt/mail-build';

const locales = ['en', 'fr'];
const catalogues = await readCatalogues('messages', locales);
const { module } = compileMessages({
  locales,
  fallbackLocale: 'en',
  sources: [{ name: 'messages/', catalogues }],
});
await writeFile('src/generated/messages.ts', module);
```

---

## Wiring the build

Each of these is a bare `TypeError`, thrown by `compileMessages` before any
catalogue is read.

### `compileMessages: locales must hold at least one locale`

**When:** `compileMessages({ locales: [] … })`, typically with a list built
from a directory listing or an environment variable that came back empty.
**Why:** a module with no locale has no message to answer.
**Fix:** name the locales the build supports, the fallback among them:

```ts
import { compileMessages } from '@nxgt/mail-build';

compileMessages({ locales: ['en', 'fr'], fallbackLocale: 'en', sources: [] });
```

### `compileMessages: <locale> is not a locale — write it as a BCP 47 tag, as en or pt-BR`

**When:** `compileMessages`, with a locale written `en_US`, `EN` or `french`.
**Why:** a locale is a BCP 47 tag: a lower-case language of two or three
letters, then optional subtags joined by hyphens. It is what `Intl` takes,
and it is the name of the catalogue file.
**Fix:** `en`, `pt-BR`, `zh-Hant`; rename `messages/en_US.json` to
`messages/en-US.json` with it:

```ts
import { compileMessages } from '@nxgt/mail-build';

compileMessages({ locales: ['en-US', 'pt-BR'], fallbackLocale: 'en-US', sources: [] });
```

### `compileMessages: locales holds the same locale twice`

**When:** `compileMessages`, typically with locales merged from a preset's
list and the application's.
**Why:** each locale gets one catalogue in the module; a second one would be
ambiguous.
**Fix:** remove the duplicate:

```ts
import { compileMessages } from '@nxgt/mail-build';

const presetLocales = ['en', 'fr'];
const appLocales = ['fr', 'de'];

compileMessages({
  locales: [...new Set([...presetLocales, ...appLocales])],
  fallbackLocale: 'en',
  sources: [],
});
```

### `compileMessages: fallbackLocale must be one of locales`

**When:** `compileMessages`, with a `fallbackLocale` absent from `locales`:
`en` against `['en-US', 'fr']`, or a typo.
**Why:** the fallback locale is the reference every other locale is checked
against, so it must be built too.
**Fix:**

```ts
import { compileMessages } from '@nxgt/mail-build';

compileMessages({ locales: ['en-US', 'fr'], fallbackLocale: 'en-US', sources: [] });
```

---

## Catalogues

### `CATALOGUE_INVALID` — `messages: <locale>: <path> is not valid JSON`

**When:** `readCatalogues(dir, locales)`, on a `<locale>.json` that does not
parse: a trailing comma, a comment, an unescaped `"` inside a message. The
parser's own error is `error.cause`, with the position.
**Why:** a catalogue is strict JSON. A file that does not parse fails the
build rather than being skipped; a file that is **absent** is not an error,
the locale simply has nothing from that directory.
**Fix:** write strict JSON; a double quote inside a message is `\"`, and
there are no comments or trailing commas:

```json
{
  "verifyEmail": {
    "subject": "Confirm your e-mail address",
    "body": "Hello {name}, click \"Confirm\" to finish signing up."
  }
}
```

### `CATALOGUE_INVALID` — `messages: <locale>: (root) in <source> must be an object of messages`

**When:** `compileMessages`, on a catalogue that is not an object: a file
holding `["…"]` or `"…"`, or a source that passed the file's text instead of
its parsed JSON.
**Why:** a catalogue is nested objects whose leaves are ICU messages.
**Fix:** pass what `readCatalogues` answers, or `JSON.parse` of the file, as
the source's `catalogues`, one entry per locale:

```ts
import { readFile } from 'node:fs/promises';
import { type Catalogue, compileMessages } from '@nxgt/mail-build';

const en = JSON.parse(await readFile('messages/en.json', 'utf8')) as Catalogue;
compileMessages({
  locales: ['en'],
  fallbackLocale: 'en',
  sources: [{ name: 'messages/', catalogues: { en } }],
});
```

### `CATALOGUE_INVALID` — `messages: <locale>: <key> in <source> must be a message (a string) or an object of messages`

**When:** `compileMessages`, on a value that is neither a message (a string)
nor a namespace (an object): a number, `true`, `null`, an array.
**Why:** a catalogue is nested objects whose leaves are ICU messages, and
nothing else. A number is not a message: a message is text, even `"24"`.
**Fix:**

```json
{
  "verifyEmail": {
    "expires": "This link expires in {hours, plural, one {# hour} other {# hours}}."
  }
}
```

### `KEY_NOT_CAMEL_CASE` — `messages: <locale>: <key> in <source> holds a dot — nest it instead, one object per segment`

**When:** `compileMessages`, on a key written with a dot in the JSON:
`"verifyEmail.title": "…"`.
**Why:** the dotted key is how the build *names* a nested key; a catalogue
*writes* it as one object per segment, so that sources merge one message at
a time.
**Fix:**

```json
{
  "verifyEmail": {
    "title": "One step left"
  }
}
```

### `KEY_NOT_CAMEL_CASE` — `messages: <locale>: <key> in <source> is not camelCase — every segment of a key is camelCase, as verifyEmail.title`

**When:** `compileMessages`, on a key written `verify_email`, `VerifyEmail`,
`verify-email` or `2fa`, in any source.
**Why:** every segment of a key starts with a lower-case letter and holds
only letters and digits. Keys become names in the generated module, and the
casing rule holds across the repository.
**Fix:** one object per segment, each segment `camelCase`:

```json
{
  "verifyEmail": {
    "title": "One step left"
  },
  "twoFactor": {
    "code": "Your code is {code}."
  }
}
```

### `KEY_CONFLICT` — `messages: <locale>: <key> is a <kind> in <source> and a <kind> in <source> — a later catalogue overrides a message, never a namespace`

`<kind>` is `message` or `namespace`. The first `<source>` is the earlier
one, typically a preset; the second is the one that disagrees with it.

**When:** `compileMessages`, with more than one source — a preset, then the
application — when a later source writes a string where an earlier one has
an object, or the other way round: `"common": "Hi"` over
`"common": { "hi": "Hi" }`.
**Why:** sources merge **one message at a time**: a later catalogue replaces
a message, and adds keys to a namespace, but never replaces a whole
namespace with a message, nor a message with a namespace. Either would
silently drop, or orphan, the keys of the other source.
**Fix:** override the message itself, at its full key:

```json
{
  "common": {
    "hi": "Hello"
  }
}
```

### `KEY_MISSING` — `messages: <locale>: <key> is missing — <fallback>, the fallback locale, has it`

**When:** `compileMessages`, for a key the fallback locale has and
`<locale>` does not, once every source is merged. The first missing key, in
alphabetical order, is named.
**Also when:** `<locale>` has **no catalogue at all**: `readCatalogues`
answers `null` for a file it cannot find, so `messages/fr-FR.json` or
`messages/FR.json` for the locale `fr` makes every key of `fr` missing.
**Why:** every locale holds exactly the keys of the fallback locale. A
missing translation fails the build rather than sending the fallback
language, or a raw key, to a reader of another.
**Fix:** translate it, in `messages/<locale>.json`:

```json
{
  "greeting": {
    "hello": "Bonjour {name}"
  }
}
```

A preset that ships the key in that locale also satisfies it; the check runs
after the merge.

### `KEY_UNKNOWN` — `messages: <locale>: <key> is not a key of <fallback>, the fallback locale`

**When:** `compileMessages`, for a key `<locale>` has and the fallback locale
does not: a key renamed in the fallback catalogue and not in the others, a
typo in a translation, or a key added to a translation first.
**Why:** the fallback locale is the reference: its keys are the module's
keys, and its messages type their arguments. A key it does not have could
never be called.
**Fix:** add the key to the fallback catalogue, or rename or remove it in
`<locale>`:

```json
{
  "greeting": {
    "hello": "Hello {name}",
    "bye": "Goodbye"
  }
}
```

---

## Messages

### `MESSAGE_UNPARSABLE` — `messages: <locale>: <key> is not a valid ICU message (<reason>)`

**When:** `compileMessages`, on a message the ICU parser refuses. The error
has no `cause`: the parser's own error holds the text of the message, and a
build error never does.
**Why:** each message is parsed as ICU MessageFormat at build time; one that
does not parse fails the build rather than reaching an e-mail as `{name`.
**Fix:** the `<reason>` names the mistake:

| `<reason>` | Typical message | Fixed |
| --- | --- | --- |
| `EXPECT_ARGUMENT_CLOSING_BRACE` | `Hello {name` — or a plural missing its last `}` | `Hello {name}` |
| `EMPTY_ARGUMENT` | `Hello {}` | `Hello {name}`, or `Hello '{}'` for literal braces |
| `MALFORMED_ARGUMENT` | `{first-name}` | `{firstName}` |
| `INVALID_ARGUMENT_TYPE` | `{n, spellout}`, `{n, plurals, …}` | `number`, `date`, `time`, `plural`, `selectordinal` or `select` |
| `MISSING_OTHER_CLAUSE` | `{n, plural, one {# hour}}` | `{n, plural, one {# hour} other {# hours}}` |
| `DUPLICATE_PLURAL_ARGUMENT_SELECTOR` | `one {…}` twice in one plural | one branch per category |

Every `plural`, `selectordinal` and `select` needs an `other` branch: it is
what a value no other branch matches falls into.

```json
{
  "order": {
    "summary": "{count, plural, =0 {No items} one {One item} other {# items}}."
  }
}
```

### `MESSAGE_UNSUPPORTED` — `messages: <locale>: <key> uses the <number|date|time> style <style>, which is not supported`

**When:** `compileMessages`, on `{total, number, currency}`,
`{at, date, weekday}` or another named style the build does not know.
**Why:** a named style must map to `Intl` options at build time. The
supported names are:

| Argument | Named styles |
| --- | --- |
| `number` | `integer`, `percent` |
| `date` | `short`, `medium` (the default), `long`, `full` |
| `time` | `short`, `medium` (the default), `long`, `full` |

**Fix:** anything else is an ICU **skeleton**, written after `::`:

```json
{
  "order": {
    "summary": "{count, plural, one {One item} other {# items}}, {total, number, ::currency/EUR}.",
    "placedAt": "Placed on {at, date, ::yyyyMMdd}."
  }
}
```

A skeleton is checked too, by the three entries below.

### `MESSAGE_UNSUPPORTED` — `messages: <locale>: <key> uses a <number|date|time> skeleton Intl refuses in <locale>, which is not supported`

**When:** `compileMessages`, on a skeleton whose options `Intl` will not
build, most often `{total, number, ::currency}` — a currency with no code.
**Why:** the build constructs the `Intl` formatter of every skeleton once,
for its locale, so a skeleton that would throw on every call fails the build
instead.
**Fix:** complete the skeleton; a currency names its ISO code:

```json
{
  "order": {
    "total": "Total: {total, number, ::currency/EUR}"
  }
}
```

### `MESSAGE_UNSUPPORTED` — `messages: <locale>: <key> uses a <number|date|time> skeleton option Intl does not read (<options>), which is not supported`

**When:** `compileMessages`, on a skeleton the parser turns into an option
`Intl` ignores: `{n, number, ::scale/100}`, or `::percent scale/100` —
`(scale)` in the message. Also on the ES2023 rounding options:
`::.00 rounding-mode-floor` (`roundingMode`), `::.00/w`
(`trailingZeroDisplay`), `roundingPriority`.
**Why:** `Intl` would silently drop the option and format another number
than the one the skeleton says. The rounding options are refused because the
generated module compiles down to ES2020: an older `lib` rejects them, and an
older run time drops them.
**Fix:** do the arithmetic — or the rounding — before the call, and keep the
skeleton to what `Intl` reads:

```json
{
  "report": {
    "share": "{share, number, ::percent}"
  }
}
```

`::percent` multiplies by 100 itself: pass `0.25` for `25%`.

### `MESSAGE_UNSUPPORTED` — `messages: <locale>: <key> uses a number skeleton that sets no option, which is not supported`

**When:** `compileMessages`, on a number skeleton made only of stems the
parser does not know: `{n, number, ::foo}`, a typo such as `::precent`.
**Why:** a skeleton that sets nothing is almost always a misspelled one,
which would format the number plainly.
**Fix:** spell the stem, as `::percent`, `::currency/EUR` or
`::compact-short`, or drop the skeleton: `{n, number}`.

### `KEY_NOT_CAMEL_CASE` — `messages: <locale>: <key> uses {<argument>}, which is not camelCase — an argument is a camelCase name, as {firstName}`

**When:** `compileMessages`, on `{first_name}`, `{FirstName}` or a
positional `{0}`.
**Why:** an argument becomes a property of the generated `MessageArgs`, and
every name in this package is `camelCase`.
**Fix:**

```json
{
  "greeting": {
    "hello": "Hello {firstName}"
  }
}
```

### `ARGUMENT_UNDECLARED` — `messages: <locale>: <key> uses {<argument>}, which <fallback> does not declare`

**When:** `compileMessages`, on a translation that uses an argument the
fallback locale's message does not: a translated argument name
(`{nom}` for `{name}`), a typo, or a new argument added to one locale only.
**Why:** the arguments of a key are typed from the fallback locale's
message. An argument only a translation uses would never be passed, and
would reach the e-mail as `undefined`. A translation **may** leave out an
argument the fallback uses.
**Fix:** use the fallback locale's name, untranslated:

```json
{
  "greeting": {
    "hello": "Bonjour {name}"
  }
}
```

When the argument is new, add it to the fallback locale's message first.

### `ARGUMENT_TYPE_MISMATCH` — `messages: <locale>: <key> uses {<argument>} as <kind> and as <kind>`

`<kind>` is `string`, `number` or `date`.

**When:** `compileMessages`, on one message that uses the same argument two
ways: `{x, number} {x, date}`, or `{n, plural, …}` with `{n, date}` in a
branch.
**Why:** one argument has one type in `MessageArgs`. `{n, number}`, `plural`
and `selectordinal` make a `number`; `date` and `time` make a `Date`;
`select` makes a `string`. A plain `{n}` takes whatever the message uses `n`
as elsewhere, or `string`.
**Fix:** two arguments, one per type:

```json
{
  "order": {
    "shipped": "{count, plural, one {One parcel} other {# parcels}} shipped on {at, date, long}."
  }
}
```

### `ARGUMENT_TYPE_MISMATCH` — `messages: <locale>: <key> uses {<argument>} as <kind>, and <fallback> declares it as <kind>`

**When:** `compileMessages`, on a translation that uses an argument as
another type than the fallback locale does. Most often a plain `{n}` in a
translation, which is a `string`, where the fallback has
`{n, plural, …}`, a `number`.
**Why:** the type is the fallback locale's, and every locale is called with
the same arguments.
**Fix:** use the argument the same way, or write the number as a number:

```json
{
  "cart": {
    "days": "{n, number} jours"
  }
}
```

---

## Calling the generated `t()`

The generated module exports `t(locale, key, args?, options?)`, with the
keys, the arguments and their types taken from the catalogues. The eight
entries below are the calls `tsc` refuses; the examples use a module built
from:

```json
{
  "verifyEmail": {
    "title": "One step left",
    "body": "Hello {name}, confirm this address to finish signing up.",
    "expires": "This link expires in {hours, plural, one {# hour} other {# hours}}."
  },
  "order": {
    "placedAt": "Placed on {at, date, long} at {at, time, short}."
  }
}
```

### `TS2345: Argument of type '{}' is not assignable to parameter of type '{ readonly <argument>: <type>; }'.`

**When:** `tsc`, on a call that passes an arguments object missing an
argument: `t('fr', 'verifyEmail.body', {})`. With several arguments, the
source type lists the ones you passed.
**Why:** every argument the fallback locale's message uses is required.
**Fix:**

```ts
import { t } from './generated/messages';

t('fr', 'verifyEmail.body', { name: 'Ada' });
```

### `TS2554: Expected 3-4 arguments, but got 2.`

**When:** `tsc`, on a call with a locale and a key only, for a message that
has arguments: `t('fr', 'verifyEmail.body')`.
**Why:** the arguments object may be left out only for a message that takes
none, such as `verifyEmail.title`.
**Fix:** pass the arguments the message takes:

```ts
import { t } from './generated/messages';

t('fr', 'verifyEmail.body', { name: 'Ada' });
t('en', 'verifyEmail.title');
```

### `TS2353: Object literal may only specify known properties, and '<argument>' does not exist in type '{ readonly <declared>: <type>; }'.`

**When:** `tsc`, on a misspelled or translated argument name:
`t('fr', 'verifyEmail.body', { nom: 'Ada' })`.
**Why:** the names are the ones in the fallback locale's message, whatever
the locale you call.
**Fix:**

```ts
import { t } from './generated/messages';

t('fr', 'verifyEmail.body', { name: 'Ada' });
```

### `TS2322: Type 'string' is not assignable to type 'number'.`

**When:** `tsc`, on a string passed to a `plural`, `selectordinal` or
`{n, number}` argument: `t('fr', 'verifyEmail.expires', { hours: '24' })`,
typically a value read from a query string or an environment variable.
**Why:** a plural rule and a number format need a number; `"24"` would pick
the wrong branch or format as text.
**Fix:** convert where the value enters, and check it there:

```ts
import { t } from './generated/messages';

const hours = Number('24');
t('fr', 'verifyEmail.expires', { hours });
```

### `TS2322: Type 'string' is not assignable to type 'Date'.`

**When:** `tsc`, on an ISO string passed to a `date` or `time` argument:
`t('en', 'order.placedAt', { at: '2026-09-25' })`, typically a date read
from JSON or a database driver that answers strings.
**Why:** a `{at, date}` argument is a `Date`, formatted by
`Intl.DateTimeFormat`.
**Fix:**

```ts
import { t } from './generated/messages';

t('en', 'order.placedAt', { at: new Date('2026-09-25T21:30:00Z') });
```

### `TS2345: Argument of type '"<locale>"' is not assignable to parameter of type '"en" | "fr"'.`

`"en" | "fr"` is the list of your build's locales.

**When:** `tsc`, on a locale the build does not hold: `t('de', …)`. With a
`string` from a request or a user profile, the same mistake reads
`Argument of type 'string' is not assignable to parameter of type '"en" | "fr"'.`
**Why:** the module has a catalogue for each locale in `locales`, and none
for any other.
**Fix:** choose one of them first, with `pickLocale` from `@nxgt/mail` and
the module's `locales` and `fallbackLocale`:

```ts
import { pickLocale } from '@nxgt/mail';
import { fallbackLocale, locales, t } from './generated/messages';

declare const acceptLanguage: string | null;

const locale = pickLocale(acceptLanguage, locales, fallbackLocale);
t(locale, 'verifyEmail.title');
```

To add the locale instead, add it to `locales` and write its catalogue.

### `TS2345: Argument of type '"<key>"' is not assignable to parameter of type 'keyof MessageArgs'.`

**When:** `tsc`, on a key the catalogues do not hold, with or without an
arguments object: a typo (`t('en', 'verifyEmail.titel')`), a key renamed in
the catalogues, or a module not generated again since the key was added.
**Why:** `MessageKey` is the keys of the fallback locale, at the time the
module was generated.
**Fix:** use a key of the catalogue, and build the module again after
changing a catalogue:

```ts
import type { MessageKey } from './generated/messages';

const key: MessageKey = 'verifyEmail.title';
```

### `TS2322: Type '<type>' is not assignable to type 'never'.`

**When:** `tsc`, on an argument passed to a message that takes none:
`t('en', 'verifyEmail.title', { name: 'Ada' })` — typically the call left
behind after a message dropped its `{name}`. `<type>` is the type of the
value you passed.
**Why:** a message without arguments accepts an empty object, or nothing,
and every property of it is typed `never`, so a stale argument is caught
rather than silently ignored.
**Fix:** drop the argument, or put the argument back in the fallback
locale's message:

```ts
import { t } from './generated/messages';

t('en', 'verifyEmail.title');
t('en', 'verifyEmail.title', {}, { timeZone: 'Europe/Paris' });
```

---

## In the rendered e-mail

### A date or a time is off by some hours

**When:** at run time, a `{at, date}` or `{at, time}` near midnight shows
the day before or after, or a time shows as UTC.
**Why:** a date is written in **UTC unless the call names a time zone**. The
build machine's zone and the server's are never used: the same call gives
the same text wherever it runs.
**Fix:** pass the recipient's time zone, as an IANA name:

```ts
import { t } from './generated/messages';

declare const at: Date;

t('fr', 'order.placedAt', { at }, { timeZone: 'Europe/Paris' });
```

Store the zone with the recipient; the server's own zone is rarely theirs.

### `<b>` shows in the e-mail as text

**When:** a message holds markup, `"Keep <b>this</b> as text."`, and the
e-mail shows `<b>this</b>` instead of bold.
**Why:** **a tag in a message is text.** `t()` answers the characters
`<b>` as written, and HTML built from a message escapes it like any other
text, so no translation can inject markup into an e-mail.
**Fix:** keep the markup in the template, and split the message around it:

```json
{
  "order": {
    "keepBefore": "Keep",
    "keepStrong": "this",
    "keepAfter": "as text."
  }
}
```

If you put the output of `t()` into HTML yourself, escape it there: it is
text, not HTML.

### `0` takes the plural in English and the singular in French

**When:** `{hours, plural, one {# hour} other {# hours}}` gives
`0 hours` in English and `0 heure` in French.
**Why:** **by design.** A plural picks its branch by the locale's rules,
`Intl.PluralRules`: English puts 0 in `other`, French puts 0 and 1 in `one`.
Each is correct in its language.
**Fix:** for a text of its own at zero, write an exact `=0` branch; it wins
over the category in every locale:

```json
{
  "order": {
    "summary": "{count, plural, =0 {Aucun article} one {Un article} other {# articles}}"
  }
}
```

### A `zero {…}` branch is never chosen in English

**When:** `{n, plural, zero {none} one {one} other {#}}` answers the `other`
branch for 0 in English and the `one` branch in French, never `none`.
**Why:** `zero` is a plural *category*, used by languages such as Arabic or
Welsh, not "the value 0". English and French never select it.
**Fix:** write `=0 {none}`, as in the entry above.

### An argument shows as `{name}`, and an apostrophe is gone

**When:** a message such as `"Bienvenue sur l'{app}."` renders
`Bienvenue sur l{app}.` — the apostrophe gone, the argument written as is.
**Why:** in ICU, an apostrophe before `{`, `}` or `#` starts a quoted,
literal passage. `l'{app}` quotes `{app}`, so the message has no argument
and the build has nothing to check. An apostrophe before a letter, as in
`It's`, is a plain apostrophe.
**Fix:** write the typographic apostrophe `’`, or double the straight one:

```json
{
  "welcome": {
    "title": "Bienvenue sur l’{app}.",
    "subtitle": "Bienvenue sur l''{app}."
  }
}
```

### `RangeError: Invalid time zone specified: <zone>`

On Bun: `RangeError: invalid time zone: <zone>`.

**When:** a call to `t()` with `{ timeZone }` that is not an IANA name:
`'Paris'`, `'CET+1'`, a Windows zone name. Only a message with a `date` or
`time` argument throws.
**Why:** `Intl.DateTimeFormat` refuses a zone it does not know. The type of
`timeZone` is `string`, so the compiler cannot check it.
**Fix:** store and pass an IANA name, and check it where it enters, not at
send time:

```ts
const zone = 'Europe/Paris';
const known = Intl.supportedValuesOf('timeZone').includes(zone);
```

### `RangeError: Invalid time value`

On Bun: `RangeError: date value is not finite in DateTimeFormat format()`.

**When:** a call to `t()` with a `date` or `time` argument that is an
invalid `Date`: `new Date('')`, `new Date(undefined)`, a string that does not
parse.
**Why:** an invalid `Date` is still a `Date`, so it compiles; `Intl` refuses
to format it.
**Fix:** parse and check the value where it enters:

```ts
const at = new Date('2026-09-25T21:30:00Z');
if (Number.isNaN(at.getTime())) throw new TypeError('placedAt is not a date');
```

### A bug in `@nxgt/mail-build` itself

A `MESSAGE_UNSUPPORTED` that says `uses a tag` or `uses a # outside a plural`,
a generated module that does not compile, or a message this page says is
valid and the build refuses, is a bug in this package. Open an issue on
[`softistx/nxgt-mail`](https://github.com/softistx/nxgt-mail/issues) with
the error, the package version and the smallest catalogue that reproduces
it, with its text replaced by placeholders when it is not yours to share.
