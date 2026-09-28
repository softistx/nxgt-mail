# Plan — 1.0

**Status: Done — `1.0.0` cut.** Steve accepted every recommendation below, as
written (the questions at the end record his answers), then decided on
2026-09-28 to cut `1.0.0` without waiting for the first two entry criteria
(see [Entry criteria](#entry-criteria)). This is what `1.0.0` froze, across
all seven published packages, and the rules this repository holds to since.

Read [`AGENTS.md`](../AGENTS.md) and [`docs/plan.md`](./plan.md) first: this
document assumes the invariant (*an absence is `null`, a failure throws*),
the manifest contract, and the casing and layout rules already hold, and
records what changes **on top of them** at the 1.0 boundary.

---

## Why a 1.0 plan now

All seven packages are `0.x`, released and used by `@nxgt/janus-mail`. Two
renames already landed as `@deprecated` aliases scheduled for removal
in 1.0 (`withTelemetry`/`withRendererTelemetry`, PR #77; `RetryOptions`,
PR #80) — 1.0 is no longer a future abstraction, it is where those aliases
actually go away. This is the moment to write down, once, what freezes and
what a consumer can rely on after that.

---

## Scope: what each package freezes at 1.0

For each package: the public surface 1.0 promises to keep (a minor addition
is still allowed; nothing here is removed or renamed without a major), what
is still unstable and should change **before** the freeze, and anything
awkward found while reading it for this plan.

### `@nxgt/mail`

**Surface to freeze** — entry `.`: `sendBatch`; `MailError`/`MailErrorCode`/
`MailErrorOptions`, `MailFailure`, `MailRefused`; the event union
(`MailEvent`, `MailEventType`, `MailBouncedEvent`/`MailBounceType`,
`MailClickedEvent`, `MailComplainedEvent`, `MailDelayedEvent`,
`MailDeliveredEvent`, `MailOpenedEvent`, `MailWebhookErrorCode`,
`MailWebhookRefused`); `parseAcceptLanguage`, `pickLocale`, `WantedLocales`;
`createMemoryMailer`, `MemoryMail`, `MemoryMailer`; `addressOf`,
`checkMessage`, `checkScheduledAt`, `recipientsOf`; `withRetry`,
`MailRetryOptions`, `RetryExhausted`; `MailScheduleErrorCode`,
`MailScheduleRefused`; the port types `Address`, `MailAttachment`,
`MailBatchResult`, `Mailer`, `MailMessage`, `Rendered`, `SentMail`;
`listUnsubscribe`, `ListUnsubscribeOptions`, `ListUnsubscribeHeaders`.
Subpaths `./renderer` (`MANIFEST_FORMAT`, `MailVariables`, `MailEmailsOf<E>`,
`AnyMailEmails`, `RenderArguments<V>`, `MailRendererOptions`,
`RenderOptions`, `MailRenderer<E>`, `createMailRenderer<E>`),
`./conformance` (19 cases — see below — plus `describeMailer`,
`runMailerCase`, `MAILER_SKIP_REASONS`, `checkMailEvent`, `sampleMailEvent`,
`referenceMailerHarness`, the sample builders and harness types), and
`./telemetry` (`withMailTelemetry`, `MailTelemetryOptions`,
`withMailRendererTelemetry`, `MailRendererTelemetryOptions`). **Zero
required dependencies** — frozen as a permanent invariant, not
just today's state.

**19 conformance cases**: 9 in `send` (`answersSentMail`, `deliversBytes`,
`recipients`, `hostileName`, `attachment`, `inlineImage`, `idempotencyKey`,
`tags`, `scheduled`), 5 refusals (`refusesNoRecipient`,
`refusesLineBreakInSubject`, `refusesAddressHeader`,
`refusesAttachmentPath`, `refusesWithoutTheValue`), 3 `failure`
(`outage`, `refusal`, `recovers`), 2 `batch` (`deliversEach`,
`refusalPerMessage`). Manifest format is **1**, unchanged since the format
was introduced (`MANIFEST_FORMAT` in `src/renderer.ts` and, identically, in
`@nxgt/mail-i18n`'s `src/manifest.ts`). Type safety: 31 `@ts-expect-error`
refusals measured in `test/types/refusals.ts`.

**Change before freezing:** drop `withTelemetry`, `withRendererTelemetry` and
`RetryOptions` — the three aliases already marked `@deprecated, removed in
1.0`. Nothing else in this package is marked deprecated or has an open
`TODO`/`FIXME`.

**Awkward:** none found beyond the aliases already known.

### `@nxgt/mail-smtp`

**Surface to freeze:** `createSmtpMailer(options)`, `SmtpMailerOptions`,
`SmtpTransporter`, `SmtpSentInfo`. One entry point (`.`), no subpaths. 6
`@ts-expect-error` refusals measured.

**Change before freezing:** nothing — no deprecated export, no `TODO`.

**Peers today (0.x cascade):** `@nxgt/mail: workspace:^` (publishes as
whatever `^0.N.0` `@nxgt/mail` is at release — currently trending to
`^0.9.0`), `nodemailer: >=7.0.0 <11`, `typescript: ^6.0.3`.

### `@nxgt/mail-resend`

**Surface to freeze:** entry `.` — `createResendMailer(options)`,
`ResendMailerOptions`, `ResendMailer` (`send` from the port, plus
`sendBatch`, `cancel(messageId)`, `reschedule(messageId, scheduledAt)`),
`formatAddress`. Subpath `./webhooks` — `createResendWebhook`,
`ResendWebhookOptions`, `ResendWebhook`, `ResendWebhookRequest`,
`MailWebhookHeaders`. 12 `@ts-expect-error` refusals measured.

**Change before freezing:** nothing marked deprecated or `TODO`.

**Awkward, worth flagging as a known limit rather than fixing:** `cancel`
and `reschedule` map Resend's `404`/`400` to `MailScheduleRefused` codes
`UNKNOWN_ID`/`ALREADY_SENT` from **observed behaviour**, since Resend does
not document what it answers for those cases — a future undocumented change
on Resend's side could silently misclassify. `sendBatch` cannot carry a
per-message `idempotencyKey` or attachments (Resend's own batch endpoint
limit) and sends no `Idempotency-Key` header for the batch request itself, so
retrying a whole `sendBatch` call can duplicate every message that already
went out — already documented in the source and the README, just noted here
since it is exactly the kind of behaviour a 1.0 freeze locks in.

**Peers today:** `@nxgt/mail: workspace:^`, `typescript: ^6.0.3`.

### `@nxgt/mail-config`

**Surface to freeze:** `defineMailConfig(config)`, `defineMailPlugin(plugin)`,
`baseConfig`, `productionConfig(...)`, `MailConfig`, `MailPlugin`,
`breakBlocks`, `tidyPlaintext`. One entry point, no subpaths. 6
`@ts-expect-error` refusals measured.

**Change before freezing:** nothing deprecated, no `TODO`.

**Peers today:** `@maizzle/framework: ^6.1.7`, `@maizzle/tailwindcss: ^1.5.6`,
`typescript: ^6.0.3`. No `@nxgt/mail` dependency at all — this package only
merges Maizzle config.

### `@nxgt/mail-i18n`

**Surface to freeze:** `i18n(options)`, `I18nOptions`, `MANIFEST_FILE`,
`WRAPPERS_DIR`; `emailKey`, `MANIFEST_FORMAT`, `Manifest`, `ManifestEmail`;
`createTranslator`, `LanguageProvider`, `MessageArgs`, `Translate`;
`localeDirection`, `Direction`; the catalogue types `ArgumentKind`,
`Catalogue`, `Catalogues`; the template types `TemplateSource`,
`TemplateArgs`, `TemplateKey`, `TemplateMessages`, `Layout`. One entry point.
20 `@ts-expect-error` refusals measured — the largest count after `@nxgt/mail`
itself, reflecting how much of this package's contract is enforced by
generated types rather than a run-time check.

**Change before freezing:** nothing deprecated, no `TODO`. `MANIFEST_FORMAT`
here and in `@nxgt/mail/renderer` must stay identical constants (already the
rule in `AGENTS.md`); nothing suggests they have drifted.

**Peers today:** `@maizzle/framework: ^6.1.7`, `@nxgt/mail-config:
workspace:^`, `typescript: ^6.0.3`, `vue: ^3.5.0` (optional — `peerDependenciesMeta`
marks it so, since a project without Vue templates still needs the plugin).

### `@nxgt/mail-ui`

**Surface to freeze:** `ui(options)`, `UiOptions`, `Brand`, `UI_CONTEXT`,
`UiContext`, `COMPONENTS_DIR`; `uiCatalogues`; `THEME_FILE`. **62** `Nx*`
Vue components under `components/` (material-vue's mail-relevant surface —
layout, cards, badges, avatars, steps, timeline, hero, hero-adjacent cards,
etc.), each a public prop/slot contract once frozen. `theme.css` — 92 CSS
custom properties (colour, spacing, typography tokens), each a token whose
**default value** is part of the frozen surface at 1.0 (a project can
already override any of them; freezing means the *default* stops moving
silently). 9 `@ts-expect-error` refusals in the package itself, plus the
template-level refusals measured separately in the fixture
(`test/fixture/types/refusals.vue`, per `AGENTS.md`'s "type safety in a
template" rule).

**Change before freezing:** nothing deprecated, no `TODO`. Dark-mode token
work (`color-primary-dark`, `color-muted-dark`, and fixes to
`color-muted-foreground-dark`/`color-paper-dark`) is active in parallel
branches right now (`feat/mail-ui-dark-everywhere`,
`feat/mail-ui-dark-mode`, `feat/mail-ui-primary-dark`,
`fix/mail-ui-primary-dark-tints`) — this plan does not block on it, but a 1.0
freeze of theme tokens should wait until that work has landed and the
roadmap's "Now"/"Next" are empty again, so the frozen defaults are the
settled ones, not a snapshot mid-change.

### `@nxgt/mail-presets`

**Surface to freeze:** `presets(options)`, `PresetsOptions`,
`presetCatalogues`, `PRESETS`, `PresetName`, `Presets`, `TEMPLATES_DIR`.
**13 presets** (`verify-email`, `reset-password`, `password-changed`,
`email-changed`, `account-deleted`, `sign-in-code`, `magic-link`,
`new-sign-in`, `two-factor-enabled`, `two-factor-disabled`, `welcome`,
`invitation`, `invitation-accepted`), each in `en`/`fr`, each with its built
HTML committed under `samples/`. 5 `@ts-expect-error` refusals measured.

**Change before freezing:** nothing deprecated, no `TODO`. **Found while
reading:** the package's own module doc-comment
(`packages/mail-presets/src/index.ts`, top of file) still listed only nine
preset names — stale since the package grew to thirteen. Fixed in this same
PR, alongside the root README and `AGENTS.md`, which had the same stale
count; `packages/mail-presets/README.md` and its `docs/roadmap.md` already
said "thirteen" correctly.

**Peers today:** `@maizzle/framework: ^6.1.7`, `@nxgt/mail-i18n:
workspace:^`, `@nxgt/mail-ui: workspace:^`, `typescript: ^6.0.3`,
`vue: ^3.5.0`.

---

## Policies after 1.0

### What counts as a breaking change

Decided package by package, since "breaking" means something different for
a build-time plugin than for a component library:

| Change | Breaking? |
| --- | --- |
| A renamed, removed or re-typed export, option field, or error `code` | Yes — major |
| A new **required** preset variable (a template that did not need a value now refuses to build without one) | Yes — major |
| A renamed catalogue key (`mail-ui`'s or a preset's) | Yes — major: a project's own override, or its catalogue merge, keys on the old name |
| A new conformance case a passing transport can now fail | Yes — major for `@nxgt/mail` (a transport author's CI can go red on an upgrade with no code change of their own) |
| A theme token **removed or renamed** | Yes — major |
| A theme token's **default value changed** (colour, spacing) with the token itself untouched | No — minor, documented in the changelog and the roadmap's Shipped entry, since a project can already override any token and the component's contract (props/slots) is unchanged |
| Rendered HTML changed **cosmetically** (spacing, colour, attribute order) with no prop, slot or catalogue key touched | No — minor |
| Rendered HTML changed **structurally** (a prop or slot removed, an element a caller's own CSS/tests key off removed) | Yes — major |
| A new manifest format | No — minor, both for `@nxgt/mail` and `@nxgt/mail-i18n` — the manifest contract already guarantees every renderer reads every format up to its own; a project simply needs the peer bump the docs already call for, exactly as within 0.x |
| A new optional export, option field, component, preset or conformance helper | No — minor |
| A bug fix with no surface change | No — patch |

### Deprecation window

Decided: an alias marked `@deprecated` is **never removed before the next
major**. An alias whose own doc comment names the major it goes in is
removed there: the three 0.x aliases (`withTelemetry`,
`withRendererTelemetry`, `RetryOptions`) each said "removed in 1.0", and
went in `1.0.0`. Absent such a note, the rule is "until the next major" —
an alias added in 1.x stays until 2.0.

### Peer ranges after 1.0

Decided: every `workspace:^`-published peer on a `@nxgt/mail*` package
moves from the 0.x cascade to `^1` once the peer itself reaches 1.0 —
`@nxgt/mail-smtp` and `@nxgt/mail-resend`'s `@nxgt/mail` peer, `@nxgt/mail-i18n`'s
`@nxgt/mail-config` peer, `@nxgt/mail-presets`'s `@nxgt/mail-i18n`/`@nxgt/mail-ui`
peers. `@maizzle/framework` (`^6.1.7`), `@maizzle/tailwindcss` (`^1.5.6`) and
`vue` (`^3.5.0`) stay on their own upstream semver, unaffected by this
repository's own 1.0.

### The manifest format policy

Already written in `AGENTS.md` ("The manifest is a contract across
versions") and not changed by this plan: `MANIFEST_FORMAT` bumps only when the
shape changes, a renderer reads every format up to its own forever, and a
newer format than a renderer understands is refused at start-up naming both
numbers. The only addition made here is the semver classification above
— a new format is a **minor**, not a major, of both `@nxgt/mail` and
`@nxgt/mail-i18n`, since nothing existing breaks.

### Node, Bun and Maizzle support ranges

No package declares an `engines` field today; the root `package.json` only
pins `packageManager: bun@1.4.2`, and CI runs Bun only (no Node version
matrix). Decided for 1.0: no `engines` field is added; each README's peers table
names the supported Node floor, Node `>=20` (the active LTS this plan was
written against), even though CI runs Bun only and does not test Node
directly, since `@nxgt/mail`'s runtime-agnostic packages are used from
Node servers today.

**Corrected 2026-09-28**, once CI tested it: Node `>=20` holds for
`@nxgt/mail`, `-smtp` and `-resend`, but not for the four build-time
packages. `maizzle build` runs under Node, and Maizzle 6.1.7's own
dependency `postcss-merge-longhand` 9 requires Node `^22.22.3`, `^24.15.0`
or `>=26` (it calls `Set.prototype.difference`). Their READMEs name that
range, and CI builds the starter at 22.22.3.

Maizzle support stays pinned to `^6.1.7`
(`@maizzle/tailwindcss` `^1.5.6`) until a Maizzle 7 exists to evaluate.

---

## Entry criteria

Required, all of them, before cutting `1.0.0` — as planned. **Steve waived
1 and 2 on 2026-09-28** ("nothing stops us from going to 1.0"): `1.0.0` was
cut without the four weeks of production and before the real-client check,
which he runs on his own schedule; a defect either finds is a 1.x patch.
3 to 6 held at the cut.

1. **`@nxgt/janus-mail` in production for at least four weeks** with no
   rollback attributed to a `@nxgt/mail*` package.
2. **Real-client checks green**: `bun run send-samples` (in flight on
   `chore/send-samples`, not yet merged) run manually against a real SMTP
   and Resend account for every preset, both locales, with the output
   checked by eye.
3. **No open bug**: no unresolved entry in any package's
   `docs/troubleshooting.md` describing a defect rather than expected
   behaviour, and CI green on `develop` at the commit the freeze is cut
   from.
4. **Docs audited**: `documentation-auditor` returns `ok: true` on all seven
   packages in the same pass (not accumulated from older, possibly stale,
   runs).
5. **`mail-ui` theme work settled**: the dark-mode branches above merged and
   the roadmap's "Now"/"Next" empty, so frozen token defaults are the
   settled ones.
6. **The two known deprecated aliases removed in the 1.0 commit itself** —
   not before, since 0.x consumers migrate on their own schedule and a
   pre-1.0 removal would be a second breaking change ahead of the major that
   already carries one.

---

## Decisions (were: open questions for Steve)

Each with a recommended answer. **Steve accepted all five recommendations.**

1. **Is the breaking-change table above right?** In particular: is a
   *cosmetic* rendered-HTML change (spacing, colour) really always a minor,
   or should a preset's e-mail — being what a project's own tests may
   snapshot — get a stricter rule than a component? **Recommended:** keep
   the table as proposed; a project that snapshots rendered HTML is already
   told, in this repository's own docs, that Maizzle's build is not meant to
   be pixel-stable across even a patch (fonts differ per machine, which is
   why `previews/` is never compared in CI).
2. **Deprecation window — "until 2.0" by default, or a fixed number of minor
   releases?** **Recommended:** "until 2.0" — with major versions expected
   to be rare after 1.0, a fixed release count could still land faster than
   the next major and force churn on consumers who have not yet migrated.
3. **Peer ranges — `^1` everywhere, all at once, in the same release that
   cuts 1.0?** **Recommended:** yes — every internal peer moves in the same
   commit, so there is one migration, not a cascade of patches across
   several weeks (unlike the RetryOptions/telemetry renames, which were
   deliberately staged one at a time pre-1.0).
4. **Node floor — `>=20`, or track whatever Bun's own supported minimum
   is instead of naming Node at all, since these packages are "no Node
   built-in" by design?** **Recommended:** name Node `>=20` anyway in each
   README's peers table (not `engines`, since `@nxgt/mail`'s own contract is
   "runs anywhere") — consumers read a README before an `engines` field, and
   `@nxgt/mail-smtp` in particular is only ever run under Node or Bun.
5. **Four weeks of `@nxgt/janus-mail` production is Steve's number to set** —
   is four weeks the right bar, or does Steve want a different measure (a
   count of e-mails sent, rather than time elapsed)? **Recommended:** keep
   time-based (four weeks) — a send count is easy to game with a burst of
   test traffic, whereas elapsed time in production catches issues that only
   show up over real usage (bounce handling, webhook delivery, locale
   fallback in practice).

---

*See [`docs/plan.md`](./plan.md) for the 0.x work this plan builds on.*
