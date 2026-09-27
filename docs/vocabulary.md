# Vocabulary

One word per idea, the same in every README, guide, error message and
identifier of this repository. A new idea gets a row here before it gets a
second name. The **Not** column lists the words a row replaces, so a search for
either finds it.

## Authoring — what a developer writes

| Word | Means | Not |
| --- | --- | --- |
| **project** | A Maizzle 6 project of transactional e-mails — the official starter: `emails/`, `locales/`, `components/`, `public/`, `maizzle.config.ts` — served with `maizzle serve`, built with `maizzle build` | "workspace", "app" (the application is what sends the e-mails) |
| **e-mail** | One kind of transactional e-mail an application sends: *the verification e-mail*, *the password-reset e-mail*. Also, in prose, the thing that lands in an inbox | "mail" in prose — kept only in identifiers (`@nxgt/mail`, `Mailer`, `MailFailure`); "email", "mail message" |
| **template** | The one file that lays out an e-mail, for every locale: `emails/verify-email.vue`. Its text is keys into the catalogues, never words | "layout" (a layout is a component a template is placed in); "view"; one template *per language* — there is none |
| **catalogue** | One JSON file of messages for one locale: `locales/fr.json` | "translation file", "dictionary", "bundle", "resources" |
| **message** | In a catalogue: one ICU string under a `camelCase` key, `verifyEmail.title`, written in a template as `t('verifyEmail.title')`. When sending: the `MailMessage` handed to `send`. The context says which; when both are near, write *the `MailMessage`* | the text of an error (say *the error's `message`*) |
| **argument** | A named value a message writes, `{name}` or `{hours, plural, …}`, passed to `t('key', { name })`. `camelCase`. The fallback locale's message declares them; a translation may leave one out, never add one | "parameter", "param"; "variable" (a variable is filled at send time) |
| **placeholder** | A value only known at send time, written in a template as `placeholder('name')` and kept in the built file as `{{ name }}`, for the renderer to fill. It can be passed as an argument: `t('common.greeting', { name: placeholder('name') })` | "variable" for the mark itself; `{{ name }}` written by hand — Vue would evaluate it |
| **variable** | The value that fills a placeholder at send time: `render('verify-email', { name, link })`. One in an `href` or a `src` must be a URL | "prop", "param", "argument" |
| **subject** | The message `<email>.subject` in the catalogues — `verifyEmail.subject` — required for every e-mail. At send time, each run of line breaks in it becomes a space | "title" (a title is a message the template writes); a subject written in the template — there is none |
| **locale** | A language tag an e-mail is built and sent in: `en`, `fr`, `pt-BR`. **The recipient's**, usually a field of the user, not the language of the request that triggered the send | "language" when a region may matter; "lang" |
| **fallback locale** | The locale used when none of the wanted ones is built, and the reference every other catalogue is checked against: its keys are the keys every locale must hold | "default language", "source locale", "base locale" |
| **component** | A Vue single-file component a template uses as a tag, with no import: one of Maizzle's (`<Button>`), one of `@nxgt/mail-ui`'s (`<NxButton>`), or the project's own in `components/`. The project's replaces a package's of the same name | "partial", "widget", "block"; "template" |
| **layout** | The component a template is placed in, which draws the page around it and imports Tailwind and the theme: `<NxLayout>` | "template"; "wrapper" (a wrapper is what the i18n plugin generates) |
| **theme token** | One named CSS value of the theme, by Tailwind namespace — `color.primary` — written as `--color-primary` in `@theme` and used as a class, `bg-primary` | "variable", "design token" alone |
| **tint** | A theme token that is a colour mixed over the background at a fixed share, flattened to hex: `--color-primary-15`, used as `bg-primary-15`. It stands for `@nxgt/material-vue`'s alpha class `bg-primary/15`, which a mail client would drop, and follows its colour when a project overrides it | "alpha", "opacity", "shade" |
| **brand** | Who sends the e-mails, given to `ui({ brand })`: a name, a URL, a logo. The layout's header and footer show it, and a template reads it as `brand` | "company", "tenant", "sender" (the sender is the `from` address) |
| **preset** | A ready-made e-mail `@nxgt/mail-presets` ships — its template and its messages, as `verify-email` — built by the project with its own brand and theme through `i18n({ templates, catalogues })`. A template of the same name in `emails/` replaces it | "plugin" (a plugin is a partial Maizzle config); "sample" (a sample is a preset's built HTML, kept in the repository); "starter", "default template" |
| **shared message** | A message a package ships for every project, under `common.` — `common.footer.why` — given to `i18n({ catalogues })` and overridden by the project's catalogue key by key | "default message", "built-in translation" |

## Building — in the project

| Word | Means | Not |
| --- | --- | --- |
| **plugin** | What an `@nxgt/mail-*` package gives a project: a partial Maizzle config, listed in `defineMailConfig({ plugins })`. Plugins merge in order, their build hooks chained, the project's own config last | "preset" (a preset is a ready-made e-mail, not a config), "extension", "module" |
| **wrapper** | A file the i18n plugin generates under `.maizzle/emails/`, one per template and locale, so one `maizzle build` builds every locale. Never edited, never committed | "copy", "variant" |
| **build failure** | The build stopping because the catalogues or the templates cannot be right — a message that does not parse, a key missing in a locale, an argument a translation invents, a template calling an unknown key — naming the template, the locale and the key. A mistake in a plugin's own options is a bare `TypeError` instead | *failure* alone, which is `MailFailure` at send time; "warning" — nothing is only reported |
| **manifest** | `dist/mail-manifest.json`, written by the build: each e-mail's placeholders — and which ones sit in an `href` or a `src` — and its subject per locale. What the renderer reads | "index", "metadata" |
| **renderer types** | `generated/mail.ts`, written by the build after the manifest, in the project: `MailEmails`, each e-mail with the variables it takes, for `createMailRenderer<MailEmails>`. Git-ignored, as `dist/` is: a build runs before type-checking | "schema"; a `.d.ts` beside the sources |

## Rendering — at send time

| Word | Means | Not |
| --- | --- | --- |
| **renderer** | What `createMailRenderer` answers: `render(email, variables)` reads the built files and the manifest, fills the placeholders, escaped, and answers `Rendered` | "template engine" — nothing is evaluated; "compiler" |
| **rendered** | The `Rendered` shape, `{ subject, html, text }`: one e-mail in one locale, every variable filled and escaped. Any function answering it is accepted where the renderer's answer is | "compiled", "output" |

## Sending — `@nxgt/mail`

| Word | Means | Not |
| --- | --- | --- |
| **port** | The `Mailer` interface: `send(message: MailMessage): Promise<SentMail>`. The contract every transport implements and every application calls | "adapter interface", "driver" |
| **mailer** | A value that implements the port — what an application calls `send` on. A transport's factory answers one: `createMemoryMailer()` | "client", "sender" (the sender is `from`), "transport" (the transport is the code; the mailer is the value it gives you) |
| **transport** | Code that implements the port on one provider — SMTP, an HTTP API, memory — usually one package each | "provider" (the provider is the service at the other end); "adapter", "driver" |
| **address** | An `Address`: a bare string that is only an address (`ada@example.com`), or `{ name, address }`. A string never carries a display name; a name is free text, refused only with a line break, and quoting it is the transport's job | "`Ada <ada@example.com>`" — refused; "recipient" (a recipient is an address in `to`) |
| **attachment** | A file sent with an e-mail: a `MailAttachment` in `attachments`, its bytes as a `Uint8Array`, its `filename` and its `contentType`. Bytes only — never a path or a URL a transport would read. A large or sensitive file is a signed link in the template instead, not an attachment | "file" alone; "enclosure" |
| **inline image** | An attachment with a `contentId`, which the HTML shows as `<img src="cid:…">` — the `cid:` written in the template, never filled at send time. Every `cid:` the HTML quotes names one attachment's `contentId`, or the send is refused | "embedded image", "CID attachment", "related part"; `cid` as a field name (nodemailer's) |
| **idempotency key** | `idempotencyKey` on a `MailMessage`: a name for one send, derived from what the e-mail is about (`order-42/receipt`), so sending it again delivers it once where the transport can deduplicate — Resend can, SMTP cannot and ignores it | "message id" (what a transport answers); "nonce" (a random value makes every retry new) |
| **send** | Calling `mailer.send(message)`. It resolves once the transport has handed the e-mail over, and rejects otherwise | "deliver" — see *hand-over* and *delivered* |
| **hand-over** | The moment a transport gives the e-mail to its provider and the provider accepts it. `send` resolves after it; it is what a transport can promise, and all it can promise | "delivery" — a handed-over e-mail can still bounce, which happens after `send` resolved and is not reported by it |
| **refusal** | A no to what was given, with the reason, from the package or a transport. At compile time, a type error (counted in each README); at wiring time, a bare `TypeError`; at call time, `MailRefused` (`MAIL_REFUSED`): the e-mail itself is malformed, and sending it again unchanged fails again | "failure" — a refusal is about the input; "rejection" (a promise rejects with either) |
| **failure** | `MailFailure` (`MAIL_FAILED`): the transport could not hand a well-formed e-mail over — unreachable, timed out, a 5xx, an expired credential. The transport's error is the `cause`; nothing is known to have been sent. **A failure throws**: it is never an answer of `false` | "error" for this one case (`MailError` is the base of both); "bounce" |
| **outbox** | The memory mailer's record of what it accepted, `mailer.sent`, oldest first | "inbox" — nothing here receives e-mail; "queue" — nothing waits in it |
| **attempts** | How many sends reached the hand-over, failed ones included. A refused e-mail never reaches it. What proves nothing is retried in secret | "tries", "calls" — a refused send is a call but not an attempt |

## Checking a transport — `@nxgt/mail/conformance`

| Word | Means | Not |
| --- | --- | --- |
| **conformance suite** | The cases every transport must pass, run by `describeMailer`: a send answers `SentMail`, an e-mail is delivered byte for byte, an outage throws `MailFailure` from `@nxgt/mail`, nothing is retried | "test suite" alone (a transport has its own tests beside it); "compliance" |
| **case** | One entry of the conformance suite, as data: an `id` such as `failure.outage`, a title, and a `run` that throws on failure | "test" (a case becomes a test once a runner describes it) |
| **harness** | What a transport author writes for the suite: `open()` answers a fresh mailer, a way to read back what was delivered, optionally faults, and a `close` | "fixture", "setup" |
| **delivered** | What the receiving end of a harness got — the test server, the recorded request, the outbox — read back as `{ to, subject, html, text, attachments }` | "sent" (what the mailer was asked to send) |
| **fault** | A failure a harness makes its transport meet **the way its provider fails** — a refused connection or a 5xx for an outage, a "malformed" answer for a refusal — through `MailerFaults` | "mock", "stub" — a fault proves the transport's own translation of the provider's error, not a wrapper that throws in front of it |
| **runner** | The `describe` and `it` of a test framework, handed to `describeMailer` | "framework" |
