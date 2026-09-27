# Observability

`@nxgt/mail/telemetry` traces a `Mailer` and a `MailRenderer`, on
`@opentelemetry/api`. It is its own subpath, imported only where you use it:
`.`, `./renderer` and `./conformance` never import it, so a project that never
imports `./telemetry` never needs `@opentelemetry/api` installed.

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';
import { withRendererTelemetry, withTelemetry } from '@nxgt/mail/telemetry';

const mails = withRendererTelemetry(createMailRenderer({ dir: 'dist' }));
const mailer = withTelemetry(resendMailer, { transport: 'resend' });

await mailer.send({ to, ...mails.render('verify-email', { name, link }) });
```

`@opentelemetry/api` is an **optional peer**. With no SDK installed and
registered, `trace.getTracer()` and `metrics.getMeter()` answer no-op
instruments: every call still reaches the wrapped `Mailer` or `MailRenderer`
unchanged, and nothing is recorded. Register a `TracerProvider` and a
`MeterProvider` (`@opentelemetry/sdk-trace-base`, `@opentelemetry/sdk-metrics`,
or your platform's own) the way you would for anything else instrumented with
`@opentelemetry/api`.

## What is recorded, and what never is

A span or a metric attribute is **a shape, never a value** — the same
invariant `MailError`'s own messages hold ("a message reports a shape, never
a value"):

| Recorded | Never |
| --- | --- |
| the transport's name (`mail.transport`) | an address, a recipient's name |
| the recipient **count** (`mail.recipient_count`) | an address |
| a tag's **name** (`mail.tag_names`, `mail.tag_count`) | a tag's value — a plan, a customer id |
| whether an idempotency key was set (`mail.idempotency_key`) | the key itself |
| whether the send is scheduled (`mail.scheduled`) | the date |
| the e-mail's name, when known (`mail.email`) | the subject, the HTML, the text |
| the outcome (`mail.outcome`) and the error's code (`error.type`) | the attachment's name or bytes, a placeholder's value |

`telemetry.spec.ts` asserts the negative half directly: after a send and a
render whose message and template use an address, a subject and a body word,
none of the three ever occurs in any attribute **or event** either function
writes — checked by substring, not by field name, so a new attribute added
later is covered by the same assertion without being named. This reaches the
exception a failure records too: `span.recordException` is given a name and
the `MailErrorCode`, **never the thrown error's own `message` or `stack`**
— which a hand-rolled `Mailer`, or a third-party transport, may have built
from the address or the subject.

## `withTelemetry(mailer, options)`

Wraps a `Mailer`. Every `send` opens a span **`mail.send`**, kind `CLIENT`.

```ts
export interface MailTelemetryOptions {
	readonly transport: string;
	readonly emailName?: (message: MailMessage) => string | undefined;
}
```

- `transport` is required: `'resend'`, `'smtp'`, whatever you call it. It is
  the one attribute on both the span and the metrics — the only one low
  enough in cardinality to belong on both; the rest sit on the span alone.
- `emailName` is optional. `MailMessage` carries no field naming the e-mail —
  `render`'s first argument never reaches the message it fills — so this is
  the only way `mail.send`'s span gets `mail.email`. A common shape: tag the
  message with the same name you rendered, and read it back —
  `emailName: (message) => message.tags?.email`, paired with
  `mails.render('verify-email', …)` and `tags: { email: 'verify-email', … }`
  on the message you build from it.

### Attributes on `mail.send`

| Attribute | Type | From |
| --- | --- | --- |
| `mail.transport` | string | `options.transport` |
| `mail.recipient_count` | number | `recipientsOf(message).length` |
| `mail.tag_count` | number | the number of keys in `message.tags` |
| `mail.tag_names` | string | the tags' names, joined with `,` |
| `mail.idempotency_key` | boolean | whether `message.idempotencyKey` is set |
| `mail.scheduled` | boolean | whether `message.scheduledAt` is set |
| `mail.email` | string, when known | `options.emailName(message)` |
| `mail.outcome` | `'ok'` \| `'refused'` \| `'failure'` | the result of `mailer.send` |
| `error.type` | string, when not `'ok'` | the `MailErrorCode` thrown |

### Metrics

- `mail.send.duration` — a histogram, milliseconds, attributed with
  `mail.transport` and `mail.outcome`.
- `mail.send.count` — a counter, attributed the same way.

## `withRendererTelemetry(renderer)`

Wraps a `MailRenderer`. Every `render` opens a span **`mail.render`**, kind
`INTERNAL`, with `mail.email` — the e-mail's name, `render`'s first argument,
always known here, unlike at `send`.

`render` is synchronous, and stays so: the span opens and closes within the
one call, so wrapping it never turns `render` into an `async` method — it
still answers `Rendered`, not a `Promise<Rendered>`, and a build's `MailEmails`
still refuses the wrong name or variable at the call, unwrapped.

| Attribute | Type | From |
| --- | --- | --- |
| `mail.email` | string | `render`'s first argument |
| `mail.outcome` | `'ok'` \| `'refused'` \| `'failure'` | the result of `render` |
| `error.type` | string, when not `'ok'` | the `MailErrorCode` thrown |

`mail.render.duration` (a histogram) and `mail.render.count` (a counter),
attributed with `mail.outcome`.

## The outcome rule: a refusal is an answer

As everywhere in this package, a caller's mistake and a transport's failure
are told apart:

- **`MailRefused`** — the message itself, or a URL variable, was refused.
  Sending it again unchanged fails again; it is the caller's to fix, not an
  incident. The span ends **`ok`**, with `mail.outcome: 'refused'` and
  `error.type` set to `'MAIL_REFUSED'`.
- **`MailFailure`**, or anything else thrown — the transport could not hand
  the message over, or `render` hit a build out of step with the code.
  Nothing is known to have been sent. The span ends **`error`**, with
  `mail.outcome: 'failure'`, `error.type` set to `'MAIL_FAILED'` when it
  applies, and the exception recorded (`span.recordException`) — sanitised:
  a name and the `MailErrorCode`, never the thrown error's own `message` or
  `stack`.

Either way, **the error is rethrown unchanged**: `withTelemetry` and
`withRendererTelemetry` only observe. A `catch` written against `MailError`
or a build with `MailEmails` behaves exactly as it would unwrapped.

## Composing with a retry decorator

A retry decorator (`withRetry`) and `withTelemetry` compose in either order;
which one goes outside changes what a span *is*:

**`withTelemetry(withRetry(mailer), { transport })` — recommended.**
`withTelemetry` is the outside layer, so one call to the wrapped `send()` is
one span: its duration covers every attempt the retry made, and its outcome
is the final one — the shape a caller reads a trace for, one span per
business-level send.

**`withRetry(withTelemetry(mailer, { transport }))` — per attempt.** Here
`withTelemetry` wraps the *inner* mailer the retry calls, so each attempt gets
its own `mail.send` span: useful when an individual attempt's failure is worth
seeing on its own and the retry decorator does not trace itself. The cost:
a single `send()` from your code produces several `mail.send` spans, with no
span of their own to sit under, and the counter counts attempts, not sends.

Default to the first order unless you specifically want per-attempt spans.

## Working with no SDK installed

`@opentelemetry/api`'s own no-op tracer and meter make every call here a
no-op too until a real `TracerProvider` and `MeterProvider` are registered:
importing `@nxgt/mail/telemetry` and wrapping a `Mailer` in an application
that has never configured OpenTelemetry costs nothing more than the wrapping
itself. `@opentelemetry/sdk-trace-base`'s `InMemorySpanExporter` and
`@opentelemetry/sdk-metrics`' `InMemoryMetricExporter` are how
`telemetry.spec.ts` observes what a real SDK would export; use the same
packages, or your platform's OTLP exporter, in your own application.
