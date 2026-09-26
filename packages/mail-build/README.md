# @nxgt/mail-build

The build side of `@nxgt/mail`. You write one Maizzle template per e-mail — a
Vue single-file component styled with Tailwind CSS — and one ICU message
catalogue per locale; `nxgt-mail build` compiles both into a TypeScript module
of **render functions** answering `{ subject, html, text }`, typed from the
ICU: a missing, misspelled or mistyped argument, an unknown locale or an
unknown e-mail is a compile error. It runs **at build time only**, as a
devDependency; the module it writes imports nothing and uses only `Intl`.

```ts
import { mails } from './generated/mail';

const link = 'https://example.com/verify?token=abc';

const { subject, html, text } = mails.verifyEmail({ locale: 'fr', name: 'Ada', link, hours: 24 });
// subject: 'Confirmez votre adresse e-mail'

mails.verifyEmail({ locale: 'fr', name: 'Ada', link, hours: '24' });
//                                                   ~~~~~ Type 'string' is not assignable to type 'number'
```

> **Not published yet.** The package is `private`. Templates, catalogues,
> presets, the `nxgt-mail` CLI and `defineMailConfig` are here, and ship with
> the first release. See the [roadmap](docs/roadmap.md).

## Install

```sh
bun add -d @nxgt/mail-build
```

A devDependency: nothing of it reaches your server. `typescript` (6) is a
required peer. Maizzle 6 and what it needs — Vue, Tailwind CSS, and Shiki,
a peer Maizzle requires — are dependencies of this package, installed with it. Your
tsconfig resolves as a bundler does (`"moduleResolution": "bundler"`): the
declarations import without extensions, so `nodenext` is not supported.

## Setup

```ts
// mail.config.ts — at the root of the project
import { defineMailConfig } from '@nxgt/mail-build';

export default defineMailConfig({
	locales: ['en', 'fr'],
	fallbackLocale: 'en', // the reference every other catalogue is checked against
	// presets: [nxgtPreset()] — a layout, components and shared messages, see Presets below
	// emails: 'emails', messages: 'messages', components: 'components', out: 'src/generated/mail.ts' — the defaults
});
```

`nxgt-mail` looks for `mail.config.ts` (or `.mts`, `.js`, `.mjs`) in the
current directory, and reads every path in it relative to the config's folder.

```jsonc
// package.json — the module must exist before your code compiles
{ "scripts": { "mail": "nxgt-mail build", "typecheck": "nxgt-mail build && tsc --noEmit" } }
```

The module is written to `src/generated/mail.ts`, and only when it changed.

```jsonc
// biome.json — the module is generated: do not lint or format it
{ "files": { "includes": ["**", "!**/generated"] } }
```

Keep `generated/` out of your linter and your coverage, and `.nxgt-mail/` (the
previews) out of git. Commit the module or ignore it, as you prefer — the same
templates and catalogues always produce the same bytes. Your compiler does
check it, and it compiles under the strictest options — `strict`,
`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noUnusedLocals`,
`noUnusedParameters`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`,
down to an ES2020 `lib`.

## Usage

### Writing a template — `emails/<name>.vue`

One file per e-mail, named in `kebab-case`: `emails/verify-email.vue` becomes
`mails.verifyEmail`. It declares its props, and its text is keys into the
catalogues — never words.

```vue
<script setup>
defineProps(['name', 'link', 'hours']);
</script>

<template>
  <Layout :lang="lang">
    <Container class="bg-white p-6">
      <Heading class="text-2xl text-indigo-600">{{ t('verifyEmail.title') }}</Heading>
      <Text>{{ t('verifyEmail.body', { name }) }}</Text>
      <Button :href="link" class="bg-indigo-600 text-white">{{ t('verifyEmail.action') }}</Button>
      <Text>{{ t('verifyEmail.expires', { hours }) }}</Text>
    </Container>
  </Layout>
</template>
```

A template renders **once, at build time**: each `{{ }}` or bound attribute
holds a prop, `lang`, or `t('key', { prop })` — no `v-if`, no `v-for`, no
expression — and `<script setup>` holds `defineProps([...])` or `defineProps<{ … }>()`
and nothing else. Everything a template may and may not hold is in
[Templates](docs/guide/templates.md).

### Writing catalogues — `messages/<locale>.json`

One catalogue per locale. Keys nest, every segment `camelCase`; a leaf is one
ICU message. The subject of an e-mail is the message `<email>.subject`, and it
is required.

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

```json
{
	"verifyEmail": {
		"subject": "Confirmez votre adresse e-mail",
		"title": "Plus qu'une étape",
		"body": "Bonjour {name}, confirmez cette adresse pour terminer votre inscription.",
		"action": "Confirmer mon adresse",
		"expires": "Ce lien expire dans {hours, plural, one {# heure} other {# heures}}."
	}
}
```

Every form a message can take — plural with `=0` and `offset`,
`selectordinal`, `select`, numbers, currencies, dates — is in
[Catalogues](docs/guide/catalogues.md).

### Building — `nxgt-mail build`

```sh
bunx nxgt-mail build
# nxgt-mail: wrote src/generated/mail.ts — 1 e-mail(s): verifyEmail (1204 ms)
```

A build that cannot be right prints why — the template, the locale, the key —
exits with `1`, and writes nothing:

```text
templates: verify-email.vue: t('verifyEmail.acton') is not a key of en, the fallback locale
```

`nxgt-mail dev` renders every e-mail in every locale, with a sample value for
each prop, to `.nxgt-mail/` — open its `index.html`. The same two commands are
functions, `build(config)` and `dev(config)`; `compileProject(config)` and
`compileMail({ locales, fallbackLocale, sources, templates })` compile without
writing a file, for a test or a CI check. See
[Building](docs/guide/building.md).

### Presets — a layout, components, a theme and shared messages

A preset is data — Tailwind tokens, components, messages — applied before
your own files. [`@nxgt/mail-preset`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail-preset)
is the default one; `definePreset` writes another, which overrides it one
token or one message at a time:

```ts
// mail.config.ts
import { defineMailConfig, definePreset } from '@nxgt/mail-build';
import { nxgtPreset } from '@nxgt/mail-preset';

const acme = definePreset({
	name: 'acme',
	theme: { color: { primary: '#e11d48' } },
	messages: { en: { common: { footer: { why: 'Acme sent you this e-mail.' } } } },
});

export default defineMailConfig({
	locales: ['en', 'fr'],
	fallbackLocale: 'en',
	presets: [nxgtPreset(), acme], // in order; your components/ and messages/ come last
});
```

A template then uses the presets' components — `<TransactionalLayout>`,
`<MailButton>` — and their tokens as classes (`bg-primary`). A `components/`
folder beside the config holds your own, one PascalCase `.vue` each; a file
named like a preset's component replaces it. The folder is optional, unless
the config names it with `components`.

A layout imports the tokens from `theme.css`, which the build writes beside
each template, **in the same `<style>`** as Maizzle's Tailwind:

```vue
<style>
  @import "@maizzle/tailwindcss";
  @import "./theme.css";
</style>
```

The `Preset` shape, `resolvePresets`, `themeCss` and every refusal are in
[Presets](docs/guide/presets.md).

### Sending — `mails`

```ts
import { type Mailer, pickLocale, type SentMail } from '@nxgt/mail';
import { fallbackLocale, locales, mails } from './generated/mail';

export function sendVerification(
	mailer: Mailer,
	user: { readonly email: string; readonly name: string; readonly locale: string | null },
	link: string,
): Promise<SentMail> {
	const locale = pickLocale(user.locale, locales, fallbackLocale); // the recipient's, typed Locale
	return mailer.send({
		to: user.email,
		...mails.verifyEmail({ locale, name: user.name, link, hours: 24 }),
	});
}
```

Every value is HTML-escaped in `html` and left as is in `text`; a line break
in the subject (CR, LF, U+0085, U+2028, U+2029) becomes a space. A prop that starts an `href` must be an
`http:`, `https:` or `mailto:` URL, and one that starts a `src` an `http:` or
`https:` URL — anything else throws
`TypeError: mails.verifyEmail: link must be an http:, https: or mailto: URL`.
The module also exports `t`, `MailArgs`, `MailName`, `RenderedMail`, `Locale`
and the rest — see [The generated module](docs/guide/generated-module.md).

### How props are typed

From the way the template and the **fallback locale's** messages use them:

| The prop is | Its type |
| --- | --- |
| passed to `{name}` or `{method, select, …}` | `string` |
| passed to `{count, plural, …}`, `{position, selectordinal, …}`, `{total, number}` | `number` |
| passed to `{at, date, long}`, `{at, time, short}` | `Date` |
| written as is — `{{ reference }}`, `:alt="reference"` | `string`, or `number` when a message types it so |
| bound to an `href` or a `src` | `string`, checked as a URL when the e-mail is rendered |

`locale` is always required, and `timeZone` is optional — the zone dates are
written in, `UTC` by default. Every prop is **required**.

### What fails the build — `MailBuildError`

Everything the build cannot get right throws a `MailBuildError` naming the
template, the locale and the key — never the text of a message. Nothing falls
back to the raw message.

```ts
import { build, MailBuildError } from '@nxgt/mail-build';

try {
	await build({ locales: ['en', 'fr'], fallbackLocale: 'en' });
} catch (error) {
	if (!(error instanceof MailBuildError)) throw error;
	console.error(error.code, error.template, error.key);
	// TEMPLATE_KEY_UNKNOWN verify-email.vue verifyEmail.acton
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
| `ARGUMENT_TYPE_MISMATCH` | An argument is a number in one place and a string or a date in another — in the catalogues, or through a prop a template uses twice |
| `TEMPLATE_INVALID` | A template the build cannot read: a file name that is not `kebab-case.vue`, two files for one e-mail, no `<template>`, a `<script>` without `setup`, props it cannot read (the type form without `lang="ts"`), a reserved or non-`camelCase` prop, a component that does not exist (`<Buton>`), or one Maizzle could not render |
| `TEMPLATE_UNSUPPORTED` | A template holds what one render at build time cannot reproduce safely: code in `<script setup>` (anything but `defineProps([...])` or `defineProps<{ … }>()`), `v-if`, `v-for`, `v-html`, `v-on`, an expression, a name that is not a prop, a value in an attribute that is neither text (`alt`, `title`, `aria-*`…) nor a URL (`href`, `src`), a value in a `<style>`, `<script>`, `<title>`, `<textarea>` or another raw-text element, a message starting a link, a prop it never uses, a value a component drops |
| `TEMPLATE_KEY_UNKNOWN` | A template calls `t()` with a key the fallback locale does not hold |
| `TEMPLATE_ARGUMENT_MISSING` | A `t()` call leaves out an argument its message declares, or a subject uses an argument that is not a prop |
| `TEMPLATE_ARGUMENT_UNKNOWN` | A `t()` call passes an argument its message does not declare |
| `SUBJECT_MISSING` | An e-mail has no `<email>.subject` message in the fallback locale |

A mistake in how the build is **wired** — no config, a config that is not an
object, a templates folder that is missing or holds no `.vue`, a messages
folder with no catalogue, a `components` folder the config names but that is
missing, no locale, a `fallbackLocale` that is not in `locales`, `en_US` for
`en-US`, a preset that is not one — is a bare `TypeError`. Every message, with its fix, is in
[Troubleshooting](docs/troubleshooting.md).

### Only the messages — `compileMessages` and `t`

Without templates, `readCatalogues` and `compileMessages` compile the
catalogues alone into a module exporting `t(locale, key, args)`, typed the same
way. `sources` is a list, earliest first: a preset's catalogues, then yours.

```ts
// scripts/build-messages.ts — run from the project root: bun run scripts/build-messages.ts
import { mkdir, writeFile } from 'node:fs/promises';
import { compileMessages, readCatalogues } from '@nxgt/mail-build';

const locales = ['en', 'fr'];
const catalogues = await readCatalogues('messages', locales); // messages/en.json, messages/fr.json

const { module } = compileMessages({
	locales,
	fallbackLocale: 'en',
	sources: [{ name: 'messages/', catalogues }],
});

await mkdir('src/generated', { recursive: true });
await writeFile('src/generated/messages.ts', module);
```

```ts
import { t } from './generated/messages';

t('fr', 'verifyEmail.expires', { hours: 0 }); // 'Ce lien expire dans 0 heure.'
t('en', 'verifyEmail.expires', { hours: 0 }); // 'This link expires in 0 hours.'
```

How sources merge and how each argument is typed is in
[Catalogues](docs/guide/catalogues.md). The module `nxgt-mail build` writes
exports the same `t`, beside `mails`.

## Traps

**Dates are written in UTC unless you pass a time zone.** Pass the
recipient's: `mails.orderPlaced({ locale, timeZone: user.timeZone, … })`.

**A template has no condition.** It renders once, at build time: `v-if` and
`v-for` fail the build. Send another e-mail, or let the message decide with
`select` or `plural`.

**A component comes from Maizzle, a preset or your `components/` folder.**
Nothing else is read, and `<Buton>` fails the build. None of them may take a
name Maizzle ships (`Button.vue`, `Text.vue`…): prefix yours, as `MailButton`.

**Tokens imported in another `<style>` do nothing.** Write
`@import "./theme.css";` in the block that imports `@maizzle/tailwindcss`, or
`bg-primary` compiles to nothing, silently.

**A value goes in text, a text attribute (`alt`, `title`, `aria-*`…) or a URL
(`href`, `src`).** `:style`, `:onclick`, `:srcset` or a bound `:class` fail
the build.

**A link is a whole, absolute URL.** Bind it as `:href="link"` and build it in
your code: a relative path or `javascript:` throws when the e-mail is rendered.

**A tag is text.** `<b>` in a message stays the characters `<b>`, escaped in
`html`. Styling belongs in the template.

**`{n}` in one locale and `{n, plural, …}` in another fails the build**
(`ARGUMENT_TYPE_MISMATCH`): a plain `{n}` is a string. Use the same kind in
every locale — `{n, number}` where a translation needs only the number.

**A plain `{n}`, or a number prop written as `{{ n }}`, is not formatted.**
`1234` writes `1234`; `{n, number}` writes `1,234` in English and `1 234` in
French.

**A translation may omit an argument, never invent one.** The fallback locale
declares the arguments: `fr` may leave `{name}` out, but `{nom}` fails the
build (`ARGUMENT_UNDECLARED`). Add an argument to the fallback locale first.

## Type safety, counted

**19 plausible mistakes, 19 refused** at compile time, each measured by a
`@ts-expect-error` in
[`test/types/mail.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/test/types/mail.ts),
[`test/types/messages.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/test/types/messages.ts)
and
[`test/types/presets.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/test/types/presets.ts),
the first two checked against modules the build emitted from fixtures — not
hand-written ones.

A render function, `mails.<email>(args)`:

1. A locale the build does not hold: `{ locale: 'de', … }`.
2. A locale straight from a request, a `string` — pick it with `pickLocale`.
3. A misspelled or translated prop: `{ nom: 'Ada' }` for `name`.
4. A missing prop: `mails.verifyEmail({ locale, name, link })`, no `hours`.
5. A string where a plural expects a number: `{ hours: '24' }`.
6. A string where a date expects a `Date`: `{ placedAt: '2026-09-25' }`.
7. A `URL` object for a link: `{ link: new URL(link) }` — a link is a string,
   checked when the e-mail is rendered.
8. An e-mail that has no template: `mails.welcome({ locale })`.

A message, `t(locale, key, args)`:

9. A missing argument: `t('fr', 'verifyEmail.body', {})`.
10. No arguments at all, for a message that has some.
11. A misspelled argument: `{ nom: 'Ada' }` for `{name}`.
12. A string where a plural expects a number: `{ hours: '24' }`.
13. A string where a date expects a `Date`: `{ at: '2026-09-25' }`.
14. A locale the build does not support: `t('de', …)`.
15. A key that does not exist: `'verifyEmail.titel'`.
16. An argument passed to a message that takes none:
    `t('en', 'verifyEmail.title', { name: 'Ada' })` — the call left behind when
    a message drops its `{name}`.

A preset, in `defineMailConfig` and `definePreset`:

17. A preset function passed uncalled: `presets: [acmePreset]` for
    `presets: [acmePreset()]`.
18. A preset without a `name`.
19. A token that is not a string: `{ radius: { card: 8 } }` — a token is a CSS
    value.

The same files hold the calls that must keep compiling: a refusal that refuses
the correct call is a bug.

## Size and speed

Measured on a project of two e-mails in two locales: the module is 13.9 KB
(3.8 KB gzipped), each `html` about 2.5 KB and shared by every locale. A render
takes about 11 µs — it joins strings and calls `Intl`. The build renders each
template once with Maizzle, about half a second to a second each.

## Documentation

- [The guides](docs/README.md) — one page per area, with every case and every
  error.
- [Troubleshooting](docs/troubleshooting.md) — a build error or a compile
  error, its cause and its fix.
- [Roadmap](docs/roadmap.md) — what is next, and what is deliberately not
  planned.
- [Vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md)
  — the words these pages use, defined once.

## Licence

MIT
