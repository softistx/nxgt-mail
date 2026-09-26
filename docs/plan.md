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
  verify-email.html        one template per e-mail, text as keys
  reset-password.html
messages/
  en.json                  one ICU catalogue per locale
  fr.json
mail.config.ts             defineMailConfig({ … })
```

```html
<!-- emails/verify-email.html -->
<x-layout>
  <x-heading>{{ t('verifyEmail.title') }}</x-heading>
  <x-text>{{ t('verifyEmail.body', { name }) }}</x-text>
  <x-button href="{{ link }}">{{ t('verifyEmail.action') }}</x-button>
  <x-text>{{ t('verifyEmail.expires', { hours }) }}</x-text>
</x-layout>
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

- A template calls `t('key', { … })` for text and interpolates `{{ variable }}`
  for values (links, mostly). The compiler collects the keys and variables of
  each template: an unknown key fails the build.
- For each template and locale, Maizzle renders **once, at build time**, with
  every message and variable replaced by a unique placeholder; CSS is inlined,
  and the result is split at the placeholders into static chunks. The emitted
  render function joins the chunks with the escaped values. The `text` part is
  produced the same way from Maizzle's plain-text output.
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

- **Visibility.** The repository is created private. `nxgt-janus` went public
  with its first release; the same is expected here, at step 6.
- **Which transports first.** SMTP and Resend are proposed; say if another is
  needed before them.
- **The default brand of `nxgtPreset`.** Neutral (grey and one accent) is
  proposed, so a consumer who changes nothing still sends something plain
  rather than something branded as nxgt.

## Risks to check early

- **Maizzle 6 driven programmatically.** Its API renders a string; confirm in
  step 3 that it can be driven without a project folder, and that Tailwind 4's
  CSS-first configuration (`@theme`) can be fed from a preset object. If not,
  generate a temporary project folder per build and say so in AGENTS.md.
- **Plain text from Maizzle.** Confirm its output keeps the placeholders
  intact; if not, the `text` part is rendered from the same messages by the
  compiler instead.
- **The size of the generated module.** One HTML string per e-mail and locale:
  measure it on the fixture project, and write the number in the README.
