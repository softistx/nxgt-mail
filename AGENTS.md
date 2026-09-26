# AGENTS.md

`nxgt-mail` cuts the boilerplate of a **Maizzle 6 project** of transactional
e-mails, and translates it. A developer keeps a normal Maizzle project — the
official starter: `emails/`, `public/`, `maizzle serve`, `maizzle build` — and
adds three packages: a base config (`@nxgt/mail-config`), shared components and
theme (`@nxgt/mail-ui`), and i18n (`@nxgt/mail-i18n`). One template per
e-mail, its text as keys into ICU catalogues, built once per locale:

```ts
// maizzle.config.ts
export default defineMailConfig({
  plugins: [ui(), i18n({ locales: ['en', 'fr'], fallbackLocale: 'en' })],
});
```

At run time, `@nxgt/mail` fills the values only known at send time into the
built files and hands the result to a transport:

```ts
const mails = createMailRenderer({ dir: 'dist', getLanguage: () => user.locale });
await mailer.send({ to, ...mails.render('verify-email', { name, link }) });
```

It is a **product for people outside this organisation**, like `nxgt-janus`,
and it is where `@nxgt/janus-mail` gets its templates from: janus is its first
consumer, not its audience.

Read this file, then [`docs/plan.md`](./docs/plan.md) — the work, in order,
and why it was rewritten on 2026-09-26 — then each package's own README.

---

## Work with Maizzle, never around it

The first plan compiled templates into TypeScript and lost `maizzle serve`,
Maizzle's config and `v-if` on the way (see the plan). The rule since:

- **A consumer's project is a Maizzle project.** Whatever Maizzle does —
  serving, building, inlining, purging, plain text, its components — is used
  as Maizzle does it. A package adds to a project; it never replaces the
  project's commands or re-implements a Maizzle feature.
- **A package is a plugin: a partial config.** Maizzle has no plugin object
  and keeps one function per build event; `defineMailConfig` merges plugins
  with Maizzle's own rules and **chains** their hooks. A plugin that sets a
  hook directly on a config would silently drop another's.
- **Before building something, check that Maizzle does not already do it**,
  in its source (`@maizzle/framework/dist`) or with a probe, and say which.
- **The user's words beat an inherited plan.** When a plan drifts from what
  Steve asked for, stop and ask before building.

## What this repository replaces

`~/workspace/dev/nxgt-maizzle` is a private Maizzle 5 starter (Tailwind 3, a
verification and a password-reset template, HTML written per e-mail). **It is
replaced, not extended**: nothing is copied from it but what a template needs
to look right, and it is archived once this repository ships its first
release. Maizzle 6 is the version that builds with Tailwind 4.

## What it deliberately does not do

- **One HTML file per language, written by hand.** Rejected as too heavy. One
  template per e-mail; its text is **keys** into catalogues. Building one file
  per locale is the i18n plugin's job.
- **A template engine at run time.** No Handlebars, no MJML, no Maizzle in a
  consumer's server: the run time fills `{{ name }}` placeholders into built
  files, and nothing else.
- **Swallowing a translation failure.** The i18n API is shaped like
  `@nxgt/i18n` (`createTranslator(catalogues, getLanguage)`, `t(key, args)`,
  a language provider), but a missing key or a formatting failure **throws**
  — at build time, where `@nxgt/i18n` would answer the key and an e-mail
  would go out with `{link}` in it.

---

## The inherited invariant

From `nxgt-janus/AGENTS.md`, and before it `nxgt-ory`:

> **An absence is `null`. A failure throws.**

What it means here:

- A transport that could not hand the message over **throws** — never answers
  `false`, never logs and returns.
- A catalogue that does not parse, a key missing in one locale, an argument
  one locale uses and another does not, a template calling an unknown key:
  **the build fails**, naming the template, the locale and the key.
- At send time, a missing variable, an unknown e-mail or locale **throws**.

A refusal at **wiring** time (a bad option passed to a factory or a plugin) is
a bare `TypeError`. A refusal at **call** time is a class with a `code`, the
codes a union of `SCREAMING_SNAKE` literals so a `switch` is exhaustive.

A message reports **a shape, never a value**: never a recipient address, never
a subject, never a link — a link in a verification e-mail is a credential.

---

## Escaping is the renderer's job, not the author's

- A value only known at send time is a **placeholder** in the built file
  (`placeholder('name')` writes `{{ name }}`). The renderer **HTML-escapes**
  it in `html` and leaves it as is in `text`.
- A placeholder in an `href` or a `src` must be filled with an `http:` or
  `https:` URL (or `mailto:` for `href`); anything else is refused at send
  time. The build records which placeholders sit there, in the manifest.
- The subject is a message like any other, translated, and stripped of line
  breaks — a header injection is a line break in a subject.
- `url.base` stays off for links: it would prefix a placeholder.

## No `snake_case`, anywhere

Every key is `camelCase`: options, variables, catalogue keys
(`verifyEmail.title`, not `verify_email.title`), theme tokens. Held by
Biome's `useNamingConvention`, as in `nxgt-janus`. Error codes are data values,
`SCREAMING_SNAKE`, and that is not an exception. A provider's wire format
(Resend's `reply_to`) is written where it is sent, with a comment.

## Type safety is measured, not claimed

As in `nxgt-janus`: **every refusal has a `@ts-expect-error` case in
`test/types/`, and the count is in the README.** A count that goes down is a
visible regression. It also holds the calls that **must keep compiling** — a
refusal that refuses the correct call is a bug.

---

## Layout

A monorepo of small packages, each publishable on its own. See
[`docs/plan.md`](./docs/plan.md) for what each one holds and in which order
they are built.

| Package | Runs | Holds |
| --- | --- | --- |
| `@nxgt/mail` | at run time | The `Mailer` port, the errors, locale selection, a memory mailer, `./conformance` for transports, and the renderer that fills built files. **No dependency** |
| `@nxgt/mail-config` | in the Maizzle project | `defineMailConfig`: the base config, and the plugins merged with their hooks chained |
| `@nxgt/mail-i18n` | in the Maizzle project | The i18n plugin: ICU catalogues, `t()` in templates, one output per locale, the manifest; `createTranslator` |
| `@nxgt/mail-ui` | in the Maizzle project | The `Nx*` components, the theme, the shared messages |
| `@nxgt/mail-smtp`, `@nxgt/mail-resend`, … | at run time | One transport each, implementing the port, passing the conformance suite |

`@nxgt/janus-mail` lives in `nxgt-janus`: a Maizzle project built with these
packages.

**A project overrides by name.** Its `components/NxButton.vue` replaces the
package's `<NxButton>`; its `locales/en.json` overrides a shared message key
by key; a later plugin overrides an earlier one's config key. The packages'
components carry the `Nx` prefix, so Maizzle's own (`<Button>`) stay
available and are never shadowed.

A component is Vue code run at build time, once per locale. A value only
known at send time is a placeholder string there: a component passes it
through untouched, and never branches or computes on it
(`v-if="link.startsWith('https:')"` would be decided on `{{ link }}`).

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
  with a `.generated.ts` or `.gen.ts` suffix (Steve's preference). Files a
  plugin writes for Maizzle (the i18n wrappers) go under `.maizzle/`, which
  the starter already ignores.
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
*template*, *catalogue*, *message*, *locale*, *plugin*, *placeholder*,
*manifest*, *transport*. A new idea gets a row there before it gets a second name.

## Verifying

```sh
bun install
bun run check        # biome, and the naming convention that holds the casing rule
bun run typecheck    # includes test/types/, which is the type-safety measurement
bun run build
bun run test
bun run verify:artifacts   # on the tarball actually packed
```
