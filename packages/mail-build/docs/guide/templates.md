# Templates

This page is for writing the templates — one Maizzle file per e-mail — and
knowing what each becomes: the render function it is compiled into, how its
props are typed, how every value is escaped, and every construct the build
refuses.

```vue
<!-- emails/verify-email.vue -->
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

After `nxgt-mail build` (see [Building](building.md)):

```ts
import { mails } from './generated/mail';

const { subject, html, text } = mails.verifyEmail({
	locale: 'en',
	name: 'Ada',
	link: 'https://example.com/verify?token=abc',
	hours: 24,
});
// subject: 'Confirm your e-mail address'
// text:    'One step left Hello Ada, confirm this address to finish signing up. Confirm my address
//
//           https://example.com/verify?token=abc
//
//           This link expires in 24 hours.'
// html:    '<!DOCTYPE html>\n<html lang="en" …' — Tailwind compiled, CSS inlined
```

## How a template is compiled

A template is a [Maizzle 6](https://maizzle.com/docs) template: a Vue
single-file component, styled with Tailwind CSS 4. The build renders it **once**
with Maizzle — Tailwind compiled, CSS inlined, the plain text derived — with
every prop, every message and `lang` replaced by a marker, then cuts the result
at the markers. The render function it writes joins those fixed pieces with
your values, escaped. So at run time there is no Maizzle, no Vue and no
Tailwind: only string joins and the `Intl` calls of the messages.

It follows that a template can hold nothing the render function would have to
decide — no condition, no loop, no expression. A different e-mail is a
different template; text that differs goes in the message, as a
[`select` or a `plural`](catalogues.md#every-form-a-message-takes).

## The file

| Rule | Example | Refused with |
| --- | --- | --- |
| One file per e-mail in the templates folder (`emails/` by default), named in `kebab-case` | `emails/verify-email.vue` → `mails.verifyEmail`; `reset-password-2.vue` → `mails.resetPassword2` | `TEMPLATE_INVALID` — `is not a kebab-case .vue file name — name it as verify-email.vue` |
| A `<template>` | | `TEMPLATE_INVALID` — `has no <template>` |
| `<script setup>` holds one statement, `defineProps` unassigned, with the names as an array of string literals or as a type — no object with validators or defaults, no `const props = defineProps(…)`, no import, no other code | `defineProps(['name', 'link'])`, `defineProps<{ name: string; link: string }>()` | `TEMPLATE_UNSUPPORTED` — `holds code in <script setup> — a template declares its props with defineProps([...]) or defineProps<{...}>(), unassigned, and nothing else` |
| The type form in `<script setup lang="ts">` | `defineProps<{ name: string }>()` | `TEMPLATE_INVALID` — `does not declare its props in a form the build reads ([vue/compiler-sfc] Unexpected token (2:30))`, without `lang="ts"` |
| No plain `<script>` | | `TEMPLATE_INVALID` — `has a <script> without setup — declare the props in <script setup>` |
| Each prop `camelCase` | `firstName` | `TEMPLATE_INVALID` — `declares the prop first_name, which is not camelCase — name it as firstName` |
| No prop named `t`, `lang`, `locale` or `timeZone` — the render function's own | | `TEMPLATE_INVALID` — `declares the prop locale, a name the render function uses itself` |
| Every declared prop used | | `TEMPLATE_UNSUPPORTED` — `declares the prop name and never uses it — remove it, or write it in the template` |
| One file per e-mail name — `a1b.vue` and `a-1b.vue` are both `mails.a1b` | | `TEMPLATE_INVALID` — `is the e-mail a1b, as a-1b.vue is — rename one of them` |

A template with no props needs no `<script setup>` at all:

```vue
<template>
  <Layout :lang="lang">
    <Text>{{ t('passwordChanged.body') }}</Text>
  </Layout>
</template>
```

Only files ending in `.vue` are read, and the folder must hold at least one;
the e-mails come out sorted by file name.

`<script setup>` runs once, at build time: a constant computed there — or a
validator or a default of the object form, `defineProps({ name: { default: … } })`
— would be frozen into every e-mail. That is why it may hold nothing but the
names of the props, in one of two forms:

```vue
<script setup>
defineProps(['name', 'link', 'hours']);
</script>
```

```vue
<script setup lang="ts">
defineProps<{ name: string; link: string; hours: number }>();
</script>
```

The TypeScript form declares the names only: the types of the render
function's arguments still come from how each prop is used (see
[How props are typed](#how-props-are-typed)), not from the ones written here.

## What a template may hold

Each `{{ }}` and each bound attribute (`:attr="…"`) holds exactly one of:

| Form | Example | Becomes |
| --- | --- | --- |
| A prop | `{{ reference }}`, `:alt="reference"` | The value, escaped |
| A message with no argument | `{{ t('verifyEmail.title') }}`, `:alt="t('orderPlaced.logoAlt')"` | The message in the e-mail's locale, escaped |
| A message with props as its arguments | `{{ t('verifyEmail.body', { name }) }}` | The same, the prop passed to `{name}` |
| A prop passed under another name | `{{ t('orderPlaced.placedAt', { at: placedAt }) }}` | The prop `placedAt` passed to `{at}` |
| `lang` | `<Layout :lang="lang">` | The locale the e-mail is rendered in, escaped: `lang="fr"` |

The key is a string literal, and each argument a prop: `t('a.' + name)`,
`t('a.b', { name: 'Ada' })`, `name.toUpperCase()` or a third argument to `t`
all fail with `TEMPLATE_UNSUPPORTED` —
`{{ }} holds an expression — write a prop, or t('key', { prop }), and nothing else`.

Everything else in the file is Maizzle's: its components (`Layout`,
`Container`, `Heading`, `Text`, `Button`, …), plain HTML, and Tailwind classes,
compiled and inlined once.

### Components

Only **Maizzle's own components** are available. The build renders each
template from a temporary folder, so a `components/` folder in your project is
not read; components of your own will come with presets (see the
[roadmap](../roadmap.md)). A name no component answers — a typo — fails the
build rather than vanishing from the e-mail:

```text
templates: verify-email.vue: uses <Buton>, which is not a component — check its name
```

A value must reach the output as it was written. A component that drops a prop
or a message, or uses it at build time — `:class="name"`, which Tailwind turns
into CSS, or a `QrCode` that encodes its value into an image — fails the build:

```text
templates: a.vue: the prop name is not in the output — a component dropped it, or used it at build time (as a QR code does)
templates: a.vue: t('a.title') is not in the output — a component dropped it, or used it at build time
```

A `class` is written as a literal, `class="text-2xl"`, never bound.

### The directives

| Directive | Result |
| --- | --- |
| `:attr="…"` (`v-bind:attr`) | Allowed, as above |
| `v-slot`, `#default` | Allowed: a slot passes the markup through |
| `v-bind="object"` | `TEMPLATE_UNSUPPORTED` — `<p> binds an object with v-bind — bind each attribute by name` |
| `v-if`, `v-else`, `v-show`, `v-for`, `v-html`, `v-on` / `@click`, any other | `TEMPLATE_UNSUPPORTED` — `<p> uses v-if — a template renders once, at build time, so it has no condition, no loop and no event` |

A name that is not a declared prop — a typo, a variable — fails too:
`{{ }} uses nme, which is not a prop — declare it with defineProps`, or
`<a> :href uses url, which is not a prop — declare it with defineProps`.

## The subject

The subject of an e-mail is the message `<email>.subject` in the catalogues —
`verifyEmail.subject` for `verify-email.vue` — not something the template
writes. It is required, and translated like any message.

```json
{ "orderPlaced": { "subject": "Order {reference} confirmed" } }
```

The subject's arguments are passed **the props of the same name**: `{reference}`
needs a prop `reference` in `order-placed.vue`.

| Mistake | Refused with |
| --- | --- |
| No `orderPlaced.subject` in the fallback locale | `SUBJECT_MISSING` — `the e-mail orderPlaced has no subject — add orderPlaced.subject to en, the fallback locale` |
| `{reference}` in the subject, and no prop `reference` | `TEMPLATE_ARGUMENT_MISSING` — `orderPlaced.subject uses {reference}, which is not a prop of the template — declare it with defineProps` |

Any run of line breaks in the rendered subject — CR, LF, U+0085, U+2028,
U+2029 — becomes one space: a line break in a subject is a header injection.

## Keys and arguments, checked against the catalogues

Every `t()` call is checked against the **fallback locale's** catalogue; the
catalogues themselves are checked against each other as described in
[Catalogues](catalogues.md#what-fails-the-build).

| Mistake | Refused with |
| --- | --- |
| A key the fallback locale does not hold | `TEMPLATE_KEY_UNKNOWN` — `t('verifyEmail.titel') is not a key of en, the fallback locale` |
| A message argument left out | `TEMPLATE_ARGUMENT_MISSING` — `t('verifyEmail.body') leaves out {name}, which en declares — pass it a prop` |
| An argument the message does not declare | `TEMPLATE_ARGUMENT_UNKNOWN` — `t('verifyEmail.title') passes {name}, which en does not declare` |

Every error is a `MailBuildError` whose `message` starts with
`templates: <file>:`, and whose `template` is the file name, as
`verify-email.vue`; `key` is set when a key is involved.

## How props are typed

Each prop becomes a required property of the render function's arguments,
typed from every place it is used:

| Where the prop is used | Its type |
| --- | --- |
| Passed to `{name}` or `{method, select, …}` | `string` |
| Passed to `{n, plural, …}`, `{n, selectordinal, …}`, `{n, number}`, `{n, number, ::currency/EUR}` | `number` |
| Passed to `{at, date, …}` or `{at, time, …}` | `Date` |
| Only written as is — `{{ reference }}`, `:title="reference"` | `string` |
| Written as is, and passed to a message that makes it a `number` | `number`, written with `String()` — not formatted |
| Bound to an `href` | `string`, checked as an `http:`, `https:` or `mailto:` URL at call time |
| Bound to a `src` | `string`, checked as an `http:` or `https:` URL at call time |

Beside the props, every render function takes `locale` (a `Locale` of the
build, required) and `timeZone` (optional, the IANA zone its dates are written
in — `UTC` when left out):

```ts
// What the build writes for the two e-mails on this page
export interface MailArgs {
	orderPlaced: {
		readonly locale: Locale;
		readonly timeZone?: string;
		readonly logo: string;
		readonly name: string;
		readonly orderLink: string;
		readonly placedAt: Date;
		readonly reference: string;
		readonly total: number;
	};
	verifyEmail: {
		readonly locale: Locale;
		readonly timeZone?: string;
		readonly hours: number;
		readonly link: string;
		readonly name: string;
	};
}
```

Uses must agree. A prop that is a number in one message and a date in another,
a date also written as is, or a number bound to a link fails with
`ARGUMENT_TYPE_MISMATCH`:

```text
templates: a.vue: the prop at is a date in t('a.at'), and written as is in the template
templates: a.vue: the prop n is a number in t('a.n'), and a link in the template
```

Write a date through a message — `{at, date, long}` — never as `{{ at }}`.

## Where a value lands — escaping and URLs

Every value — a prop, a message, `lang` — is HTML-escaped in `html` (`&`, `<`,
`>`, `"`, `'`) and left as is in `text`. Where it lands decides the rest:

| Where | Example | What happens |
| --- | --- | --- |
| Text, or a plain HTML comment | `<p>{{ name }}</p>` | Escaped |
| A text attribute — `alt`, `title`, `lang`, `xml:lang`, `dir`, `id`, `name`, `role`, `width`, `height`, `label`, `summary`, `abbr`, `aria-*`, `data-*` | `:alt="t('orderPlaced.logoAlt')"`, `:title="name"`, `:aria-label="name"` | Escaped, so it cannot leave its quotes |
| The start of an `href` or `xlink:href` | `:href="link"` | Escaped, and checked when the e-mail is rendered: `http:`, `https:` or `mailto:` |
| The start of a `src`, `background` or `poster` | `:src="logo"` | Escaped, and checked: `http:` or `https:` |
| Any other attribute — `style`, `on*`, `srcset`, `srcdoc`, `content`, … | `:style="color"`, `:onclick="name"`, `:srcset="logo"` | `TEMPLATE_UNSUPPORTED` — `the prop name lands in the style attribute — only text attributes (alt, title, aria-*…) and URLs (href, src) take a value` |
| An element whose content is read as text, not markup — `<style>`, `<script>`, `<title>`, `<textarea>`, `<iframe>`, `<xmp>`, `<noembed>`, `<noframes>`, `<plaintext>` — even inside an Outlook conditional comment | | `TEMPLATE_UNSUPPORTED` — `the prop name lands in a <title> element` |
| A tag, outside a quoted attribute value | | `TEMPLATE_UNSUPPORTED` — `the prop name lands in a tag outside a quoted attribute value` |
| A message at the start of a link | `:href="t('a.url')"` | `TEMPLATE_UNSUPPORTED` — `a message starts an href — a URL is a prop, checked when the e-mail is rendered` |

`class` is a text attribute too, but a bound one never reaches the output —
see [Components](#components). The attributes are read from the HTML Maizzle
produced, so a `:href` passed to `<Button>` is checked on the `<a>` it renders.

That HTML is scanned as a mail client reads it. What follows an abrupt comment
— `<!-->`, as in the `<!--[if !mso]><!-->` that `<NotOutlook>` and `<Img>`
emit — is markup in every client but Outlook, so it is scanned and checked as
markup, not skipped as a comment. A comment also ends at `--!>`, and a
`<![CDATA[` section at `]]>`.

A URL check is anchored at the first character — a leading space is refused,
not trimmed — and throws a `TypeError` from the render function:

```ts
import { mails } from './generated/mail';

mails.verifyEmail({ locale: 'en', name: 'Ada', link: 'javascript:alert(1)', hours: 24 });
// TypeError: mails.verifyEmail: link must be an http:, https: or mailto: URL

mails.orderPlaced({
	locale: 'en',
	name: 'Ada',
	reference: 'A-1042',
	placedAt: new Date(),
	total: 42.5,
	logo: 'mailto:logo@example.com',
	orderLink: 'https://example.com/orders/A-1042',
});
// TypeError: mails.orderPlaced: logo must be an http: or https: URL
```

A prop bound to both a `src` and an `href` is held to the stricter check,
`http:` or `https:`.

## The plain-text part

`text` is Maizzle's plain-text version of the same render: the text of each
block joined with spaces, and the URL of a link written after the text, on its
own paragraph. The `alt` of an image is not in it. Look at it with
`nxgt-mail dev` (see [Building](building.md#previews--nxgt-mail-dev)), which
writes each `text` beside its `html`.

## A realistic case — an order confirmation

A logo, a date in the recipient's time zone, a price, and a link to the order:

```vue
<!-- emails/order-placed.vue -->
<script setup>
defineProps(['name', 'reference', 'placedAt', 'total', 'logo', 'orderLink']);
</script>

<template>
  <Layout :lang="lang">
    <Container class="bg-white p-6">
      <img :src="logo" :alt="t('orderPlaced.logoAlt')" width="120">
      <Heading class="text-2xl">{{ t('orderPlaced.title', { name }) }}</Heading>
      <Text>{{ reference }}</Text>
      <Text>{{ t('orderPlaced.placedAt', { at: placedAt }) }}</Text>
      <Text>{{ t('orderPlaced.total', { total }) }}</Text>
      <a :href="orderLink">{{ reference }}</a>
    </Container>
  </Layout>
</template>
```

```json
{
	"orderPlaced": {
		"subject": "Order {reference} confirmed",
		"title": "Thank you, {name}",
		"placedAt": "Placed on {at, date, long} at {at, time, short}.",
		"total": "Total: {total, number, ::currency/EUR}",
		"logoAlt": "Our logo"
	}
}
```

Sent from an order service, in the customer's locale and time zone:

```ts
import { type Mailer, pickLocale, type SentMail } from '@nxgt/mail';
import { fallbackLocale, locales, mails } from './generated/mail';

interface Order {
	readonly reference: string;
	readonly placedAt: Date;
	readonly total: number;
	readonly customer: {
		readonly email: string;
		readonly name: string;
		readonly locale: string | null;
		readonly timeZone: string;
	};
}

export function sendOrderPlaced(mailer: Mailer, order: Order): Promise<SentMail> {
	const { customer } = order;
	return mailer.send({
		to: { name: customer.name, address: customer.email },
		...mails.orderPlaced({
			locale: pickLocale(customer.locale, locales, fallbackLocale),
			timeZone: customer.timeZone,
			name: customer.name,
			reference: order.reference,
			placedAt: order.placedAt,
			total: order.total,
			logo: 'https://cdn.example.com/logo.png',
			orderLink: `https://example.com/orders/${encodeURIComponent(order.reference)}`,
		}),
	});
}
```

For `placedAt: new Date('2026-09-25T21:30:00Z')` in `Europe/Paris`, it sends:

```text
subject: Order A-1042 confirmed
text:    Thank you, Ada A-1042 Placed on September 25, 2026 at 11:30 PM. Total: €42.50 A-1042

         https://example.com/orders/A-1042
```

And its test, with the memory mailer — nothing is rendered by an engine, so it
runs in microseconds:

```ts
import { expect, it } from 'bun:test';
import { createMemoryMailer } from '@nxgt/mail';
import { sendOrderPlaced } from './send-order-placed';

it('sends the order confirmation in the customer’s locale', async () => {
	const mailer = createMemoryMailer();

	await sendOrderPlaced(mailer, {
		reference: 'A-1042',
		placedAt: new Date('2026-09-25T21:30:00Z'),
		total: 42.5,
		customer: { email: 'ada@example.com', name: 'Ada', locale: 'fr-FR', timeZone: 'Europe/Paris' },
	});

	expect(mailer.sent[0]?.subject).toBe('Commande A-1042 confirmée');
	expect(mailer.sent[0]?.html).toContain('lang="fr"');
});
```

How the module around `mails` is shaped is in
[The generated module](generated-module.md); every error on this page, with
its fix, is in [Troubleshooting](../troubleshooting.md).
