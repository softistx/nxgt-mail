# Troubleshooting `@nxgt/mail-build`

Each entry is headed by the text you see: a build error, a compiler error on
the generated module, an error thrown when an e-mail is rendered, or a
symptom in a rendered e-mail. Search this page for the words of your message;
`<locale>`, `<key>`, `<file>`, `<prop>` and the like stand for the names in
yours.

How the messages are shaped:

- **A build error starts with where the problem is**: `messages: <locale>:
  <key> …` for a catalogue, `templates: <file>: …` for a template. It names
  the locale, the template, the dotted key and, when there is one, the
  argument or the prop — **never the text of the message**.
- **A `MailBuildError` is a build that cannot be right.** Its `code` is one of
  the `MailBuildErrorCode` literals below, and it carries `locale`, `key` and
  `template` when they apply. Nothing is caught and nothing falls back to the
  raw message: the build stops, and no module is written.
- **A `TypeError` starting with `compileMessages:`, `build:` or `nxgt-mail:`
  is a wiring mistake**: the options, the config or the command, not a
  catalogue or a template. Fix the build script.
- **A mistake in a call to the generated `t()` or `mails.<email>()` is a
  compile error**, not a run-time one: the module types every key, every
  argument and every prop. The one check left for run time is a URL prop.

```ts
import { MailBuildError } from '@nxgt/mail-build';

try {
  // build(config), compileMail({ … }) or compileMessages({ … })
} catch (error) {
  if (error instanceof MailBuildError) {
    console.error(error.code, error.template, error.locale, error.key, error.message);
  }
  throw error;
}
```

`nxgt-mail build` prints the message of a `MailBuildError` or of a wiring
`TypeError` alone, without a stack, and exits with 1.

## Index

**Wiring the build**
- [`compileMessages: locales must hold at least one locale`](#compilemessages-locales-must-hold-at-least-one-locale)
- [`compileMessages: <locale> is not a locale — write it as a BCP 47 tag, as en or pt-BR`](#compilemessages-locale-is-not-a-locale--write-it-as-a-bcp-47-tag-as-en-or-pt-br)
- [`compileMessages: locales holds the same locale twice`](#compilemessages-locales-holds-the-same-locale-twice)
- [`compileMessages: fallbackLocale must be one of locales`](#compilemessages-fallbacklocale-must-be-one-of-locales)

**Running `nxgt-mail`**
- [`nxgt-mail: unknown command <command>`](#nxgt-mail-unknown-command-command)
- [`nxgt-mail: Unknown option '<option>'`](#nxgt-mail-unknown-option-option)
- [`nxgt-mail: Option '-c, --config <value>' argument missing`](#nxgt-mail-option--c---config-value-argument-missing)
- [`nxgt-mail: --out is for dev — build writes where the config's out says`](#nxgt-mail---out-is-for-dev--build-writes-where-the-configs-out-says)
- [`nxgt-mail: no config — write mail.config.ts, or pass --config <file>`](#nxgt-mail-no-config--write-mailconfigts-or-pass---config-file)
- [`nxgt-mail: <file> does not exist`](#nxgt-mail-file-does-not-exist)
- [`build: the config must be an object — export default defineMailConfig({ … })`](#build-the-config-must-be-an-object--export-default-definemailconfig--)
- [`build: the config has no locales — is it the default export? export default defineMailConfig({ … })`](#build-the-config-has-no-locales--is-it-the-default-export-export-default-definemailconfig--)
- [`build: locales must be a list of locales, as ['en', 'fr']`](#build-locales-must-be-a-list-of-locales-as-en-fr)
- [`build: fallbackLocale must be one of locales, as 'en'`](#build-fallbacklocale-must-be-one-of-locales-as-en)
- [`build: <name> must be a path, or left out`](#build-name-must-be-a-path-or-left-out)
- [`build: <dir> holds no catalogue — write one <locale>.json per locale there, or set messages in the config`](#build-dir-holds-no-catalogue--write-one-localejson-per-locale-there-or-set-messages-in-the-config)
- [`build: <dir> does not exist — put one .vue template per e-mail there, or set emails in the config`](#build-dir-does-not-exist--put-one-vue-template-per-e-mail-there-or-set-emails-in-the-config)
- [`build: <dir> holds no .vue template — put one per e-mail there`](#build-dir-holds-no-vue-template--put-one-per-e-mail-there)

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

**Templates: what a template may hold**
- [`TEMPLATE_INVALID` — `templates: <file>: is not a kebab-case .vue file name — name it as verify-email.vue`](#template_invalid--templates-file-is-not-a-kebab-case-vue-file-name--name-it-as-verify-emailvue)
- [`TEMPLATE_INVALID` — `templates: <file>: is the e-mail <email>, as <other>.vue is — rename one of them`](#template_invalid--templates-file-is-the-e-mail-email-as-othervue-is--rename-one-of-them)
- [`TEMPLATE_INVALID` — `templates: <file>: does not parse as a single-file component (<reason>)`](#template_invalid--templates-file-does-not-parse-as-a-single-file-component-reason)
- [`TEMPLATE_INVALID` — `templates: <file>: has no <template>`](#template_invalid--templates-file-has-no-template)
- [`TEMPLATE_INVALID` — `templates: <file>: has a <script> without setup — declare the props in <script setup>`](#template_invalid--templates-file-has-a-script-without-setup--declare-the-props-in-script-setup)
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: holds code in <script setup> — a template declares its props with defineProps([...]), unassigned, and nothing else`](#template_unsupported--templates-file-holds-code-in-script-setup--a-template-declares-its-props-with-defineprops-unassigned-and-nothing-else)
- [`TEMPLATE_INVALID` — `templates: <file>: does not declare its props in a form the build reads (<reason>)`](#template_invalid--templates-file-does-not-declare-its-props-in-a-form-the-build-reads-reason)
- [`TEMPLATE_INVALID` — `templates: <file>: declares the prop <prop>, a name the render function uses itself`](#template_invalid--templates-file-declares-the-prop-prop-a-name-the-render-function-uses-itself)
- [`TEMPLATE_INVALID` — `templates: <file>: declares the prop <prop>, which is not camelCase — name it as firstName`](#template_invalid--templates-file-declares-the-prop-prop-which-is-not-camelcase--name-it-as-firstname)
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: <<tag>> uses v-<directive> — a template renders once, at build time, so it has no condition, no loop and no event`](#template_unsupported--templates-file-tag-uses-v-directive--a-template-renders-once-at-build-time-so-it-has-no-condition-no-loop-and-no-event)
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: <<tag>> binds an object with v-bind — bind each attribute by name`](#template_unsupported--templates-file-tag-binds-an-object-with-v-bind--bind-each-attribute-by-name)
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: <where> holds an expression — write a prop, or t('key', { prop }), and nothing else`](#template_unsupported--templates-file-where-holds-an-expression--write-a-prop-or-tkey--prop--and-nothing-else)
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: <where> uses <name>, which is not a prop — declare it with defineProps`](#template_unsupported--templates-file-where-uses-name-which-is-not-a-prop--declare-it-with-defineprops)

**Templates: where a value lands**
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: <value> lands in a <<element>> element`](#template_unsupported--templates-file-value-lands-in-a-element-element)
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: <value> lands in a tag outside a quoted attribute value`](#template_unsupported--templates-file-value-lands-in-a-tag-outside-a-quoted-attribute-value)
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: <value> lands in the <attribute> attribute — only text attributes (alt, title, aria-*…) and URLs (href, src) take a value`](#template_unsupported--templates-file-value-lands-in-the-attribute-attribute--only-text-attributes-alt-title-aria--and-urls-href-src-take-a-value)
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: <value> starts an href — a URL is a prop, checked when the e-mail is rendered`](#template_unsupported--templates-file-value-starts-an-href--a-url-is-a-prop-checked-when-the-e-mail-is-rendered)
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: <value> lands in an href whose fixed start is not http:, https: or mailto:`](#template_unsupported--templates-file-value-lands-in-an-href-whose-fixed-start-is-not-http-https-or-mailto)

**Templates: against the catalogues**
- [`TEMPLATE_KEY_UNKNOWN` — `templates: <file>: t('<key>') is not a key of <fallback>, the fallback locale`](#template_key_unknown--templates-file-tkey-is-not-a-key-of-fallback-the-fallback-locale)
- [`TEMPLATE_ARGUMENT_MISSING` — `templates: <file>: t('<key>') leaves out {<argument>}, which <fallback> declares — pass it a prop`](#template_argument_missing--templates-file-tkey-leaves-out-argument-which-fallback-declares--pass-it-a-prop)
- [`TEMPLATE_ARGUMENT_MISSING` — `templates: <file>: t('<key>') passes {<argument>} a value that is not a prop`](#template_argument_missing--templates-file-tkey-passes-argument-a-value-that-is-not-a-prop)
- [`TEMPLATE_ARGUMENT_UNKNOWN` — `templates: <file>: t('<key>') passes {<argument>}, which <fallback> does not declare`](#template_argument_unknown--templates-file-tkey-passes-argument-which-fallback-does-not-declare)
- [`SUBJECT_MISSING` — `templates: <file>: the e-mail <email> has no subject — add <email>.subject to <fallback>, the fallback locale`](#subject_missing--templates-file-the-e-mail-email-has-no-subject--add-emailsubject-to-fallback-the-fallback-locale)
- [`TEMPLATE_ARGUMENT_MISSING` — `templates: <file>: <email>.subject uses {<argument>}, which is not a prop of the template — declare it with defineProps`](#template_argument_missing--templates-file-emailsubject-uses-argument-which-is-not-a-prop-of-the-template--declare-it-with-defineprops)
- [`ARGUMENT_TYPE_MISMATCH` — `templates: <file>: the prop <prop> is <kind> <where>, and <kind> <where>`](#argument_type_mismatch--templates-file-the-prop-prop-is-kind-where-and-kind-where)
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: declares the prop <prop> and never uses it — remove it, or write it in the template`](#template_unsupported--templates-file-declares-the-prop-prop-and-never-uses-it--remove-it-or-write-it-in-the-template)

**Templates: rendering**
- [`TEMPLATE_INVALID` — `templates: <file>: Maizzle could not render it (<reason>)`](#template_invalid--templates-file-maizzle-could-not-render-it-reason)
- [`TEMPLATE_INVALID` — `templates: <file>: uses <<Name>>, which is not a component — check its name`](#template_invalid--templates-file-uses-name-which-is-not-a-component--check-its-name)
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: t('<key>') is not in the output — a component dropped it, or used it at build time`](#template_unsupported--templates-file-tkey-is-not-in-the-output--a-component-dropped-it-or-used-it-at-build-time)
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: the prop <prop> is not in the output — a component dropped it, or used it at build time (as a QR code does)`](#template_unsupported--templates-file-the-prop-prop-is-not-in-the-output--a-component-dropped-it-or-used-it-at-build-time-as-a-qr-code-does)
- [`TEMPLATE_INVALID` — `templates: <file>: Tailwind did not compile its CSS — @import or @apply left in the output`](#template_invalid--templates-file-tailwind-did-not-compile-its-css--import-or-apply-left-in-the-output)
- [`TEMPLATE_UNSUPPORTED` — `templates: <file>: a value was changed while rendering — a component or a transformer rewrote it`](#template_unsupported--templates-file-a-value-was-changed-while-rendering--a-component-or-a-transformer-rewrote-it)

**Calling the generated `t()`**
- [`TS2345: Argument of type '{}' is not assignable to parameter of type '{ readonly <argument>: <type>; }'.`](#ts2345-argument-of-type--is-not-assignable-to-parameter-of-type--readonly-argument-type-)
- [`TS2554: Expected 3-4 arguments, but got 2.`](#ts2554-expected-3-4-arguments-but-got-2)
- [`TS2353: Object literal may only specify known properties, and '<argument>' does not exist in type '{ readonly <declared>: <type>; }'.`](#ts2353-object-literal-may-only-specify-known-properties-and-argument-does-not-exist-in-type--readonly-declared-type-)
- [`TS2322: Type 'string' is not assignable to type 'number'.`](#ts2322-type-string-is-not-assignable-to-type-number)
- [`TS2322: Type 'string' is not assignable to type 'Date'.`](#ts2322-type-string-is-not-assignable-to-type-date)
- [`TS2345: Argument of type '"<locale>"' is not assignable to parameter of type '"en" | "fr"'.`](#ts2345-argument-of-type-locale-is-not-assignable-to-parameter-of-type-en--fr)
- [`TS2345: Argument of type '"<key>"' is not assignable to parameter of type 'keyof MessageArgs'.`](#ts2345-argument-of-type-key-is-not-assignable-to-parameter-of-type-keyof-messageargs)
- [`TS2322: Type '<type>' is not assignable to type 'never'.`](#ts2322-type-type-is-not-assignable-to-type-never)

**Calling `mails`**
- [`TS2322: Type '"<locale>"' is not assignable to type '"en" | "fr"'.`](#ts2322-type-locale-is-not-assignable-to-type-en--fr)
- [`TS2353: Object literal may only specify known properties, and '<prop>' does not exist in type '{ readonly locale: "en" | "fr"; readonly timeZone?: string; … }'.`](#ts2353-object-literal-may-only-specify-known-properties-and-prop-does-not-exist-in-type--readonly-locale-en--fr-readonly-timezone-string--)
- [`TS2345: Argument of type '{ locale: …; … }' is not assignable to parameter of type '{ readonly locale: "en" | "fr"; readonly timeZone?: string; … }'.`](#ts2345-argument-of-type--locale----is-not-assignable-to-parameter-of-type--readonly-locale-en--fr-readonly-timezone-string--)
- [`TS2322: Type 'URL' is not assignable to type 'string'.`](#ts2322-type-url-is-not-assignable-to-type-string)
- [`TS2339: Property '<email>' does not exist on type '{ readonly <email>: (args: …) => RenderedMail; … }'.`](#ts2339-property-email-does-not-exist-on-type--readonly-email-args---renderedmail--)
- [`TypeError: mails.<email>: <prop> must be an http:, https: or mailto: URL`](#typeerror-mailsemail-prop-must-be-an-http-https-or-mailto-url)
- [`TypeError: mails.<email>: <prop> must be an http: or https: URL`](#typeerror-mailsemail-prop-must-be-an-http-or-https-url)

**In the rendered e-mail**
- [A date or a time is off by some hours](#a-date-or-a-time-is-off-by-some-hours)
- [`<b>` shows in the e-mail as text](#b-shows-in-the-e-mail-as-text)
- [`0` takes the plural in English and the singular in French](#0-takes-the-plural-in-english-and-the-singular-in-french)
- [A `zero {…}` branch is never chosen in English](#a-zero--branch-is-never-chosen-in-english)
- [An argument shows as `{name}`, and an apostrophe is gone](#an-argument-shows-as-name-and-an-apostrophe-is-gone)
- [`RangeError: Invalid time zone specified: <zone>`](#rangeerror-invalid-time-zone-specified-zone)
- [`RangeError: Invalid time value`](#rangeerror-invalid-time-value)
- [A line break in a subject argument shows as a space](#a-line-break-in-a-subject-argument-shows-as-a-space)
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

The template and `mails` examples use `nxgt-mail build`, which writes one
module, `src/generated/mail.ts` by default, holding `t` as well as `mails`.

---

## Wiring the build

Each of these is a bare `TypeError`, thrown by `compileMessages` before any
catalogue is read. You meet them when you call `compileMessages` or
`compileMail` yourself. Through `nxgt-mail build` or `dev`, `build()` or
`dev()`, the config is checked first, and the same mistakes answer with the
`build:` messages of [Running `nxgt-mail`](#running-nxgt-mail): an empty
`locales` or a `fallbackLocale` outside it gives
[`build: fallbackLocale must be one of locales, as 'en'`](#build-fallbacklocale-must-be-one-of-locales-as-en).
A locale written twice, or one that is not a BCP 47 tag but has its
`<locale>.json`, still reaches `compileMessages` and gets the message below.

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

## Running `nxgt-mail`

The CLI prints each of these alone, without a stack, and exits with 1; a
mistake on the command line is followed by the usage. `build()`, `dev()` and
`compileProject()` throw the `build:` ones as a `TypeError`, before any
template is rendered.

### `nxgt-mail: unknown command <command>`

**When:** `nxgt-mail <command>` with a command other than `build` or `dev`,
as `nxgt-mail buld`. The usage follows the message.
**Why:** the CLI has two commands. Run with no command at all, it prints the
usage and exits with 1 too.
**Fix:**

```sh
nxgt-mail build   # writes the generated module
nxgt-mail dev     # renders every e-mail in every locale to .nxgt-mail/
```

### `nxgt-mail: Unknown option '<option>'`

The message goes on: `To specify a positional argument starting with a '-',
place it at the end of the command after '--', …`

**When:** `nxgt-mail build` or `dev`, with an option it does not know:
`--bogus`, `--watch`. The usage follows the message, and the exit code is 1.
**Why:** the CLI takes `--config` (`-c`), `--out` (`-o`) and `--help` (`-h`),
and nothing else.
**Fix:**

```sh
nxgt-mail build --config mail.config.ts
nxgt-mail dev --out .nxgt-mail
```

### `nxgt-mail: Option '-c, --config <value>' argument missing`

With `--out` last: `nxgt-mail: Option '-o, --out <value>' argument missing`.

**When:** `nxgt-mail build --config` or `dev --out` with nothing after the
option, typically a script whose variable came back empty:
`nxgt-mail build --config $MAIL_CONFIG`. The usage follows the message, and
the exit code is 1.
**Why:** `--config` and `--out` each take a path; with none, the command
line cannot be read.
**Fix:** give the path, or leave the option out to use the default:

```sh
nxgt-mail build --config mail.config.ts
nxgt-mail build
```

### `nxgt-mail: --out is for dev — build writes where the config's out says`

**When:** `nxgt-mail build --out <dir>` or `build -o <dir>`. The usage
follows the message.
**Why:** `--out` is the preview folder of `nxgt-mail dev`. Where `build`
writes the module is part of the config, so every run writes it to the same
place.
**Fix:** set `out` in the config:

```ts
import { defineMailConfig } from '@nxgt/mail-build';

export default defineMailConfig({
  locales: ['en', 'fr'],
  fallbackLocale: 'en',
  out: 'src/generated/mail.ts',
});
```

### `nxgt-mail: no config — write mail.config.ts, or pass --config <file>`

**When:** `nxgt-mail build` or `dev`, run from a folder that holds no
`mail.config.ts`, `.mts`, `.js` or `.mjs` — typically the root of a
workspace, when the config lives in one of its packages.
**Why:** the CLI looks for the config in the working directory only, not in
its parents.
**Fix:** write the config beside the `emails/` and `messages/` folders, and
run the command from there:

```ts
// mail.config.ts
import { defineMailConfig } from '@nxgt/mail-build';

export default defineMailConfig({
  locales: ['en', 'fr'],
  fallbackLocale: 'en',
});
```

Or name it from where you are: `nxgt-mail build --config packages/mailer/mail.config.ts`.
The paths inside the config stay relative to the config's own folder.

### `nxgt-mail: <file> does not exist`

**When:** `nxgt-mail build --config <file>` or `dev --config <file>`, with a
file that is not there. `<file>` is the path as you wrote it.
**Why:** `--config` is resolved from the working directory, not from the
workspace root or the package.
**Fix:** pass the config relative to where the command runs:

```sh
cd packages/mailer && nxgt-mail build --config mail.config.ts
```

### `build: the config must be an object — export default defineMailConfig({ … })`

**When:** `nxgt-mail build` or `dev`, on a config whose default export is not
an object — `undefined`, `null`, a function — or `build()` called without
one. A config with no default export at all gets the next entry.
**Why:** the config is read as data, and checked before it is used.
**Fix:**

```ts
// mail.config.ts
import { defineMailConfig } from '@nxgt/mail-build';

export default defineMailConfig({
  locales: ['en', 'fr'],
  fallbackLocale: 'en',
});
```

### `build: the config has no locales — is it the default export? export default defineMailConfig({ … })`

**When:** `nxgt-mail build` or `dev`, on a config file that exports its config
under a name (`export const config = …`) instead of `export default`, or
`build({})`: neither `locales` nor `fallbackLocale` is there.
**Why:** the CLI reads the default export; without one it finds an empty
module.
**Fix:**

```ts
// mail.config.ts
import { defineMailConfig } from '@nxgt/mail-build';

export default defineMailConfig({
  locales: ['en', 'fr'],
  fallbackLocale: 'en',
});
```

### `build: locales must be a list of locales, as ['en', 'fr']`

**When:** `nxgt-mail build` or `dev`, or `build()`, on a config whose
`locales` is missing or is not an array of strings: `locales: 'en'`, a list
read from an environment variable and not split.
**Why:** `locales` is every locale the build compiles, in order.
**Fix:**

```ts
import { defineMailConfig } from '@nxgt/mail-build';

export default defineMailConfig({
  locales: ['en', 'fr'],
  fallbackLocale: 'en',
});
```

### `build: fallbackLocale must be one of locales, as 'en'`

**When:** `nxgt-mail build` or `dev`, or `build()`, on a config whose
`fallbackLocale` is missing, is not a string (`['en']`), or is not one of
`locales` (`locales: ['en'], fallbackLocale: 'fr'`). Calling
`compileMessages` directly gives the same mistake as
[`compileMessages: fallbackLocale must be one of locales`](#compilemessages-fallbacklocale-must-be-one-of-locales).
**Why:** the fallback locale is the reference every other locale and every
template is checked against.
**Fix:** one locale, as a string, that `locales` holds:

```ts
import { defineMailConfig } from '@nxgt/mail-build';

export default defineMailConfig({
  locales: ['en', 'fr'],
  fallbackLocale: 'en',
});
```

### `build: <name> must be a path, or left out`

**When:** `nxgt-mail build` or `dev`, or `build()`, on a config whose
`emails`, `messages` or `out` is not a string: `emails: ['emails']`,
`out: null`.
**Why:** each is one path, relative to the config's folder; left out, it is
`emails`, `messages` and `src/generated/mail.ts`.
**Fix:**

```ts
import { defineMailConfig } from '@nxgt/mail-build';

export default defineMailConfig({
  locales: ['en', 'fr'],
  fallbackLocale: 'en',
  emails: 'src/emails',
});
```

### `build: <dir> holds no catalogue — write one <locale>.json per locale there, or set messages in the config`

**When:** `nxgt-mail build` or `dev`, or `build()`, when the messages folder
is missing, or holds no `<locale>.json` for any locale of the config.
`<dir>` is the absolute path the build looked in: `messages/` beside the
config, unless the config says otherwise.
**Why:** with no catalogue at all, the folder is almost surely the wrong one.
A catalogue missing for one locale only is not reported here: the build
reports each key that locale lacks, with
[`KEY_MISSING`](#key_missing--messages-locale-key-is-missing--fallback-the-fallback-locale-has-it).
**Fix:** write `messages/en.json` and one file per other locale, or point
`messages` at the folder that holds them:

```ts
import { defineMailConfig } from '@nxgt/mail-build';

export default defineMailConfig({
  locales: ['en', 'fr'],
  fallbackLocale: 'en',
  messages: 'src/messages',
});
```

### `build: <dir> does not exist — put one .vue template per e-mail there, or set emails in the config`

**When:** `nxgt-mail build` or `dev`, `build()`, `dev()` or
`compileProject()`, when the templates folder is missing. `<dir>` is the
absolute path the build looked in: `emails/` beside the config (or under
`root`), unless the config says otherwise.
**Why:** a templates folder that is absent is a wrong path far more often
than a project with no e-mail.
**Fix:** name the folder where it is, relative to the config:

```ts
import { defineMailConfig } from '@nxgt/mail-build';

export default defineMailConfig({
  locales: ['en', 'fr'],
  fallbackLocale: 'en',
  emails: 'src/emails',
});
```

### `build: <dir> holds no .vue template — put one per e-mail there`

**When:** `nxgt-mail build` or `dev`, or `build()`, when the templates folder
exists but holds no file ending in `.vue` — an empty folder, templates in a
subfolder, or `emails` pointing at another folder.
**Why:** a module with no e-mail is never what a build is for. Subfolders are
not read: each template is one file directly in the folder.
**Fix:** one `.vue` per e-mail, directly in the folder:

```vue
<!-- emails/verify-email.vue -->
<template>
  <Layout :lang="lang">
    <Text>{{ t('verifyEmail.title') }}</Text>
  </Layout>
</template>
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

## Templates: what a template may hold

A template is rendered **once, at build time**, with every prop and every
message replaced by a marker; the generated render function then puts the
values back. So a template holds props, `lang`, and `t()` calls — nothing
that would depend on a value. The examples below use this catalogue and this
template:

```json
{
  "verifyEmail": {
    "subject": "Confirm your e-mail address",
    "title": "One step left",
    "body": "Hello {name}, confirm this address to finish signing up.",
    "action": "Confirm my address",
    "expires": "This link expires in {hours, plural, one {# hour} other {# hours}}."
  }
}
```

```vue
<!-- emails/verify-email.vue -->
<script setup>
defineProps(['link', 'name', 'hours']);
</script>

<template>
  <Layout :lang="lang">
    <Container class="bg-white p-6">
      <Heading class="text-2xl">{{ t('verifyEmail.title') }}</Heading>
      <Text>{{ t('verifyEmail.body', { name }) }}</Text>
      <Button :href="link">{{ t('verifyEmail.action') }}</Button>
      <Text>{{ t('verifyEmail.expires', { hours }) }}</Text>
    </Container>
  </Layout>
</template>
```

### `TEMPLATE_INVALID` — `templates: <file>: is not a kebab-case .vue file name — name it as verify-email.vue`

**When:** the build, on a template named `VerifyEmail.vue`,
`verify_email.vue` or `Verify-Email.vue`.
**Why:** the file name is the e-mail's name: `verify-email.vue` becomes
`mails.verifyEmail`, and its subject is the message `verifyEmail.subject`.
Only files ending in `.vue` are read; anything else in the folder is ignored.
**Fix:** rename the file:

```sh
git mv emails/VerifyEmail.vue emails/verify-email.vue
```

### `TEMPLATE_INVALID` — `templates: <file>: is the e-mail <email>, as <other>.vue is — rename one of them`

**When:** the build, on two template files whose names give the same e-mail
name: `a1b.vue` and `a-1b.vue` are both `a1b`.
**Why:** the e-mail name is the `camelCase` of the file name, and a hyphen
before a digit leaves nothing to capitalise. Two templates for one
`mails.<email>` would leave one of them out.
**Fix:** rename one of them, so that each file gives its own name:

```sh
git mv emails/a-1b.vue emails/a-1-b.vue
```

### `TEMPLATE_INVALID` — `templates: <file>: does not parse as a single-file component (<reason>)`

**When:** the build, on a template Vue cannot parse: an unclosed `{{`, an
unclosed tag, two `<template>` blocks. `<reason>` is Vue's own, as
`Interpolation end sign was not found.` or `Element is missing end tag.`
**Why:** a template is a Vue single-file component, read by Vue's compiler.
**Fix:** close what the reason names:

```vue
<Text>{{ t('verifyEmail.body', { name }) }}</Text>
```

### `TEMPLATE_INVALID` — `templates: <file>: has no <template>`

**When:** the build, on a `.vue` file with a `<script setup>` and nothing
else. An empty file fails to parse instead: `At least one <template> or
<script> is required in a single file component.`
**Why:** the `<template>` block is the e-mail; without it there is nothing to
render.
**Fix:**

```vue
<template>
  <Layout :lang="lang">
    <Text>{{ t('verifyEmail.title') }}</Text>
  </Layout>
</template>
```

### `TEMPLATE_INVALID` — `templates: <file>: has a <script> without setup — declare the props in <script setup>`

**When:** the build, on a template with `<script>` and `export default {
props: … }`, the Options API.
**Why:** the build reads the props from `defineProps` in `<script setup>`,
and nothing else.
**Fix:**

```vue
<script setup>
defineProps(['link', 'name', 'hours']);
</script>
```

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: holds code in <script setup> — a template declares its props with defineProps([...]), unassigned, and nothing else`

**When:** the build, on a `<script setup>` that holds anything but one
`defineProps(['a', 'b'])` or `defineProps<{ … }>()` call:
- a `const`, a function, an `import`, a `computed`, a `console.log`;
- the props assigned, as `const props = defineProps([…])`;
- the object form, `defineProps({ name: String })`, and so a prop with a
  `validator`, a `default` or `required`;
- a list holding anything but quoted names, as `defineProps(names)`.
**Why:** the script runs once, at build time, on markers rather than values:
a value computed there, a default or a validator, would run on a marker and
be frozen into every e-mail. Whatever the e-mail needs is a prop, computed
by the caller — and every prop is required, so a default has nothing to do.
**Fix:** declare the props by name, unassigned, as a list or as a type, and
compute a value or a default where you call the e-mail:

```vue
<script setup>
defineProps(['link', 'name', 'hours']);
</script>
```

```vue
<script setup lang="ts">
defineProps<{ link: string; name: string; hours: number }>();
</script>
```

The types written in `defineProps<{ … }>()` are not read: each prop is typed
in the generated module from the way the template uses it.

### `TEMPLATE_INVALID` — `templates: <file>: does not declare its props in a form the build reads (<reason>)`

**When:** the build, on a `defineProps<…>()` whose type Vue's compiler
cannot resolve: a name declared nowhere in the script, as
`defineProps<Missing>()`. `<reason>` is the compiler's first line, as
`[@vue/compiler-sfc] Unresolvable type reference or unsupported built-in
utility type`.
**Why:** the build takes the prop names from Vue's compiler. A type declared
beside the call, or imported, would need a second statement in
`<script setup>`, which the build refuses; a name alone leaves the compiler
nothing to read.
**Fix:** write the props as a list of names, or as an inline type:

```vue
<script setup>
defineProps(['link', 'name', 'hours']);
</script>
```

```vue
<script setup lang="ts">
defineProps<{ link: string; name: string; hours: number }>();
</script>
```

### `TEMPLATE_INVALID` — `templates: <file>: declares the prop <prop>, a name the render function uses itself`

**When:** the build, on a prop named `t`, `lang`, `locale` or `timeZone`.
**Why:** the render function takes `locale` and `timeZone` itself, and the
template already has `t()` and `lang`; a prop of the same name would be
ambiguous.
**Fix:** use `lang` for the language the e-mail is rendered in, and rename a
prop of your own:

```vue
<script setup>
defineProps(['userLocale']);
</script>

<template>
  <Layout :lang="lang">
    <Text>{{ userLocale }}</Text>
  </Layout>
</template>
```

### `TEMPLATE_INVALID` — `templates: <file>: declares the prop <prop>, which is not camelCase — name it as firstName`

**When:** the build, on a prop named `first_name`, `FirstName` or
`first-name`.
**Why:** a prop is an argument of the generated render function, and names
there are `camelCase`. It starts with a lower-case letter and holds only
letters and digits.
**Fix:**

```vue
<script setup>
defineProps(['firstName']);
</script>
```

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: <<tag>> uses v-<directive> — a template renders once, at build time, so it has no condition, no loop and no event`

**When:** the build, on `v-if`, `v-else`, `v-show`, `v-for`, `v-html`,
`v-text`, `v-on` (`@click`) or `v-model` anywhere in the template.
**Why:** the template is rendered once, with markers instead of values, so a
condition would be decided on a marker and a loop would run over one. Only a
bound attribute (`:href`) and a slot are reproduced.
**Fix:** a text that varies with a value is a message: write the branches in
the catalogue, with `select` or `plural`, and pass the value as a prop:

```json
{
  "verifyEmail": {
    "plan": "{plan, select, pro {Your Pro account is ready.} other {Your account is ready.}}"
  }
}
```

```vue
<Text>{{ t('verifyEmail.plan', { plan }) }}</Text>
```

Two layouts that differ by more than a text are two templates. A list of
variable length has no equivalent. Markup from `v-html` belongs in the
template itself: see [`<b>` shows in the e-mail as text](#b-shows-in-the-e-mail-as-text).

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: <<tag>> binds an object with v-bind — bind each attribute by name`

**When:** the build, on `v-bind="attrs"` with no attribute name.
**Why:** the build must know which attribute each value lands in, to escape
it for that attribute and to check a URL.
**Fix:**

```vue
<Button :href="link">{{ t('verifyEmail.action') }}</Button>
```

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: <where> holds an expression — write a prop, or t('key', { prop }), and nothing else`

`<where>` is `{{ }}`, or a tag and a bound attribute, as `<img> :src`.

**When:** the build, on anything in `{{ }}` or a bound attribute other than
a prop, `lang`, or a `t()` call on a quoted key whose arguments are props:
`name.toUpperCase()`, `` `${first} ${last}` ``, `t('verifyEmail.' + kind)`,
`t('verifyEmail.body', { name: 'Ada' })`, a third argument to `t()`, or a
constant bound with a colon, as `:src="'https://…'"`.
**Why:** the build follows each value from the template to the render
function; an expression would be computed once, on a marker.
**Fix:** a prop, or a message with props as its arguments — renamed if the
names differ — and a constant attribute without the colon:

```vue
<Text>{{ t('verifyEmail.body', { name: fullName }) }}</Text>
<img src="https://cdn.example.com/logo.png" :alt="t('verifyEmail.title')">
```

Formatting belongs in the message (`{total, number, ::currency/EUR}`), and
anything else in the caller, which passes the result as a prop.

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: <where> uses <name>, which is not a prop — declare it with defineProps`

**When:** the build, on a name in `{{ }}` or a bound attribute that
`defineProps` does not list: a typo (`{{ nme }}`), or a prop forgotten in the
list (`<a> :href uses url`).
**Why:** a template sees its props, `lang` and `t`, and nothing else.
**Fix:** declare it, or correct the name:

```vue
<script setup>
defineProps(['link', 'name', 'hours', 'url']);
</script>
```

---

## Templates: where a value lands

After the render, the build looks at where each prop, message and `lang`
landed in the HTML, and escapes it for that place. A place where escaping is
not enough fails the build. In these messages, `<value>` is `the prop
<prop>`, `a message` or `lang`.

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: <value> lands in a <<element>> element`

`<element>` is one of `style`, `script`, `textarea`, `title`, `xmp`,
`noembed`, `noframes`, `iframe` and `plaintext`.

**When:** the build, on a value written inside one of those elements:
`<Head><title>{{ t('verifyEmail.subject') }}</title></Head>`,
`<textarea>{{ name }}</textarea>`, `<svg><script>{{ name }}</script></svg>`.
**Why:** a browser reads the content of those elements as raw text or as
code, not as markup: HTML escaping means nothing there, and a value could
close the element and write markup of its own. Most mail clients strip
scripts and frames anyway.
**Fix:** write the value as text, in an ordinary element. A `<title>` is
fixed text, or left out — the subject is the e-mail's title in every client:

```vue
<Text>{{ t('verifyEmail.body', { name }) }}</Text>
```

A `<style>` or `<script>` written straight in the `<template>` is dropped by
Vue; a prop used only there fails with
[`declares the prop <prop> and never uses it`](#template_unsupported--templates-file-declares-the-prop-prop-and-never-uses-it--remove-it-or-write-it-in-the-template).

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: <value> lands in a tag outside a quoted attribute value`

**When:** the build, rarely: a value that ends up inside a tag's own syntax —
as a tag name, as an attribute name, in an attribute value without quotes,
or in a `<!DOCTYPE>` or a conditional comment's opening. A template cannot
write this with Vue alone, which always quotes a bound attribute; it comes
from a component that writes its HTML as a string with the value in it.
**Why:** outside a quoted value, a value is markup: a space or a `>` in it
would add attributes or close the tag.
**Fix:** take the value out of that component, and bind it as an ordinary
quoted attribute or write it as text:

```vue
<img :src="logo" :alt="t('verifyEmail.title')">
```

With only Maizzle's own components around it, it is
[a bug in `@nxgt/mail-build`](#a-bug-in-nxgtmail-build-itself).

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: <value> lands in the <attribute> attribute — only text attributes (alt, title, aria-*…) and URLs (href, src) take a value`

**When:** the build, on a value bound to an attribute that is neither text
nor a single URL: `:style="color"`, `:onclick="name"`, `:srcset="image"`,
`:action="link"`, a `srcdoc`, the `content` of a `<meta>`.
**Why:** a value is escaped as text, and escaping makes it safe only where
the attribute holds text. In `style` it would be CSS, in `on*` JavaScript,
in `srcset` a list of URLs no check reads. The attributes that take a value
are `alt`, `title`, `lang`, `xml:lang`, `dir`, `id`, `name`, `class`,
`role`, `width`, `height`, `label`, `summary`, `abbr`, every `aria-*` and
`data-*`, and the URLs `href`, `xlink:href`, `src`, `background` and
`poster`.
**Fix:** style with fixed Tailwind classes, and put a value in a text
attribute or in a URL. A look that depends on a value is a second template:

```vue
<Text class="text-indigo-600">{{ t('verifyEmail.title') }}</Text>
<img :src="logo" :alt="t('verifyEmail.title')">
```

A class bound to a prop is not a way around it: Tailwind compiles the classes
it finds in the template at build time, and Maizzle drops a class it has no
CSS for — see
[`the prop <prop> is not in the output`](#template_unsupported--templates-file-the-prop-prop-is-not-in-the-output--a-component-dropped-it-or-used-it-at-build-time-as-a-qr-code-does).

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: <value> starts an href — a URL is a prop, checked when the e-mail is rendered`

With `src`, `background` or `poster`: `<value> starts a src — …`.

**When:** the build, on a message or `lang` bound to a URL attribute:
`:href="t('verifyEmail.link', { token })"`, `:src="lang"`.
**Why:** a URL is checked when the e-mail is rendered, to refuse
`javascript:` and its kind, and only a prop is checked. A message is text a
translator writes; it never decides where a link goes.
**Fix:** build the URL in the caller and pass it as a prop:

```vue
<Button :href="link">{{ t('verifyEmail.action') }}</Button>
```

A value after a fixed start that is `http://`, `https://` or `mailto:` is
accepted, as part of that URL; after any other start, see the next entry.

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: <value> lands in an href whose fixed start is not http:, https: or mailto:`

With `src`, `background` or `poster`: `<value> lands in a src whose fixed
start is not http:, https: or mailto:`.

**When:** the build, rarely: a value lands in the middle of a URL attribute
whose beginning the template or a component wrote, and that beginning is not
`http://`, `https://` or `mailto:` — `javascript:`, a relative path such as
`/verify?token=`, a `cid:`. Vue binds a whole attribute, so this comes from a
component that builds the URL as a string around the value.
**Why:** the build checks a URL when the e-mail is rendered only when the
prop is the whole URL. After a fixed start, the start decides where the link
goes, so only a safe, absolute one is accepted.
**Fix:** build the whole URL in the caller, and bind it as one prop:

```vue
<Button :href="link">{{ t('verifyEmail.action') }}</Button>
```

---

## Templates: against the catalogues

Each `t()` in a template, and each e-mail's subject, is checked against the
**fallback locale**: its keys and the arguments its messages declare. The
other locales are checked against the fallback, as in
[Catalogues](#catalogues).

### `TEMPLATE_KEY_UNKNOWN` — `templates: <file>: t('<key>') is not a key of <fallback>, the fallback locale`

**When:** the build, on a `t()` whose key the fallback locale does not hold:
a typo, a key renamed in the catalogue, or a `messages/` folder the config
does not point to.
**Why:** a message missing from the fallback locale would render as nothing.
**Fix:** add the key to the fallback locale, then to the others, or correct
the call:

```json
{
  "verifyEmail": {
    "title": "One step left"
  }
}
```

### `TEMPLATE_ARGUMENT_MISSING` — `templates: <file>: t('<key>') leaves out {<argument>}, which <fallback> declares — pass it a prop`

**When:** the build, on `t('verifyEmail.body')` when the message is
`Hello {name}, …`.
**Why:** the message would render with a hole. Every argument the fallback
locale's message declares is passed.
**Fix:**

```vue
<Text>{{ t('verifyEmail.body', { name }) }}</Text>
```

### `TEMPLATE_ARGUMENT_MISSING` — `templates: <file>: t('<key>') passes {<argument>} a value that is not a prop`

**When:** the build, on a `t()` inside a slot whose slot props shadow a prop
of the template: `<Button v-slot="{ name }">{{ t('verifyEmail.body', { name })
}}</Button>`. Vue also prints `[Vue warn]: Unhandled error during execution
of render function`.
**Why:** inside the slot, `name` is the slot's, not the template's prop, so
the build cannot tell which prop the message gets.
**Fix:** drop the `v-slot`, or rename what it destructures:

```vue
<Button :href="link">{{ t('verifyEmail.body', { name }) }}</Button>
```

### `TEMPLATE_ARGUMENT_UNKNOWN` — `templates: <file>: t('<key>') passes {<argument>}, which <fallback> does not declare`

**When:** the build, on `t('verifyEmail.title', { name })` when the message
is `One step left` — typically an argument left behind after the message
dropped it, or a misspelled name.
**Why:** an argument no message uses is a mistake, and a misspelled one would
leave the real one out.
**Fix:** drop it, or add `{name}` to the fallback locale's message:

```vue
<Heading>{{ t('verifyEmail.title') }}</Heading>
```

### `SUBJECT_MISSING` — `templates: <file>: the e-mail <email> has no subject — add <email>.subject to <fallback>, the fallback locale`

**When:** the build, on a template whose e-mail has no `subject` message: an
`order-placed.vue` with no `orderPlaced.subject`.
**Why:** every e-mail has a subject, and it is always the message
`<email>.subject`, where `<email>` is the `camelCase` of the file name. The
template does not call it: the render function does.
**Fix:**

```json
{
  "orderPlaced": {
    "subject": "Order {reference} confirmed"
  }
}
```

### `TEMPLATE_ARGUMENT_MISSING` — `templates: <file>: <email>.subject uses {<argument>}, which is not a prop of the template — declare it with defineProps`

**When:** the build, on a subject with an argument, `Order {reference}
confirmed`, for a template that declares no `reference` prop.
**Why:** the subject's arguments are the template's props **of the same
name**: there is no `t()` call in which to rename them.
**Fix:** declare the prop. A prop the subject uses counts as used, even if
the body never shows it:

```vue
<script setup>
defineProps(['reference']);
</script>
```

### `ARGUMENT_TYPE_MISMATCH` — `templates: <file>: the prop <prop> is <kind> <where>, and <kind> <where>`

`<kind>` is `a string`, `a number`, `a date`, `a link`, `a resource URL` or
`written as is`; `<where>` is `in t('<key>')` or `in the template`.

**When:** the build, on a prop used two ways that cannot both hold: a date in
`{at, date, long}` also written as `{{ placedAt }}`, a number in `{hours,
plural, …}` also bound to `:href`, or two messages that disagree.
**Why:** a prop has one type in the render function. A string and a number
may be written as is; a `Date` may not, as its text depends on the locale and
the time zone.
**Fix:** write a date through a message, as many times as it takes:

```json
{
  "orderPlaced": {
    "placedAt": "Placed on {at, date, long} at {at, time, short}.",
    "placedOn": "Placed on {at, date, short}."
  }
}
```

```vue
<Text>{{ t('orderPlaced.placedAt', { at: placedAt }) }}</Text>
<Text>{{ t('orderPlaced.placedOn', { at: placedAt }) }}</Text>
```

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: declares the prop <prop> and never uses it — remove it, or write it in the template`

**When:** the build, on a prop in `defineProps` that no `{{ }}`, bound
attribute, `t()` argument or subject uses. Two common causes: `{{ }}` in a
plain attribute, `href="mailto:{{ address }}"`, which Vue keeps as the text
`{{ address }}`; and a `<style>` or `<script>` written in the `<template>`,
which Vue drops.
**Why:** it would be an argument every caller must pass for nothing.
**Fix:** remove it, or bind it — a whole attribute is a prop:

```vue
<a :href="mailtoLink">{{ t('verifyEmail.action') }}</a>
```

---

## Templates: rendering

### `TEMPLATE_INVALID` — `templates: <file>: Maizzle could not render it (<reason>)`

**When:** the build, on a template that parses and passes the checks above,
but throws while Maizzle and Vue render it. `<reason>` is their own message,
and the original error is `error.cause`: a `<style lang="scss">` with no
Sass installed (`Preprocessor dependency "sass-embedded" not found. Did you
install it? …`), a `v-slot` that shadows `t` (`t is not a function`), a
component used with the wrong slots.
**Why:** the template is rendered once at build time; an error there stops
the build rather than writing a module without that e-mail.
**Fix:** follow the reason — for the Sass one, write the `<style>` in plain
CSS, or style with Tailwind classes — and look at the rendering with
`nxgt-mail dev`, which renders every e-mail in every locale to
`.nxgt-mail/`:

```vue
<Text class="text-indigo-600">{{ t('verifyEmail.title') }}</Text>
```

### `TEMPLATE_INVALID` — `templates: <file>: uses <<Name>>, which is not a component — check its name`

**When:** the build, on a tag that looks like a component and that no
component answers — typically a misspelled Maizzle component, `<Buton>` for
`<Button>`.
**Why:** Vue renders an unknown component as nothing, with only a warning:
the element and everything inside it — a button, its text, its link — would
be missing from the e-mail. The build stops instead.
**Fix:** use the component's exact name:

```vue
<Button :href="link">{{ t('verifyEmail.action') }}</Button>
```

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: t('<key>') is not in the output — a component dropped it, or used it at build time`

**When:** the build, on a `t()` whose text does not reach the HTML: bound to
`:class`, which Maizzle drops when no CSS matches it; passed to a component
prop the component does not render; or inside `<Plaintext>`, which writes to
the plain text only.
**Why:** the render function puts each message back where it landed in the
HTML. A message the HTML does not hold would be translated and then thrown
away, or worse, would have been used at build time in its marker form.
**Fix:** write the message as text, or in a text attribute:

```vue
<Text>{{ t('verifyEmail.title') }}</Text>
```

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: the prop <prop> is not in the output — a component dropped it, or used it at build time (as a QR code does)`

**When:** the build, on a prop the template writes that does not reach the
HTML as many times as it is written: given to `<QrCode :value="link">`, which
encodes it at build time; bound to `:class`, which Maizzle drops when no CSS
matches it; written inside an `<svg><style>`; passed to a component that
does not render it.
**Why:** the render function puts each prop back where it landed. A QR code
built at build time would encode the marker, not the link, and the same QR
code would go to every recipient.
**Fix:** write the prop as text, in a text attribute or in a URL. A QR code
per recipient is an image your server renders, passed as a URL prop:

```vue
<img :src="qrCodeUrl" :alt="t('verifyEmail.action')" width="160">
```

### `TEMPLATE_INVALID` — `templates: <file>: Tailwind did not compile its CSS — @import or @apply left in the output`

**When:** the build, when the HTML Maizzle answers still holds
`@import "@maizzle/tailwindcss"` or an `@apply`.
**Why:** Maizzle does not report a Tailwind failure; it leaves the CSS as
written, and the e-mail would ship unstyled. The build resolves Maizzle's
Tailwind itself, so this points to an install where
`@maizzle/framework` or `@maizzle/tailwindcss` is missing or broken.
**Fix:** reinstall, then build again:

```sh
rm -rf node_modules && bun install && nxgt-mail build
```

If it persists, it is [a bug in `@nxgt/mail-build`](#a-bug-in-nxgtmail-build-itself).

### `TEMPLATE_UNSUPPORTED` — `templates: <file>: a value was changed while rendering — a component or a transformer rewrote it`

**When:** the build, when a marker put in place of a prop or a message came
out of the render cut or altered.
**Why:** a value the build cannot find again would be dropped from the
e-mail without a word, so the build stops instead.
**Fix:** find the component around the value that changes it — truncates it,
changes its case, encodes it — and move the value out of it:

```vue
<Text>{{ t('verifyEmail.body', { name }) }}</Text>
```

With only Maizzle's own components around it, it is
[a bug in `@nxgt/mail-build`](#a-bug-in-nxgtmail-build-itself).

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
typically a value read from a query string or an environment variable. The
same on a number prop of `mails`: `mails.verifyEmail({ …, hours: '24' })`.
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
from JSON or a database driver that answers strings. The same on a date
prop of `mails`: `mails.orderPlaced({ …, placedAt: '2026-09-25' })`.
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

## Calling `mails`

The generated module exports `mails`, one render function per template:
`mails.<email>({ locale, timeZone?, ...props })` answers
`{ subject, html, text }`. Each prop is typed from its uses — a `string`, a
`number` or a `Date` — and every prop is required. The examples use the
module built from the `verify-email.vue` above and an `order-placed.vue`:

```ts
import { mails } from './generated/mail';

const { subject, html, text } = mails.verifyEmail({
  locale: 'fr',
  name: 'Ada',
  link: 'https://example.com/verify?token=abc',
  hours: 24,
});
```

A string passed to a number prop, or an ISO string to a date prop, gives
the same errors as with `t()`:
[`Type 'string' is not assignable to type 'number'.`](#ts2322-type-string-is-not-assignable-to-type-number)
and [`Type 'string' is not assignable to type 'Date'.`](#ts2322-type-string-is-not-assignable-to-type-date).

### `TS2322: Type '"<locale>"' is not assignable to type '"en" | "fr"'.`

`"en" | "fr"` is the list of your build's locales.

**When:** `tsc`, on `mails.verifyEmail({ locale: 'de', … })`. With a
`string` from a request or a user profile, the same mistake reads
`Type 'string' is not assignable to type '"en" | "fr"'.`
**Why:** the module has messages for each locale in `locales`, and none for
any other.
**Fix:** choose one of them first, with `pickLocale` from `@nxgt/mail`:

```ts
import { pickLocale } from '@nxgt/mail';
import { fallbackLocale, locales, mails } from './generated/mail';

declare const acceptLanguage: string | null;

const locale = pickLocale(acceptLanguage, locales, fallbackLocale);
mails.verifyEmail({ locale, name: 'Ada', link: 'https://example.com/verify', hours: 24 });
```

### `TS2353: Object literal may only specify known properties, and '<prop>' does not exist in type '{ readonly locale: "en" | "fr"; readonly timeZone?: string; … }'.`

**When:** `tsc`, on a misspelled or translated prop:
`mails.verifyEmail({ locale, nom: 'Ada', … })`.
**Why:** the props are the ones the template declares, under their names in
`defineProps`.
**Fix:**

```ts
import { mails } from './generated/mail';

mails.verifyEmail({ locale: 'en', name: 'Ada', link: 'https://example.com/verify', hours: 24 });
```

### `TS2345: Argument of type '{ locale: …; … }' is not assignable to parameter of type '{ readonly locale: "en" | "fr"; readonly timeZone?: string; … }'.`

Followed by `Property '<prop>' is missing in type '{ … }' but required in
type '{ … }'.`

**When:** `tsc`, on a call that leaves a prop out:
`mails.verifyEmail({ locale, name: 'Ada', link })` without `hours`, or a
call written before the template gained a prop.
**Why:** every prop is required: the template writes it, or a message needs
it. There is no default, as a missing value would render as a hole.
**Fix:** pass it:

```ts
import { mails } from './generated/mail';

mails.verifyEmail({ locale: 'en', name: 'Ada', link: 'https://example.com/verify', hours: 24 });
```

### `TS2322: Type 'URL' is not assignable to type 'string'.`

**When:** `tsc`, on a `URL` object passed to a link or image prop:
`mails.verifyEmail({ …, link: new URL(…) })`.
**Why:** a URL prop is a string, checked when the e-mail is rendered.
**Fix:** pass its `href`:

```ts
import { mails } from './generated/mail';

const link = new URL('/verify?token=abc', 'https://example.com');
mails.verifyEmail({ locale: 'en', name: 'Ada', link: link.href, hours: 24 });
```

### `TS2339: Property '<email>' does not exist on type '{ readonly <email>: (args: …) => RenderedMail; … }'.`

**When:** `tsc`, on `mails.welcome(…)` when there is no
`emails/welcome.vue`, or when the module was not built again after the
template was added or renamed.
**Why:** `mails` has one function per template, named after its file:
`welcome.vue` is `mails.welcome`, `verify-email.vue` is `mails.verifyEmail`.
**Fix:** add the template, then build the module again:

```sh
nxgt-mail build
```

### `TypeError: mails.<email>: <prop> must be an http:, https: or mailto: URL`

**When:** at run time, a call to `mails.<email>()` whose link prop — one
bound to `href` — does not start with `http://`, `https://` or `mailto:`:
`javascript:…`, a relative path such as `/verify`, a URL with a leading
space.
**Why:** a link in an e-mail goes where its prop says, so the render
function refuses any other scheme rather than escaping it. The check is at
the first character: a leading space is refused, not trimmed. An e-mail has
no base URL, so a relative link would lead nowhere.
**Fix:** pass an absolute URL, built where the value enters:

```ts
import { mails } from './generated/mail';

declare const token: string;

const link = new URL(`/verify?token=${encodeURIComponent(token)}`, 'https://example.com').href;
mails.verifyEmail({ locale: 'en', name: 'Ada', link, hours: 24 });
```

### `TypeError: mails.<email>: <prop> must be an http: or https: URL`

**When:** at run time, a call whose image or resource prop — one bound to
`src`, `background` and the like — does not start with `http://` or
`https://`: a `mailto:`, a relative path, a `data:` or a `cid:` URI.
**Why:** a resource is fetched by the mail client, and only from the web. A
prop used both in an `href` and in a `src` is held to this stricter check.
**Fix:** host the image, and pass its absolute URL:

```ts
import { mails } from './generated/mail';

mails.orderPlaced({
  locale: 'en',
  name: 'Ada',
  reference: 'A-1042',
  placedAt: new Date(),
  total: 42.5,
  logo: 'https://cdn.example.com/logo.png',
  orderLink: 'mailto:orders@example.com',
});
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

### A line break in a subject argument shows as a space

**When:** at run time, a prop used in `<email>.subject` holds a line break
(`\r`, `\n`, U+0085, U+2028 or U+2029): the subject shows a space there,
while the plain text keeps the break.
**Why:** **by design.** A line break in a subject header would let a value
add headers of its own (`Bcc:`), so the render function replaces each run of
them with one space, in the subject only.
**Fix:** nothing to fix. To keep the text on one line on purpose, clean it
where it enters:

```ts
declare const input: string;

const reference = input.trim().replace(/\s+/g, ' ');
```

### A bug in `@nxgt/mail-build` itself

A `MESSAGE_UNSUPPORTED` that says `uses a tag` or `uses a # outside a plural`,
a `TEMPLATE_UNSUPPORTED` that says `t() takes a string key`, a generated
module that does not compile, or a catalogue or a template this page says is
valid and the build refuses, is a bug in this package. Open an issue on
[`softistx/nxgt-mail`](https://github.com/softistx/nxgt-mail/issues) with
the error, the package version and the smallest catalogue and template that
reproduce it, with their text replaced by placeholders when it is not yours
to share.
