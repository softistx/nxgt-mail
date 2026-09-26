# @nxgt/mail-preset

The default preset of [`@nxgt/mail-build`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail-build):
a transactional layout, seven components, neutral Tailwind CSS 4 theme tokens
tuned for e-mail clients, and the shared messages (a greeting, a footer) in
English and French. Add it to your config and write a template that looks
right without writing a layout. It runs **at build time only**, as a
devDependency.

```ts
// mail.config.ts
import { defineMailConfig } from '@nxgt/mail-build';
import { nxgtPreset } from '@nxgt/mail-preset';

export default defineMailConfig({
	locales: ['en', 'fr'],
	fallbackLocale: 'en',
	presets: [nxgtPreset({ brand: { primary: '#4f46e5' } })],
});
```

> **Not published yet.** The package is `private` and ships with the first
> release of `@nxgt/mail-build`. See the [roadmap](docs/roadmap.md).

## Install

```sh
bun add -d @nxgt/mail-build @nxgt/mail-preset
```

A devDependency beside `@nxgt/mail-build`, which is a **required peer**, as
is `typescript` (6): nothing of either package reaches your server, and the
module the build writes imports neither.

## Usage

### Writing a template — `TransactionalLayout` and the `Mail*` components

The layout draws the logo, a white card on a grey canvas, and a footer; the
components style Maizzle's own with the preset's tokens. This is a whole
template:

```vue
<!-- emails/verify-email.vue -->
<script setup>
defineProps(['link', 'name', 'hours', 'code']);
</script>

<template>
  <TransactionalLayout :preheader="t('verifyEmail.preheader')">
    <MailHeading>{{ t('verifyEmail.title') }}</MailHeading>
    <MailText>{{ t('common.greeting', { name }) }}</MailText>
    <MailText>{{ t('verifyEmail.body') }}</MailText>
    <MailButton :href="link">{{ t('verifyEmail.action') }}</MailButton>
    <MailSpacer />
    <MailText>{{ t('verifyEmail.orCode') }}</MailText>
    <MailCode>{{ code }}</MailCode>
    <MailDivider />
    <MailText>{{ t('verifyEmail.expires', { hours }) }}</MailText>
    <template #footer>{{ t('common.footer.ignore') }}</template>
  </TransactionalLayout>
</template>
```

| Component | Props | Draws |
| --- | --- | --- |
| `TransactionalLayout` | `preheader` (optional); a `#footer` slot | The page: the logo, the card holding the template, the footer — `common.footer.why` unless the `#footer` slot says otherwise |
| `MailHeading` | `level` (default `1`) | A heading, `<h1>` to `<h6>` |
| `MailText` | | A paragraph |
| `MailButton` | `href` (required) | A button in the accent colour, with Maizzle's Outlook fallback |
| `MailLink` | `href` (required) | An underlined link in the accent colour |
| `MailDivider` | | A horizontal rule |
| `MailSpacer` | | Vertical space |
| `MailCode` | | A one-time code: large, monospaced, centred on a tinted block |

Every prop, slot and class is in [Components](docs/guide/components.md).

### Changing the brand — `nxgtPreset(options)`

```ts
nxgtPreset({
	brand: { primary: '#4f46e5', logo: 'https://cdn.example.com/logo.png', name: 'Acme' },
	theme: { color: { canvas: '#ffffff' }, radius: { button: '0' } },
});
```

| Option | Tokens | Effect |
| --- | --- | --- |
| `brand.primary` | `color.primary` | The button and the links. Default `#2563eb` |
| `brand.onPrimary` | `color.onPrimary` | The text on the button. Default `#ffffff` |
| `brand.logo` | | An `http:` or `https:` URL, drawn at the top of every e-mail. Default: no logo |
| `brand.name` | | The logo's alternative text, given with `brand.logo` — alone, it is a `TypeError`. Default `''` |
| `theme.<namespace>.<token>` | any of `color`, `font`, `radius` | One token, the others kept |

The default brand is **neutral on purpose**: grey, and one accent
(`#2563eb`), so an application that changes nothing sends something plain
rather than something branded as someone else's. Every token, its default and
its Tailwind class (`bg-primary`, `text-on-primary`, `rounded-button`,
`font-mono`…) is in [Theme](docs/guide/theme.md). The options are typed
`NxgtPresetOptions`, and the tokens `NxgtTheme` — both exported.

### The shared messages — `common.*`

| Key | `en` | `fr` |
| --- | --- | --- |
| `common.greeting` | `Hello {name},` | `Bonjour {name},` |
| `common.footer.why` | `You are receiving this e-mail because of an action on your account.` | `Vous recevez cet e-mail suite à une action sur votre compte.` |
| `common.footer.ignore` | `If you did not ask for this, you can ignore this e-mail.` | `Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail.` |

Override one by writing the same key in your own catalogue:

```json
{ "common": { "footer": { "why": "You are receiving this e-mail because you have an Acme account." } } }
```

A locale the preset does not translate — `de`, say — must write **every**
`common.*` key in `messages/de.json`, or the build fails:

```text
messages: de: common.footer.ignore is missing — en, the fallback locale, has it
```

See [Messages](docs/guide/messages.md).

### A preset of your own — `definePreset`

A second preset, listed after `nxgtPreset()`, overrides it one token, one
component or one message at a time:

```ts
// mail.config.ts
import { defineMailConfig, definePreset } from '@nxgt/mail-build';
import { nxgtPreset } from '@nxgt/mail-preset';

const acme = definePreset({
	name: 'acme',
	theme: { color: { primary: '#e11d48' } },
	messages: {
		en: { common: { footer: { why: 'Acme sent you this e-mail.' } } },
	},
});

export default defineMailConfig({
	locales: ['en', 'fr'],
	fallbackLocale: 'en',
	presets: [nxgtPreset(), acme],
});
```

The button turns `#e11d48`, every other token is kept; the English footer
changes, the French one does not. Replacing a component, and the order
everything is applied in, are in [Extending](docs/guide/extending.md).

## Traps

**Call the preset.** `presets: [nxgtPreset()]` — `presets: [nxgtPreset]` is a
compile error in `mail.config.ts`.

**A token `nxgtPreset` does not have is refused; one a second preset
misspells is not.** `nxgtPreset({ theme: { color: { brand: '…' } } })` is a
compile error, but `definePreset({ theme: { color: { primry: '…' } } })` adds
a token nothing uses.

**A layout of your own imports `theme.css`, or the tokens do nothing.** Write
`@import "@maizzle/tailwindcss"; @import "./theme.css";` in one `<style>` —
see [Extending](docs/guide/extending.md#a-layout-of-your-own).

**A component may not take a name Maizzle ships** (`Button.vue`, `Text.vue`…):
the build refuses it. That is why these are `MailButton` and `MailText`.

## Mail clients

The HTML the fixture e-mails render to was checked on 2026-09-26 against the
[caniemail.com](https://www.caniemail.com) data — the data behind Maizzle's
compatibility panel — for Gmail, Outlook and Apple Mail:

- **No feature it uses is unsupported**, except two that are cosmetic:
  `border-radius`, so the corners of the card, the button and the code are
  square in Outlook for Windows and in Windows Mail; and `word-break`, in
  Windows Mail.
- **Outlook for Mac drops the styles on `<body>`**, so the layout repeats the
  canvas colour on the block inside it that holds the e-mail.
- Everything else is supported, or partially supported, as for any HTML
  e-mail.

It has **not yet been checked visually in the real clients**. That check is
still to do, with a rendering service or a manual send, and its result will be
written here.

## Type safety, counted

**4 plausible mistakes, 4 refused** at compile time, each measured by a
`@ts-expect-error` in
[`test/types/refusals.ts`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-preset/test/types/refusals.ts):

1. A misspelled brand option: `nxgtPreset({ brand: { primry: '#4f46e5' } })`.
2. A token the preset does not have: `{ theme: { color: { brand: '#4f46e5' } } }`.
3. A namespace the preset does not have: `{ theme: { colour: { … } } }`.
4. A token that is not a string: `{ theme: { radius: { card: 8 } } }` — a
   token is a CSS value.

The same file holds the calls that must keep compiling. The same mistakes,
from a config written in JavaScript, are a `TypeError` when `nxgtPreset` runs.

## Documentation

- [The guides](docs/README.md) — the theme, the components, the messages, and
  extending the preset.
- [Troubleshooting](docs/troubleshooting.md) — an error from `nxgtPreset` or
  from the build, its cause and its fix.
- [Roadmap](docs/roadmap.md) — what is next, and what is deliberately not
  planned.
- [Vocabulary](https://github.com/softistx/nxgt-mail/blob/develop/docs/vocabulary.md)
  — the words these pages use, defined once.

## Licence

MIT
