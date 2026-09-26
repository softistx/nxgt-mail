# Plan

The work, in the order it lands. Each step is one pull request against
`develop` (sometimes a few), reviewed, with its changeset, CI green on the
head that is merged. Read [`AGENTS.md`](../AGENTS.md) first: this file says
*what* and *in which order*, AGENTS.md says *under which rules*.

A step is done when its **Done when** holds — measured, not asserted.

---

## The shape of the result

What a consumer writes:

```text
emails/
  verify-email.vue         one template per e-mail, text as keys
  reset-password.vue
messages/
  en.json                  one ICU catalogue per locale
  fr.json
mail.config.ts             defineMailConfig({ … })
```

```vue
<!-- emails/verify-email.vue — Maizzle 6 templates are Vue single-file components -->
<script setup>
defineProps(['link', 'name', 'hours'])
</script>

<template>
  <Layout :lang="lang">
    <Heading>{{ t('verifyEmail.title') }}</Heading>
    <Text>{{ t('verifyEmail.body', { name }) }}</Text>
    <Button :href="link">{{ t('verifyEmail.action') }}</Button>
    <Text>{{ t('verifyEmail.expires', { hours }) }}</Text>
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

```ts
// mail.config.ts
import { defineMailConfig } from '@nxgt/mail-build';
import { nxgtPreset } from '@nxgt/mail-preset';

export default defineMailConfig({
  presets: [nxgtPreset({ brand: { primary: '#4f46e5', logo: 'https://…' } })],
  locales: ['en', 'fr'],
  fallbackLocale: 'en',
  out: 'src/generated/mail.ts',
});
```

```sh
bunx nxgt-mail build
```

```ts
import { mails } from './generated/mail';

mails.verifyEmail({ locale: 'fr', name: 'Ada', link, hours: 24 });
// → { subject, html, text }

mails.verifyEmail({ locale: 'de', name: 'Ada', link, hours: 24 });
//                         ~~~~ 'de' is not a locale of this build
mails.verifyEmail({ locale: 'fr', nom: 'Ada', link, hours: 24 });
//                                ~~~ not an argument of verifyEmail
```

The arguments of a render function are the **union of every argument its
messages use**, typed from the ICU: `{name}` a string, `{hours, plural, …}` a
number, `{at, date}` a `Date`, and an `href`/`src` value a URL string checked
at call time.

---

## Step 0 — The skeleton

Copy from `nxgt-janus` (it is the fifth copy; AGENTS.md says why): `build.ts`,
`scripts/verify-artifacts.ts` and its spec, `scripts/publish.ts` and its spec,
`.github/workflows/ci.yml` and `release.yml`, `bunfig.toml`,
`tsconfig.base.json`, `tsconfig.json`, `scripts/tsconfig.json`, `biome.json`
(with `useNamingConvention` and the `test/types` override), `.changeset/`
(`baseBranch: develop`, the changelog pointing at `softistx/nxgt-mail`), the
root `package.json` scripts. Adapt names; change nothing else without a reason
written in the PR.

**Done when:** `bun install && bun run check && bun run typecheck && bun run
build && bun run test && bun run verify:artifacts` pass on an empty
`packages/mail` that is `private`, and CI runs them on a pull request.

## Step 1 — `@nxgt/mail`, the run-time core

No dependency at all. Holds:

- `Rendered` — `{ subject: string; html: string; text: string }`.
- `MailMessage` — `Rendered` plus `to`, `from?`, `replyTo?`, `headers?`.
  Addresses are strings or `{ name, address }`.
- `Mailer` — the port: `send(message: MailMessage): Promise<SentMail>`, where
  `SentMail` carries the transport's message id or `null` when it has none. **A
  failure throws `MailFailure`** (code `MAIL_FAILED`, the transport's error as
  `cause`); a message the transport refused as malformed throws
  `MailRefused` (`MAIL_REFUSED`). Never `false`, never a swallowed error.
- `createMemoryMailer()` — the reference transport: keeps an outbox a test can
  read (`mailer.sent`), and can be told to fail the next send.
- `pickLocale(wanted, supported, fallback)` — `wanted` is a list (a user's
  stored locale, then `Accept-Language` in order); `fr-CA` matches `fr`; an
  empty or unmatched list answers the fallback. Pure, no request context — the
  locale of an e-mail is the **recipient's**, usually a user field, not the
  language of the request that triggered it.
- `./conformance` — `describeMailer(harness)`: a transport's suite. At least:
  a send answers `SentMail`; an outage throws `MailFailure` and
  `instanceof` holds against the class imported from `@nxgt/mail` (the probe
  AGENTS.md asks for); a message is delivered byte for byte (subject with
  accents, HTML with an emoji, a text part); nothing is retried silently.

**Done when:** the memory mailer passes `describeMailer`; the type tests hold
the first refusals (a `MailMessage` without `to`, a `Mailer` missing `send`);
`docs/vocabulary.md` exists.

## Step 2 — The message compiler (`@nxgt/mail-build`, part 1)

ICU only, no HTML yet. Uses `@formatjs/icu-messageformat-parser` **at build
time**; emits TypeScript that uses only `Intl.PluralRules`,
`Intl.NumberFormat`, `Intl.DateTimeFormat` at run time.

- Reads `messages/<locale>.json` (nested objects; keys `camelCase`, refused
  otherwise).
- Checks, and **fails the build** naming locale and key: a catalogue that does
  not parse; a key present in one locale and missing in another (the fallback
  locale is the reference); an argument used in one locale and not declared in
  the reference, or declared with another type (`{n, plural}` here, `{n}`
  there).
- Emits, per key, a function typed from its arguments.
- Merges catalogues from presets first, then the application's: a later
  source overrides a key, never a whole namespace.

**Done when:** specs cover each build failure with its exact message; a golden
test compares the emitted module; `test/types/` refuses a missing, misspelled
and mistyped argument against a module generated in the spec run; the plural
of `fr` (`0` is singular) and `en` are both exercised.

## Step 3 — Templates (`@nxgt/mail-build`, part 2)

Maizzle 6 with Tailwind CSS 4, driven programmatically (not a Maizzle project
checked into the consumer's repository).

- A template is a Vue single-file component (Maizzle 6): it declares its
  props with `defineProps`, calls `t('key', { prop })` for text and
  interpolates `{{ prop }}` or binds `:href="prop"` for values (links,
  mostly). Nothing else — no `v-if`, no `v-for`, no expression: a template
  renders once, so a condition would be decided at build time. The compiler
  collects the keys and props of each template: an unknown key fails the
  build.
- For each template, Maizzle renders **once, at build time** — not once per
  locale: `lang` is a placeholder too — with every message and prop replaced
  by a unique placeholder; CSS is inlined, and the result is split at the
  placeholders into static chunks. The emitted render function joins the
  chunks with the escaped values. The `text` part is produced the same way
  from Maizzle's plain-text output.
- `href`/`src` placeholders are marked, so the render function checks the URL
  scheme there and only there.
- The subject is the message `<email>.subject`, required in every locale.
- `nxgt-mail build` (the CLI) and `build(config)` (the API) do the same thing;
  `nxgt-mail dev` renders every e-mail in every locale to a local folder to
  look at. A preview server is not in this step.

**Done when:** a fixture project builds; the emitted `html` of every e-mail is
checked against a snapshot per locale; an injection test proves `<script>` in
a name is escaped, `javascript:` in a link is refused, and a line break in a
subject argument is removed; the render path of the generated module imports
nothing from Maizzle, Tailwind or the parser (checked by walking its import
graph, as `nxgt-janus/src/entries.spec.ts` does).

## Step 4 — Presets (`@nxgt/mail-preset`)

A preset is **data**, typed by `definePreset`:

- `theme` — Tailwind 4 tokens tuned for e-mail clients (colours, fonts with
  safe fallbacks, spacing, radius), overridable one token at a time:
  `nxgtPreset({ brand: { primary } })`.
- `layouts` — at least `transactional` (a header, a body, a footer).
- `components` — `button`, `heading`, `text`, `divider`, `spacer`, `code`
  (a one-time code, large and monospaced, easy to copy), `link`.
- `messages` — shared keys in `en` and `fr` (`common.greeting`,
  `common.footer.why`, `common.footer.ignore`).

`defineMailConfig({ presets: [a, b] })` applies them in order; the
application's own files come last. A token that does not exist in any preset
is a compile error (type test).

**Done when:** the fixture project of step 3 builds with `nxgtPreset()` and
with a second preset overriding one token and one message; the rendered
e-mails are checked in at least Gmail, Outlook and Apple Mail (Maizzle's
guidance, or a rendering service), and the result is written in the README.

**What step 4 found.**

- **The preset is data, and every part of it is checked.** It is a `name`,
  a `theme` (namespace → token → value), `components` (file name → source)
  and `messages` (catalogues by locale). `definePreset` lives in
  `@nxgt/mail-build`. `@nxgt/mail-preset` imports only its type, as a peer.
- **Why the build merges the components itself.** Given two component
  folders holding the same name, Maizzle keeps one of them regardless of
  their order ("naming conflicts … ignored"). So the build writes every
  preset's components, then the application's `components/`, into one
  folder: the last write wins, and that folder is Maizzle's only source.
- **A component may not take a name Maizzle ships (`Button.vue`…).** A
  component with such a name replaces Maizzle's everywhere, and the
  replacement can no longer wrap the original. The preset's components are
  therefore `TransactionalLayout` and `Mail*`.
- **Tailwind's `@theme` is fed from the preset.** The build writes
  `theme.css` beside each template. A layout imports it in the *same*
  `<style>` as Maizzle's Tailwind; tokens in another block do not reach the
  utilities. The tokens come out inlined (`background-color: #2563eb`), with
  no `var()` left.
- **The client check was run against caniemail data, not in real clients.**
  - On 2026-09-26 the rendered fixture was checked against caniemail data
    (what Maizzle's compatibility panel reads) for Gmail, Outlook and Apple
    Mail.
  - Nothing it uses is unsupported, except `border-radius` in Outlook for
    Windows and `word-break` in Windows Mail. Both are cosmetic.
  - A visual check in the real clients is still to do.
- **The fixture is the preset's own.** It holds the step 3 e-mails rewritten
  with the preset's components: the step 3 fixture uses Maizzle's `<Layout>`
  and would not show the tokens.
- **A token that does not exist is a compile error only in
  `nxgtPreset({ … })`** (four refusals). A Tailwind class that names a
  missing token is dropped by Tailwind without a word, and nothing catches
  it yet.

## Step 5 — Transports

One package each, `@nxgt/mail` as a required peer, no error class of their
own, each passing `describeMailer`:

- `@nxgt/mail-smtp` — on `nodemailer` (a peer, the consumer's version).
- `@nxgt/mail-resend` — over `fetch`, no SDK.

Others (SES, Postmark, Mailgun) are roadmap entries, not this step.

**Done when:** both pass the conformance suite — SMTP against a local test
server started by the specs, Resend against a recorded HTTP exchange — and an
outage in each ends in `MailFailure` with `cause`.

## Step 6 — Documentation and the first release

Each package gets its README (the npm page: install, API, traps, the refusal
count) and a `docs/` folder (guides, troubleshooting, roadmap), as in
`nxgt-janus`. The guides show, with a snippet that compiles, every case a
catalogue can hold: a plain message, an argument, a plural, a `select`, a
date, a number, a nested key, a message shared from a preset, an overridden
one, a new locale.

Then remove `"private"` from each package, one deliberate commit each, with
the changeset that versions it at `0.1.0`, and merge the Version PR.

**Done when:** the packages are on npm and install into an empty project that
builds and renders an e-mail with the README's own snippet.

## Step 7 — Handing over to janus

Not in this repository: `@nxgt/janus-mail` is built in `nxgt-janus`, with
`@nxgt/mail-build` and `@nxgt/mail-preset`, holding the default e-mails of the
janus flows (verification, password reset, one-time codes) in `en` and `fr`.
This repository's part is done when that package can be written with the
published packages alone.

Then archive `nxgt-maizzle` — Steve decides when.

---

## Open questions — Steve's to answer

- ~~**Visibility.**~~ Answered 2026-09-25: the repository is **public** from
  step 0. GitHub would not run CI on it while private (a billing refusal), and
  Steve chose to open it rather than pay for the minutes.
- **Which transports first.** SMTP and Resend are proposed; say if another is
  needed before them.
- **The default brand of `nxgtPreset`.** Neutral (grey and one accent) is
  proposed, so a consumer who changes nothing still sends something plain
  rather than something branded as nxgt. Step 4 shipped it that way
  (`#2563eb` on greys); one token changes it.

## Risks to check early

- **Maizzle 6 driven programmatically.** Confirmed in step 3: `render()` needs
  no project folder. One catch, handled: Tailwind resolves Maizzle's
  `@import "@maizzle/tailwindcss"` from the template's folder, before Maizzle
  rewrites it, and fails silently where the package is not hoisted (Bun,
  pnpm). The build renders from a temporary folder that links it, and fails
  if CSS is left uncompiled. Feeding Tailwind 4's `@theme` from a preset
  object: confirmed in step 4, through a generated `theme.css` imported in the
  layout's Tailwind `<style>`.
- **Plain text from Maizzle.** Confirmed: its output keeps the placeholders.
- **The size of the generated module.** One HTML string per e-mail, shared by
  every locale: the fixture's two e-mails in two locales make a 13.8 KB module
  (3.8 KB gzipped), each `html` about 2.5 KB; a render takes about 11 µs.
