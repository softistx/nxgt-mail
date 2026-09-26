# Vocabulary

One word per idea, the same in every README, guide, error message and
identifier of this repository. A new idea gets a row here before it gets a
second name. The **Not** column lists the words a row replaces, so a search for
either finds it.

## Authoring — what a developer writes

| Word | Means | Not |
| --- | --- | --- |
| **e-mail** | One kind of transactional e-mail an application sends: *the verification e-mail*, *the password-reset e-mail*. Also, in prose, the thing that lands in an inbox | "mail" in prose — kept only in identifiers (`@nxgt/mail`, `Mailer`, `MailFailure`); "email", "mail message" |
| **template** | The one file that lays out an e-mail, for every locale. Its text is keys into the catalogues, never words | "layout" (a layout is what a template is placed in, and comes from a preset); "view"; one template *per language* — there is none |
| **catalogue** | One JSON file of messages for one locale: `messages/fr.json` | "translation file", "dictionary", "bundle", "resources" |
| **message** | In a catalogue: one ICU string under a `camelCase` key, `verifyEmail.title`. When sending: the `MailMessage` handed to `send` — a rendered e-mail, addressed — as in `checkMessage`, `sampleMessage` and the texts `send: the message must be an object`, `the provider refused the message`. The context says which; when both are near, write *the `MailMessage`* | the text of an error (say *the error's `message`*) |
| **locale** | A language tag an e-mail is rendered in: `en`, `fr`, `pt-BR`. **The recipient's**, usually a field of the user, not the language of the request that triggered the send | "language" when a region may matter; "lang" |
| **fallback locale** | The locale used when none of the wanted ones is supported, and the reference every other catalogue is checked against | "default language" |
| **preset** | A package of defaults, as data: theme tokens, layouts, components and shared messages. The build applies a list of them, a later one overriding an earlier one key by key, the application's own files last | "theme" (the tokens are one part of a preset); "plugin" — a preset runs no code |

## Building and rendering

| Word | Means | Not |
| --- | --- | --- |
| **render function** | A function that takes an e-mail's arguments and a locale and answers `Rendered`. The build generates one per e-mail; any hand-written function answering the same shape is accepted where a generated one is | "template function", "renderer" — nothing is rendered by an engine at run time |
| **rendered** | The `Rendered` shape, `{ subject, html, text }`: one e-mail in one locale, every value already substituted and escaped | "compiled", "output" |

## Sending — `@nxgt/mail`

| Word | Means | Not |
| --- | --- | --- |
| **port** | The `Mailer` interface: `send(message: MailMessage): Promise<SentMail>`. The contract every transport implements and every application calls | "adapter interface", "driver" |
| **mailer** | A value that implements the port — what an application calls `send` on. A transport's factory answers one: `createMemoryMailer()` | "client", "sender" (the sender is `from`), "transport" (the transport is the code; the mailer is the value it gives you) |
| **transport** | Code that implements the port on one provider — SMTP, an HTTP API, memory — usually one package each | "provider" (the provider is the service at the other end); "adapter", "driver" |
| **address** | An `Address`: a bare string that is only an address (`ada@example.com`), or `{ name, address }`. A string never carries a display name; a name is free text, refused only with a line break, and quoting it is the transport's job | "`Ada <ada@example.com>`" — refused; "recipient" (a recipient is an address in `to`) |
| **send** | Calling `mailer.send(message)`. It resolves once the transport has handed the e-mail over, and rejects otherwise | "deliver" — see *hand-over* and *delivered* |
| **hand-over** | The moment a transport gives the e-mail to its provider and the provider accepts it. `send` resolves after it; it is what a transport can promise, and all it can promise | "delivery" — a handed-over e-mail can still bounce, which happens after `send` resolved and is not reported by it |
| **refusal** | A no to what was given, with the reason, from the package or a transport. At compile time, a type error (counted in each README); at wiring time, a bare `TypeError`; at call time, `MailRefused` (`MAIL_REFUSED`): the e-mail itself is malformed, and sending it again unchanged fails again | "failure" — a refusal is about the input; "rejection" (a promise rejects with either) |
| **failure** | `MailFailure` (`MAIL_FAILED`): the transport could not hand a well-formed e-mail over — unreachable, timed out, a 5xx, an expired credential. The transport's error is the `cause`; nothing was sent. **A failure throws**: it is never an answer of `false` | "error" for this one case (`MailError` is the base of both); "bounce" |
| **outbox** | The memory mailer's record of what it accepted, `mailer.sent`, oldest first | "inbox" — nothing here receives e-mail; "queue" — nothing waits in it |
| **attempts** | How many sends reached the hand-over, failed ones included. A refused e-mail never reaches it. What proves nothing is retried in secret | "tries", "calls" — a refused send is a call but not an attempt |

## Checking a transport — `@nxgt/mail/conformance`

| Word | Means | Not |
| --- | --- | --- |
| **conformance suite** | The cases every transport must pass, run by `describeMailer`: a send answers `SentMail`, an e-mail is delivered byte for byte, an outage throws `MailFailure` from `@nxgt/mail`, nothing is retried | "test suite" alone (a transport has its own tests beside it); "compliance" |
| **case** | One entry of the conformance suite, as data: an `id` such as `failure.outage`, a title, and a `run` that throws on failure | "test" (a case becomes a test once a runner describes it) |
| **harness** | What a transport author writes for the suite: `open()` answers a fresh mailer, a way to read back what was delivered, optionally faults, and a `close` | "fixture", "setup" |
| **delivered** | What the receiving end of a harness got — the test server, the recorded request, the outbox — read back as `{ to, subject, html, text }` | "sent" (what the mailer was asked to send) |
| **fault** | A failure a harness makes its transport meet **the way its provider fails** — a refused connection or a 5xx for an outage, a "malformed" answer for a refusal — through `MailerFaults` | "mock", "stub" — a fault proves the transport's own translation of the provider's error, not a wrapper that throws in front of it |
| **runner** | The `describe` and `it` of a test framework, handed to `describeMailer` | "framework" |
