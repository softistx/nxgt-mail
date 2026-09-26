# AGENTS.md

`nxgt-mail` builds **transactional e-mails that are typed, translated and
rendered with no engine at run time**. A developer writes one template per
e-mail — Maizzle, Tailwind CSS 4 — and one ICU message catalogue per language;
a build step compiles both into a TypeScript module of render functions:

```ts
import { mails } from './generated/mail';

const { subject, html, text } = mails.verifyEmail({ locale: 'fr', link });
await mailer.send({ to, ...mails.verifyEmail({ locale: 'fr', link }) });
```

A missing variable, a misspelled one, a number passed where a plural expects
one, an unknown locale, an unknown e-mail: **compile errors**. The run time
does string substitution and `Intl` — nothing else.

It is a **product for people outside this organisation**, like `nxgt-janus`,
and it is where `@nxgt/janus-mail` gets its templates from: janus is its first
consumer, not its audience.

Read this file, then [`docs/plan.md`](./docs/plan.md) — the work, in order —
then each package's own README once it exists.

---

## What this repository replaces

`~/workspace/dev/nxgt-maizzle` is a private Maizzle 5 starter (Tailwind 3, a
verification and a password-reset template, HTML written per e-mail). **It is
replaced, not extended** (decided 2026-09-26): nothing is copied from it but
what a template needs to look right, and it is archived once this repository
ships its first release. Maizzle 6 is the version that builds with Tailwind 4.

## What it deliberately does not do

- **One HTML file per language.** Rejected as too heavy: a layout fix made
  twice, or once and forgotten. One template per e-mail; its text is **keys**
  into catalogues. Generating one HTML string per locale *at build time* is an
  implementation detail and is fine — authoring one per locale is not.
- **A template engine at run time.** No Handlebars, no MJML, no Maizzle in a
  consumer's server. Handlebars was considered and rejected: untyped, and a
  run-time dependency for something the build can finish.
- **Reusing `@nxgt/i18n` from nxgt-core.** Same ICU syntax, deliberately not the
  package: it swallows a formatting failure (`console.error`, then the raw
  message), which here would send an e-mail with `{link}` in it, and it depends
  on `hono` and `lodash`. See the invariant below.

---

## The inherited invariant

From `nxgt-janus/AGENTS.md`, and before it `nxgt-ory`:

> **An absence is `null`. A failure throws.**

What it means here:

- A transport that could not hand the message over **throws** — never answers
  `false`, never logs and returns. A caller that maps a failed send to "sent"
  has told a user to check an inbox that will stay empty.
- A catalogue that does not parse, a key missing in one locale, an argument
  one locale uses and another does not: **the build fails**, naming the
  e-mail, the locale and the key. Nothing is caught and nothing falls back to
  the raw message.
- At run time, the only thing left that can fail is the transport. Everything
  else was decided by the compiler.

A refusal at **wiring** time (a bad option passed to a factory) is a bare
`TypeError`. A refusal at **call** time is a class with a `code`, the codes a
union of `SCREAMING_SNAKE` literals so a `switch` is exhaustive.

A message reports **a shape, never a value**: never a recipient address, never
a subject, never a link — a link in a verification e-mail is a credential.

---

## Escaping is the render function's job, not the author's

- Every interpolated value is **HTML-escaped** in `html` and left as is in
  `text`. There is no "raw" interpolation in v1.
- A value interpolated into an `href` or a `src` must be an `http:` or
  `https:` URL (or `mailto:` for `href`): anything else — `javascript:`, a
  relative path — is refused at call time with a `TypeError`. A link is the
  one variable an attacker controls most often.
- The subject is a message like any other, translated, typed, and stripped of
  line breaks — a header injection is a line break in a subject.

## No `snake_case`, anywhere

Every key is `camelCase`: options, render arguments, catalogue keys
(`verifyEmail.title`, not `verify_email.title`), preset tokens. Held by
Biome's `useNamingConvention`, as in `nxgt-janus`. Error codes are data values,
`SCREAMING_SNAKE`, and that is not an exception.

## Type safety is measured, not claimed

As in `nxgt-janus`: **every refusal has a `@ts-expect-error` case in
`test/types/`, and the count is in the README.** A count that goes down is a
visible regression. The list starts with the mistakes in the first section:
missing, misspelled or mistyped variable, unknown locale, unknown e-mail, a
preset token that does not exist. It also holds the calls that **must keep
compiling** — a refusal that refuses the correct call is a bug.

The generated module is what carries the types, so the type tests run against
a module generated from fixtures in the spec run, not a hand-written one.

---

## Layout

A monorepo of small packages, each publishable on its own. See
[`docs/plan.md`](./docs/plan.md) for what each one holds and in which order
they are built.

| Package | Runs | Holds |
| --- | --- | --- |
| `@nxgt/mail` | at run time | The `Mailer` port, the `Rendered` shape, the errors, locale selection, a memory mailer, and `./conformance` for transports. **No dependency** |
| `@nxgt/mail-build` | at build time only | The compiler — Maizzle 6, Tailwind CSS 4, the ICU parser — and the `nxgt-mail` CLI. A `devDependency` of whoever uses it, never shipped to a server |
| `@nxgt/mail-preset` | at build time only | The default preset: theme tokens, layouts, components, and the shared messages (a footer, a greeting) in English and French |
| `@nxgt/mail-smtp`, `@nxgt/mail-resend`, … | at run time | One transport each, implementing the port, passing the conformance suite |

`@nxgt/janus-mail` lives in `nxgt-janus`, beside `@nxgt/janus-hono`: it
depends on both `@nxgt/janus` and `@nxgt/mail` as peers.

**Presets are how a package ships defaults without forcing them.** A preset is
data: theme tokens, layouts, components and messages. The build takes a list;
a later preset overrides an earlier one key by key, and the application's own
files override every preset. A consumer changes the brand colour in one token,
adds a language with one catalogue, or replaces one e-mail with one file — and
keeps the rest. Replacing an e-mail entirely is always possible: any function
answering `Rendered` is accepted where a generated one is.

### Rules carried over from nxgt-janus, without discussion

- **Factoring across packages is forbidden**; a transport depends on
  `@nxgt/mail` as a **required peer** and **defines no error class** — it
  throws the peer's, so `instanceof` holds. The one-class-per-entry-point scan
  in `scripts/verify-artifacts.ts` guards it, from the first commit.
- The repository skeleton (`build.ts`, `scripts/verify-artifacts.ts`,
  `scripts/publish.ts`, the workflows, `bunfig.toml`, the tsconfigs,
  `biome.json`) is **copied from nxgt-janus, never shared** — the fifth copy.
  Change the copies together when the reason holds for all of them.
- **Generated code lives in a `generated/` folder**, never beside the sources
  with a `.generated.ts` or `.gen.ts` suffix (Steve's preference). The build's
  default output is `src/generated/`, one file per concern
  (`src/generated/mail.ts`), and the folder is what a consumer ignores in
  Biome, in coverage and — if they choose — in git.
- **Imports carry no extension**, in sources and in emitted declarations.
  `moduleResolution: nodenext` is not supported.
- `bunfig.toml` carries the npm token, **never `.npmrc`**.
- **A new package starts `"private": true`.** Removing the flag is a
  deliberate commit of its own, with the changeset that versions it.
- `*.spec.ts` colocated in `src/`; `test/` holds helpers; `test/types/` is
  typechecked and never run.
- Settle an expected rejection where it is created, with `.then(ok, ko)`.
- `develop` is the base branch; merge commits only; a changeset for every
  change a consumer can see, docs included.

**One word per idea.** The words are defined once, in a `docs/vocabulary.md`
the first package writes: *e-mail* (not "mail" in prose, not "email"),
*template*, *catalogue*, *message*, *locale*, *preset*, *transport*, *render
function*. A new idea gets a row there before it gets a second name.

## Verifying

```sh
bun install
bun run check        # biome, and the naming convention that holds the casing rule
bun run typecheck    # includes test/types/, which is the type-safety measurement
bun run build
bun run test
bun run verify:artifacts   # on the tarball actually packed
```
