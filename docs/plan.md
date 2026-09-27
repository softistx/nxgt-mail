# Plan

The work, in the order it lands. Each step is one pull request against
`develop` (sometimes a few), reviewed, CI green on the head that is merged.
Read [`AGENTS.md`](../AGENTS.md) first: this file says *what* and *in which
order*, AGENTS.md says *under which rules*.

A step is done when its **Done when** holds — measured, not asserted.

---

## Why this plan was rewritten (2026-09-26)

The first plan compiled Maizzle templates into TypeScript render functions
(`@nxgt/mail-build`, steps 2–4, merged in PRs #3–#5). That was a compiler
*around* Maizzle: templates were rendered once with placeholders, split, and
turned into code. It lost `maizzle serve`, Maizzle's config and its dev UI,
forbade `v-if` and `v-for`, and needed an HTML scanner of its own.

Steve's request was different: **packages that cut the boilerplate of a
Maizzle project, and i18n shaped like `@nxgt/i18n`** — « des packages liés aux
mails avec maizzle avec support i18n réduisant les boilerplate codes ». So the
plan now starts from a **normal Maizzle 6 project** — the official starter:
`emails/`, `public/`, `maizzle serve`, `maizzle build` — and adds what every
such project repeats. Steve chose this direction on 2026-09-26.

What survives from the first plan:

- `@nxgt/mail` (step 1): the `Mailer` port, the errors, the memory mailer,
  `pickLocale`, the conformance suite. It gains the run-time renderer.
- The ICU catalogue checks of `@nxgt/mail-build` (keys in every locale,
  arguments declared the same way, camelCase keys), moved into
  `@nxgt/mail-i18n`.
- The components, theme and shared messages of `@nxgt/mail-preset`, moved into
  `@nxgt/mail-ui` under a prefix.
- The SMTP and Resend transports (written, paused before their PR).

What goes: `@nxgt/mail-build` — the compiler, the HTML scanner, the generated
module. It was never published.

What the research proved, on Maizzle 6.1.7, before this plan was written:

- A config is a plain object loaded by jiti; `maizzle.config.ts` can import a
  base config from a package. There is **no `extends`**, and a plain merge
  keeps **one** function per build event — two plugins' hooks must be chained.
- There are no environments any more: `maizzle build -c
  maizzle.config.production.ts`.
- `components.source` can point into `node_modules`, with a `prefix`
  (`<NxButton>`); a project's `components/nx-button.vue` then replaces the
  package's, and Maizzle's own `<Button>` stays available.
- A package can ship a Tailwind 4 `@theme`; a layout imports it **in the same
  `<style>` as a literal `@import "@maizzle/tailwindcss"`**, or Maizzle scans
  no source and emits no utility, without a word.
- **One output per locale in one `maizzle build`**: a wrapper per template and
  locale (`.maizzle/i18n/fr/verify-email.vue`) as `content`, and a
  `beforeRender` hook that gives each render its locale's `t`. `maizzle serve`
  shows each locale and reloads on a catalogue change.
- A value only known at send time stays `{{ name }}` through inlining,
  minification and plain text, in text and in `href`. `url.base` would prefix
  it, so it stays off for links.
- Tailwind's import fails silently under an isolated install (Bun workspaces,
  pnpm): `@maizzle/tailwindcss` must be a direct dependency of the project.

---

## The shape of the result

A project is the official Maizzle starter plus three packages:

```text
emails/verify-email.vue      one template per e-mail, every language
locales/en.json, fr.json     ICU catalogues
components/                  the project's own, overriding ours by name
public/                      images
maizzle.config.ts            a few lines
```

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';
import { ui } from '@nxgt/mail-ui';

export default defineMailConfig({
  plugins: [ui({ brand: { primary: '#4f46e5' } }), i18n({ locales: ['en', 'fr'], fallbackLocale: 'en' })],
});
```

```vue
<!-- emails/verify-email.vue -->
<template>
  <NxLayout>
    <NxHeading>{{ t('verifyEmail.title') }}</NxHeading>
    <NxText>{{ t('common.greeting', { name: placeholder('name') }) }}</NxText>
    <NxButton :href="placeholder('link')">{{ t('verifyEmail.action') }}</NxButton>
  </NxLayout>
</template>
```

`maizzle serve` shows `verify-email` in English and in French; `maizzle build`
writes `dist/en/verify-email.html`, `dist/fr/verify-email.html`, their `.txt`,
and `dist/mail-manifest.json` — each e-mail's variables, and its subject per
locale. The application sends:

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist', getLanguage: () => user.locale });
await mailer.send({ to, ...mails.render('verify-email', { name, link }) });
```

---

## Step 0 — The skeleton ✅

Merged in PR #1.

## Step 1 — `@nxgt/mail`, the run-time core ✅

Merged in PR #2: `Rendered`, `MailMessage`, `Mailer`, `MailFailure` and
`MailRefused`, `createMemoryMailer`, `pickLocale`, `./conformance`.

## Step 2 — Clear the ground ✅

Merged in PR #7.

- Remove `packages/mail-build` and `packages/mail-preset` (never published);
  their code stays in git history for the moves below.
- Rewrite `docs/vocabulary.md` for the new words (*project*, *plugin*,
  *placeholder*, *manifest*); drop *render function* and *preset*.

**Done when:** the green bar passes with `@nxgt/mail` alone, and no document
names a removed package except as history.

## Step 3 — `@nxgt/mail-config` ✅

Merged in PR #8. `defineMailConfig({ plugins, ...project })`:

- A base config of one key, `plaintext: true`: `dist/`, `public/` as static
  files and CSS inlined and purged are already Maizzle's defaults, and
  `url.base` is off unless set.
- Plugins are partial configs with a `name`, merged with Maizzle's own rules
  (objects merge, arrays replace) — base, then each plugin in order, then the
  project. Three lists are **joined** instead: `components.source`,
  `vite.plugins` and `vue.plugins`, so two plugins that each bring components
  keep both.
- **Every build event is chained** in that order; a hook that returns a string
  hands it to the next one.
- `defineMailPlugin(plugin)` checks a plugin where a package writes it.
- `productionConfig(config, overrides)` for `maizzle.config.production.ts`:
  the project config, HTML minified, then the overrides. Maizzle has no
  environments; `maizzle build -c maizzle.config.production.ts` loads that
  file alone, so it imports the project config.
- Peers: `@maizzle/framework` and `@maizzle/tailwindcss` — the second one
  because Tailwind's import fails silently when it is not hoisted.

**Done when:** a fixture project built with `maizzle build` shows two plugins'
`beforeRender` hooks both applied, in order; the project's config overrides a
plugin's key; the production config minifies.

## Step 4 — `@nxgt/mail-i18n` ✅

Merged in PR #9. `i18n({ locales, fallbackLocale, dir = 'locales', emails = 'emails', layout = 'nested' })`,
a plugin for `defineMailConfig` (`fallbackLocale` defaults to the first locale):

- Reads `locales/<locale>.json` — nested ICU catalogues, camelCase keys, the
  conventions of `@nxgt/i18n` — and **fails the build** on a missing or
  broken catalogue, a key that is not camelCase, a message that does not
  parse, a key missing in a locale or unknown to the fallback locale, an
  argument a translation invents or types differently (the checks of the old
  `@nxgt/mail-build`).
- Writes one wrapper per template and locale under `.maizzle/i18n/`, only
  when it changed, only on the main thread; `content` points at them; the
  output is `dist/<locale>/<template>.html` (`layout: 'flat'` for
  `dist/<template>.<locale>.html`). A template name is kebab-case.
- In `beforeRender`, gives the template `t`, `locale` and `placeholder`. `t`
  fails the build on an unknown key, an argument left out, one the message
  does not use, or one of the wrong kind — a placeholder where a number is
  expected, or passed to a `select`, which would always choose `other`.
- `placeholder('name')` writes `{{ name }}`, for a value only known at send
  time; it can be passed as an ICU argument of string kind.
- In `afterBuild`, writes `dist/mail-manifest.json`: per e-mail, its
  variables (in the HTML, the text part or the subject), its URL variables —
  those a URL attribute (`href`, `src`, `background`, `poster`, `action`)
  **starts** with, so they decide the scheme; one later in the value, as
  `?token={{ token }}`, is not one — its subject per locale — the message
  `<email>.subject`, required, its arguments kept as placeholders, never a
  number, a date or a `select` — and its files per locale. A file written
  outside the plugin's layout, or an e-mail missing in a locale, fails the
  build.
- `createTranslator(catalogues, getLanguage)` and `t(key, args, language?)`,
  shaped like `@nxgt/i18n`, exported for use outside templates — but a
  missing key, a language with no catalogue or a formatting failure
  **throws**, where `@nxgt/i18n` answers the key.
- Types `t`, `locale` and `placeholder` for templates
  (`ComponentCustomProperties`).
- A watcher regenerates the wrappers when a template is added or removed
  under `maizzle serve`.

**Done when:** a fixture project builds `en` and `fr` from one template, with
a plural and a date; each build failure has a spec with its exact message;
`maizzle serve` lists both locales; the manifest matches a golden file.

## Step 5 — `@nxgt/mail-ui` ✅

Merged in PR #10.

`ui({ brand, theme })`, a plugin for `defineMailConfig`. Steve's direction
(2026-09-26): components faithful to `@nxgt/material-vue`'s styles, mirroring
its components that make sense in an e-mail — its names with the `Nx` prefix,
its `variant`/`color`/`size` props, its tokens — rendered with tables and
inlined styles. No dependency on material-vue.

- **The first set:** `NxLayout` (brand header, card, footer; on Maizzle's
  `Html`/`Head`/`Body`/`Container`, which holds its width in Outlook), `NxTypography`, `NxButton` (on Maizzle's `Button`,
  which pads it for Outlook), `NxLink`, `NxSeparator`, `NxCard` with
  `NxCardHeader`, `NxCardTitle`, `NxCardDescription`, `NxCardContent`,
  `NxCardFooter`, `NxBadge`, `NxAlert`, `NxBanner`, `NxStatusIndicator`,
  `NxSummaryData`, and `NxCode` (a one-time code, e-mail's own). Maizzle's
  `Spacer` stands for the planned `NxSpacer`. A project's
  `components/nx-button.vue` replaces ours.
- **`theme.css`:** material-vue's light tokens, in oklch — Maizzle writes each
  as hex with a `lab()` after it. material-vue's `bg-primary/15` is
  `bg-primary-15`: a `color-mix` in sRGB over the background, flattened to
  hex, because a client drops an alpha. `ui({ theme })` overrides a token by
  name; the tints follow.
- **The shared messages** `common.greeting`, `common.footer.why`,
  `common.footer.ignore`, in `en` and `fr`: `uiCatalogues`, given to
  `i18n({ catalogues: [uiCatalogues] })`, a new option of `@nxgt/mail-i18n`
  that merges package catalogues under the project's, key by key.

**Done when:** the fixture project renders with `ui()` and with one token and
one message overridden ✅; the rendered HTML is checked against caniemail data
for Gmail, Outlook and Apple Mail ✅ (Maizzle's own check, in the build spec)
— and Steve's part, still open: looked at in the real clients.

## Step 5b — `@nxgt/mail-ui`, the second set ✅

The material-vue components that fit an e-mail and are not in the first set,
each a table with inlined styles and material-vue's props: `NxTable` (and its
parts), `NxTimeline`, `NxSteps`/`NxStepsItem`, `NxProgress`, `NxStatCard`,
`NxAvatar`/`NxAvatarGroup`, `NxListTile`, `NxDescription`, `NxEntityHeader`,
`NxSeeAlso`, `NxHero` (no blur, no gradient), `NxChip` (static), and the
metrics cards that are bars and numbers (goal, ratio, compare, breakdown).
Icons are images or characters: an e-mail has no icon font.

**Done when:** each renders in the fixture, is checked by caniemail as in
Step 5, and is documented with its props.

Progress: `NxTable` and its parts, `NxDescription`, `NxListTile`, `NxChip`,
`NxAvatar`/`NxAvatarGroup` ✅ (fixture `gallery.vue`: caniemail reports only
`css-caption-side`, with its `align` fallback, and `html-align`) ✅;
`NxProgress`, `NxSteps`/`NxStepsItem`, `NxTimeline` ✅ (fixture
`sequence.vue`: `html-align` and `html-aria-hidden`); `NxHero`,
`NxEntityHeader`, `NxSeeAlso`, `NxStatCard` and the goal, ratio, compare and
breakdown cards ✅ (fixture `summary.vue`: `html-align` and
`html-aria-hidden`, the arrows being characters hidden from a reader and left
out of the plain text).

## Step 5c — `@nxgt/mail-presets` ✅

Steve's request (2026-09-26): « ajouter mail-presets avec des samples de
templates built », and his choices: a source a project builds with its own
brand and theme, plus the built HTML committed as samples; all four groups of
templates.

- **Nine presets**, each a template of `@nxgt/mail-ui` components and its
  messages in `en` and `fr`: `verify-email`, `reset-password`,
  `password-changed`, `email-changed` (accounts); `sign-in-code`,
  `magic-link` (passwordless); `new-sign-in` (security); `welcome`,
  `invitation` (lifecycle).
- **`presets({ only })`** answers `{ templates, catalogues }` for
  `i18n({ templates, catalogues })`. `@nxgt/mail-i18n` gains `templates`:
  folders of templates under the project's `emails/`, whose template of the
  same name replaces a package's.
- **`samples/`**: every preset built in each locale with the brand `Acme`,
  written by `bun run samples`; the build spec fails when they differ from a
  fresh build.

**Done when:** the fixture builds every preset in `en` and `fr` and matches
`samples/` ✅; `only`, a project template and a project message override ✅;
Maizzle's caniemail check reports only `html-align` for each preset ✅.
Merged in PR #11.

## Step 6 — The run-time renderer, in `@nxgt/mail` ✅

`createMailRenderer({ dir, getLanguage, fallbackLocale })`, still with no
dependency:

- `render(email, variables, { locale? })` answers `Rendered`: the built
  `html` and `text` of that locale, the subject from the manifest, every
  `{{ variable }}` filled.
- Values are HTML-escaped in `html`, left as is in `text`; a variable in an
  `href` or a `src` must be an `http:`/`https:` URL (`mailto:` for `href`); each
  run of line breaks in the subject becomes a space; a missing variable, an unknown e-mail
  or an unknown locale **throws**.
- The language comes from `getLanguage`, as in `@nxgt/i18n` (a Hono handler
  passes `() => c.get('language')`), through `pickLocale`.

**Done when:** specs render the fixture's built output in both locales;
injection specs (a `<script>` name, a `javascript:` link, a line break in a
subject argument) pass. ✅ — `packages/mail/test/built` for the unit specs,
and the presets' real build in `mail-presets`' build spec.

As built: the manifest records which placeholders start a URL attribute, not
which attribute, so `mailto:` is accepted in any URL variable. A value that is
not a safe URL throws `MailRefused` (the message is refused, and would be
again); a missing, unknown or non-text variable, an unknown e-mail or locale
throws a plain `Error` or `TypeError` — a mistake in the calling code. The
manifest and every file are read when the renderer is created, so a missing
build fails at start-up rather than at the first send. The renderer is its own
entry, `@nxgt/mail/renderer`, because it imports `node:fs`: `@nxgt/mail`,
which every transport imports, stays free of Node built-ins.

## Step 6b — A typed renderer ✅

Steve's question (2026-09-26): « Y a-t-il un moyen d'avoir mail.render type
safe ? (templates et data) », and his « OK » to the answer:

- `i18n()` writes, after each build, `generated/mail.ts`: `MailEmails`, each
  e-mail with the variables the manifest records — a URL variable a `string`,
  any other a `string | number`. `rendererTypes` moves it, or `false` turns it
  off. The project commits it, so the code that sends type-checks without a
  build.
- `createMailRenderer<MailEmails>(…)` types `render`: an unknown e-mail, a
  missing or unknown variable, and a number for a URL are compile errors.
  Without the type parameter nothing changes; the run-time checks stay either
  way.

**Done when:** the fixture's build writes the module, spec'd to the character;
each refusal has its `@ts-expect-error` in `packages/mail/test/types/` (13 to
17) and the option's in `packages/mail-i18n/test/types/` (18) ✅.

## Step 7 — Transports

`@nxgt/mail-smtp` (on the consumer's `nodemailer`) and `@nxgt/mail-resend`
(over `fetch`), each passing `describeMailer`: SMTP against a local
`smtp-server`, Resend against a local server answering as Resend does. Written
before the rewrite and paused; they depend only on `@nxgt/mail`.

**Done when:** both pass the conformance suite, and an outage in each ends in
`MailFailure` with `cause`.

## Step 8 — A starter, documentation, the first release

- `examples/starter`: the official Maizzle starter with the three packages —
  the README's snippet, built in CI.
- Each package's README and `docs/` (guides, troubleshooting, roadmap).
- Remove `"private"`, one commit per package, with the changeset at `0.1.0`.

**Done when:** the packages are on npm, and an empty project following the
README serves, builds and renders an e-mail in two languages.

## Step 9 — Handing over to janus

Not in this repository: `@nxgt/janus-mail` in `nxgt-janus`, holding the janus
e-mails (verification, password reset, one-time codes) as a Maizzle project
built with these packages. Then archive `nxgt-maizzle` — Steve decides when.

---

## Open questions — Steve's to answer

- ~~**Visibility.**~~ Answered 2026-09-25: public.
- ~~**Compiler or Maizzle project.**~~ Answered 2026-09-26: a Maizzle project,
  i18n shaped like `@nxgt/i18n`.
- **Which transports first.** SMTP and Resend are written; say if another is
  needed.
- **The default brand.** Neutral (greys and `#2563eb`) is what exists.
- ~~**Typing the renderer.**~~ Answered 2026-09-26: yes — Step 6b.
- **A placeholder inside a URL.** Step 4 records as a URL variable only a
  placeholder a URL attribute starts with (it decides the scheme, so the
  renderer checks it is `http:`/`https:`). One later in the value —
  `https://app.example/verify?token={{ token }}` — is HTML-escaped like any
  other; step 6 could also percent-encode it. Say if a URL should only ever be
  one whole placeholder.
