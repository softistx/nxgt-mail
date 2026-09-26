# Troubleshooting `@nxgt/mail`

Each entry is headed by the text you see: a compiler error, a message, or an
error `code`. Search this page for the words of your message.

How the messages are shaped:

- **A message names where the problem is, never the value.** `send: to is
  not an e-mail address` does not print the address; the link in a
  verification e-mail is a credential, and it never reaches a log through an
  error.
- **Every message starts with the call you wrote**: `send: …`,
  `pickLocale: …`, `describeMailer: …`. A conformance case that fails starts
  with `conformance: …`.
- **A `TypeError` is a wiring mistake**: it comes from how the application
  was put together, never from a message being sent. Fix the code; no
  handler should answer one.
- **A `MailError` is a refusal at call time.** It is a `MailFailure`
  (`code: 'MAIL_FAILED'`) or a `MailRefused` (`code: 'MAIL_REFUSED'`), and
  the codes are a union you can `switch` on exhaustively.

## Index

**Install and types**
- [`TS2834: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'.`](#ts2834-relative-import-paths-need-explicit-file-extensions-in-ecmascript-imports-when---moduleresolution-is-node16-or-nodenext)
- [`TS2305: Module '"@nxgt/mail"' has no exported member '<name>'.`](#ts2305-module-nxgtmail-has-no-exported-member-name)
- [`TS2741: Property 'to' is missing in type '…' but required in type 'MailMessage'.`](#ts2741-property-to-is-missing-in-type--but-required-in-type-mailmessage)
- [`TS2741: Property 'text' is missing in type '…' but required in type 'MailMessage'.`](#ts2741-property-text-is-missing-in-type--but-required-in-type-mailmessage)
- [`TS2322: Type '{ name: string; }' is not assignable to type 'Address | readonly Address[]'.`](#ts2322-type--name-string--is-not-assignable-to-type-address--readonly-address)
- [`TS2741: Property 'send' is missing in type '{}' but required in type 'Mailer'.`](#ts2741-property-send-is-missing-in-type--but-required-in-type-mailer)
- [`TS2322: Type 'Promise<boolean>' is not assignable to type 'Promise<SentMail>'.`](#ts2322-type-promiseboolean-is-not-assignable-to-type-promisesentmail)
- [`TS2322: Type 'undefined' is not assignable to type 'string | null'.`](#ts2322-type-undefined-is-not-assignable-to-type-string--null)
- [`TS2345: Argument of type '"de"' is not assignable to parameter of type '"en" | "fr"'.`](#ts2345-argument-of-type-de-is-not-assignable-to-parameter-of-type-en--fr)
- [`TS2322: Type '"MAIL_BOUNCED"' is not assignable to type 'MailErrorCode'.`](#ts2322-type-mail_bounced-is-not-assignable-to-type-mailerrorcode)
- [`TS2511: Cannot create an instance of an abstract class.`](#ts2511-cannot-create-an-instance-of-an-abstract-class)
- [`error instanceof MailFailure` is `false` for an outage](#error-instanceof-mailfailure-is-false-for-an-outage)

**Sending**
- [`MAIL_FAILED` — `MailFailure`: the transport could not hand the message over](#mail_failed--mailfailure-the-transport-could-not-hand-the-message-over)
- [`MAIL_REFUSED` — `MailRefused`: the message was refused as malformed](#mail_refused--mailrefused-the-message-was-refused-as-malformed)
- [`send: the message must be an object`](#send-the-message-must-be-an-object)
- [`send: to must hold at least one address`](#send-to-must-hold-at-least-one-address)
- [`send: <field> is not an e-mail address`](#send-field-is-not-an-e-mail-address)
- [`send: <field>.address is not an e-mail address`](#send-fieldaddress-is-not-an-e-mail-address)
- [`send: <field>.name must be a string without a line break`](#send-fieldname-must-be-a-string-without-a-line-break)
- [`send: <part> must be a string`](#send-part-must-be-a-string)
- [`send: subject must not hold a line break`](#send-subject-must-not-hold-a-line-break)
- [`send: a header name must be letters, digits and hyphens`](#send-a-header-name-must-be-letters-digits-and-hyphens)
- [`send: header <name> must be a string without a line break`](#send-header-name-must-be-a-string-without-a-line-break)
- [`send: the memory mailer was told to fail this send`](#send-the-memory-mailer-was-told-to-fail-this-send)

**Locale**
- [`pickLocale: supported must hold at least one locale`](#picklocale-supported-must-hold-at-least-one-locale)
- [`pickLocale: fallback must be one of supported`](#picklocale-fallback-must-be-one-of-supported)

**Conformance (transport authors)**
- [A transport that translates its failures](#a-transport-that-translates-its-failures)
- [`describeMailer: no test runner found — pass runner: { describe, it } from your test framework`](#describemailer-no-test-runner-found--pass-runner--describe-it--from-your-test-framework)
- [`describeMailer: skip names no case: <id>`](#describemailer-skip-names-no-case-id)
- [`faults not provided: the failure contract is not proven for this transport`](#faults-not-provided-the-failure-contract-is-not-proven-for-this-transport)
- [`conformance: <send> resolved; it must reject`](#conformance-send-resolved-it-must-reject)
- [`conformance: an outage must throw MailFailure from @nxgt/mail`](#conformance-an-outage-must-throw-mailfailure-from-nxgtmail)
- [`conformance: an outage must carry the transport's error as cause`](#conformance-an-outage-must-carry-the-transports-error-as-cause)
- [`conformance: an outage must carry the code MAIL_FAILED`](#conformance-an-outage-must-carry-the-code-mail_failed)
- [`conformance: the transport retried a failed hand-over`](#conformance-the-transport-retried-a-failed-hand-over)
- [`conformance: a name let a second recipient through`](#conformance-a-name-let-a-second-recipient-through)
- [`conformance: <what>, yet something was delivered`](#conformance-what-yet-something-was-delivered)
- [Other `conformance:` messages](#other-conformance-messages)
- [A bug in `@nxgt/mail` itself](#a-bug-in-nxgtmail-itself)

---

## Install and types

### `TS2834: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'.`

**When:** `tsc` on your project, reported inside
`node_modules/@nxgt/mail/dist/*.d.ts`, once per import line.
**Why:** the declarations import their siblings without an extension
(`'./errors'`), the way a bundler resolves them. `moduleResolution:
"nodenext"` (or `"node16"`) demands an extension on every relative import and
is **not supported** by this package.
**Fix:** resolve as a bundler does. Bun, Vite, esbuild and every other
bundler already do:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "module": "preserve",          // or "esnext"
    "moduleResolution": "bundler"
  }
}
```

Do not patch the declarations to add `.js` extensions: that is out of scope,
and a patched copy breaks on the next install.

### `TS2305: Module '"@nxgt/mail"' has no exported member '<name>'.`

**When:** `tsc` on your own file, for an export that exists: typically
`MailFailure`, `pickLocale` or `createMemoryMailer`.
**Why:** the same `moduleResolution: "nodenext"` as above, with
`skipLibCheck: true` hiding the `TS2834` errors in the declarations. The
entry declaration's re-exports do not resolve, so everything they carry is
missing.
**Fix:** `"moduleResolution": "bundler"`, as in the entry above.

### `TS2741: Property 'to' is missing in type '…' but required in type 'MailMessage'.`

**When:** `tsc`, where you build the message you pass to `mailer.send`,
typically by spreading a `Rendered` — what the run-time renderer answers, or
your own function.
**Why:** a `Rendered` holds `subject`, `html` and `text`, and knows nothing of
who it is for. A `MailMessage` is a `Rendered` plus at least `to`.
**Fix:**

```ts
import type { Mailer, Rendered } from '@nxgt/mail';

declare const mailer: Mailer;
declare const rendered: Rendered;

await mailer.send({ ...rendered, to: 'ada@example.com' });
```

### `TS2741: Property 'text' is missing in type '…' but required in type 'MailMessage'.`

**When:** `tsc`, on a message written by hand with an `html` part only.
**Why:** every e-mail carries a plain-text part: some clients show nothing
else, and spam filters score an e-mail without one. The port has no room for
a message without it.
**Fix:** write the text part. The run-time renderer (coming) always answers
one, from the plain text Maizzle builds beside the HTML:

```ts
import type { MailMessage } from '@nxgt/mail';

const message: MailMessage = {
  to: 'ada@example.com',
  subject: 'Your export is ready',
  html: '<p>Your export is ready.</p>',
  text: 'Your export is ready.\n',
};
```

### `TS2322: Type '{ name: string; }' is not assignable to type 'Address | readonly Address[]'.`

**When:** `tsc`, on a recipient written as an object.
**Why:** an `Address` is a bare string, or an object with **both** `name` and
`address`. A name alone does not say where to send.
**Fix:**

```ts
import type { MailMessage, Rendered } from '@nxgt/mail';

declare const rendered: Rendered;

const message: MailMessage = {
  ...rendered,
  to: { name: 'Ada Lovelace', address: 'ada@example.com' },
};
```

### `TS2741: Property 'send' is missing in type '{}' but required in type 'Mailer'.`

**When:** `tsc`, on a transport or a test double typed as `Mailer`.
**Why:** `send` is the whole port.
**Fix:** implement it, or use the memory mailer in a test:

```ts
import { createMemoryMailer, type Mailer } from '@nxgt/mail';

const mailer: Mailer = createMemoryMailer();
```

### `TS2322: Type 'Promise<boolean>' is not assignable to type 'Promise<SentMail>'.`

**When:** `tsc`, on a `send` that answers `true` or `false`.
**Why:** a failure throws; it never answers. A `send` that answers `false`
lets a caller report an e-mail as sent when nothing left, and the port is
typed so that it cannot.
**Fix:** resolve with a `SentMail` once the transport has accepted the
message, and throw otherwise. See
[how a transport translates a failure](#a-transport-that-translates-its-failures).

### `TS2322: Type 'undefined' is not assignable to type 'string | null'.`

**When:** `tsc`, on the `SentMail` a transport answers, when the provider
gave no message id.
**Why:** an absence is `null`, never `undefined`.
**Fix:**

```ts
import type { SentMail } from '@nxgt/mail';

declare const providerId: string | undefined;

const sent: SentMail = { messageId: providerId ?? null };
```

### `TS2345: Argument of type '"de"' is not assignable to parameter of type '"en" | "fr"'.`

**When:** `tsc`, on a `pickLocale` call whose `fallback` is not one of
`supported`.
**Why:** `pickLocale` answers one of `supported`, and the fallback is what it
answers when nothing matches, so it must be one of them. The literal types of
`supported` are what makes the compiler check it.
**Fix:**

```ts
import { pickLocale } from '@nxgt/mail';

const locale = pickLocale('de-AT', ['en', 'fr'], 'en'); // 'en' | 'fr'
```

When `supported` is a `string[]` built at run time, the compiler cannot check
the fallback and the call throws
[`pickLocale: fallback must be one of supported`](#picklocale-fallback-must-be-one-of-supported)
instead.

### `TS2322: Type '"MAIL_BOUNCED"' is not assignable to type 'MailErrorCode'.`

**When:** `tsc`, on a `case` or a comparison with a code this package does
not have.
**Why:** the codes are `MAIL_FAILED` and `MAIL_REFUSED`, nothing else. A
bounce happens after the hand-over, and `send` has already resolved by then.
**Fix:** switch on the two codes; see
[`MAIL_FAILED`](#mail_failed--mailfailure-the-transport-could-not-hand-the-message-over).

### `TS2511: Cannot create an instance of an abstract class.`

**When:** `tsc`, on `new MailError(…)`: typically in a transport, or in a
test double that should fail a send.
**Why:** `MailError` is the abstract base of the two errors a send can throw.
A bare one would pass a check on `code` and fail
`error instanceof MailFailure`, so a caller would handle an outage as an
unknown error.
**Fix:** throw the subclass that says what happened, with the provider's
error as `cause`:

```ts
import { MailFailure, MailRefused } from '@nxgt/mail';

declare const cause: unknown;
declare const providerRefusedTheMessage: boolean;

throw providerRefusedTheMessage
  ? new MailRefused('send: the provider refused the message', { cause })
  : new MailFailure('send: the provider could not be reached', { cause });
```

Keep `MailError` for `catch`: `error instanceof MailError` is true for both.

### `error instanceof MailFailure` is `false` for an outage

**When:** at run time, with a transport from another package or your own. An
outage is then handled as an unknown error.
**Why:** one of two things.

- **The transport defined its own error class**, even one named
  `MailFailure` with `code: 'MAIL_FAILED'`. `instanceof` tests the class, not
  the name. A transport defines no error class; it throws the ones it imports
  from `@nxgt/mail`.
- **Two copies of `@nxgt/mail` are installed**: the transport depends on it
  instead of peering it, or bundled it into its own build. It throws its
  copy's `MailFailure`, and your code tests against the other.

**Fix:** a transport lists `@nxgt/mail` as a peer, never a dependency, and
marks it external in its build:

```jsonc
// the transport's package.json
{
  "peerDependencies": { "@nxgt/mail": "<the range you support>" }
}
```

Then check that only one copy is installed:

```sh
bun pm ls --all | grep @nxgt/mail
```

The conformance suite catches both mistakes: see
[`conformance: an outage must throw MailFailure from @nxgt/mail`](#conformance-an-outage-must-throw-mailfailure-from-nxgtmail).

---

## Sending

Every `send: …` message below is a `MailRefused` with `code: 'MAIL_REFUSED'`,
thrown by `checkMessage` — which every transport calls first, so the refusals
are the same whichever transport is wired. **Nothing was sent**, and sending
the same message again fails again.

### `MAIL_FAILED` — `MailFailure`: the transport could not hand the message over

**When:** `await mailer.send(message)` rejects: a refused connection, a
timeout, a 5xx from the provider, an expired credential. The message is the
transport's; the transport's own error is `error.cause`.
**Why:** the invariant of the port: a failure throws. `send` resolves only
once the transport has accepted the message.
**Fix:** **nothing was sent** — never report it as sent. Retry later, or tell
the user it failed:

```ts
import { MailError, type Mailer, type MailMessage } from '@nxgt/mail';

declare const mailer: Mailer;
declare const message: MailMessage;

try {
  await mailer.send(message);
} catch (error) {
  if (!(error instanceof MailError)) throw error;
  switch (error.code) {
    case 'MAIL_FAILED':
      // Nothing was sent: queue a retry, or tell the user it failed.
      break;
    case 'MAIL_REFUSED':
      // The message itself is wrong: sending it again fails again.
      break;
  }
}
```

Do not retry inside the transport: a retry belongs to the caller, who knows
whether the e-mail is still worth sending.

### `MAIL_REFUSED` — `MailRefused`: the message was refused as malformed

**When:** `await mailer.send(message)` rejects, either with one of the
`send: …` messages below (the message was refused before it left), or with
the transport's message when the provider answered that the message is
malformed.
**Why:** something in the message would break a header or has no valid
recipient. Sending it again unchanged fails again.
**Fix:** read `error.message` for where the problem is, and fix the message;
the entries below cover each one. Handle the code as in the
[`MAIL_FAILED`](#mail_failed--mailfailure-the-transport-could-not-hand-the-message-over)
snippet.

### `send: the message must be an object`

**When:** `send` is called with `null`, `undefined` or a string: typically a
value read from a queue or a JSON body without being checked.
**Why:** a message is an object with `to`, `subject`, `html` and `text`.
**Fix:** pass the message object; when it comes from outside your code,
parse it before you send it.

### `send: to must hold at least one address`

**When:** `send` with `to: []`, or with no `to` at all (`undefined` or
`null`): typically a recipient list filtered down to nothing, or a message
built from an untyped value.
**Why:** an e-mail with no recipient goes nowhere, and a transport that
accepted it would report a send that never happened.
**Fix:** decide before the call what an empty list means for you:

```ts
import type { Mailer, Rendered } from '@nxgt/mail';

declare const mailer: Mailer;
declare const rendered: Rendered;
declare const recipients: string[];

if (recipients.length > 0) {
  await mailer.send({ ...rendered, to: recipients });
}
```

### `send: <field> is not an e-mail address`

`<field>` is `to`, `to[<n>]`, `from` or `replyTo`.

**When:** `send`, with a string that is not a bare address. Most often a
display name written into the string: `'Ada <ada@example.com>'`. Also a
recipient that is `undefined` or `null` inside the list — `to: [undefined]`
answers `send: to[0] is not an e-mail address` — typically a user lookup that
found no one.
**Why:** a string is **only** an address — one `@`, something on each side,
no whitespace and no angle bracket — so no transport ever parses one, and a
name can never smuggle a second address into a header.
**Fix:** put the name in an object:

```ts
import type { MailMessage, Rendered } from '@nxgt/mail';

declare const rendered: Rendered;

const message: MailMessage = {
  ...rendered,
  to: { name: 'Ada Lovelace', address: 'ada@example.com' },
};
```

The check is deliberately loose: whether the mailbox exists is the receiving
server's question.

### `send: <field>.address is not an e-mail address`

**When:** `send`, with an `Address` object whose `address` is missing, not a
string, or not a bare address (`{ name: 'Ada', address: 'Ada <ada@…>' }`).
**Why:** the same rule as the entry above, for the object form.
**Fix:** `address` holds the bare address only; the name goes in `name`.

### `send: <field>.name must be a string without a line break`

**When:** `send`, with an `Address` object whose `name` is missing, not a
string, or holds `\r` or `\n`: typically a name read from a user profile.
**Why:** the name is written into a header, and a line break in a header is a
header injection.
**Fix:** collapse the whitespace of a name you did not write:

```ts
declare const displayName: string;

const name = displayName.replace(/\s+/g, ' ').trim();
```

An empty `name` is accepted; with no name, pass the bare address string.

### `send: <part> must be a string`

`<part>` is `subject`, `html` or `text`.

**When:** `send`, with one of the three parts missing or not a string:
typically a hand-written function that answered `undefined` for its text
part, or a message built from an untyped value.
**Why:** every e-mail has a subject, an HTML part and a text part.
**Fix:** pass the `Rendered` whole — what the renderer answered, or your own
function's, which must answer all three (see the `Rendered` type).

### `send: subject must not hold a line break`

**When:** `send`, with `\r` or `\n` in the subject: typically a subject built
from a value a user typed, such as a name or a title.
**Why:** the subject is a header, and a line break in a header is a header
injection (`'Hello\r\nBcc: …'`).
**Fix:** collapse the whitespace of the value before it reaches the subject:

```ts
declare const title: string;

const subject = `New comment on ${title.replace(/\s+/g, ' ').trim()}`;
```

### `send: a header name must be letters, digits and hyphens`

**When:** `send`, with a key in `headers` that holds a space, a colon, an
underscore or a line break.
**Why:** a header name is written as is before its `:`; anything else breaks
the header, or adds one.
**Fix:**

```ts
import type { MailMessage, Rendered } from '@nxgt/mail';

declare const rendered: Rendered;

const message: MailMessage = {
  ...rendered,
  to: 'ada@example.com',
  headers: { 'List-Unsubscribe': '<https://example.com/unsubscribe>' },
};
```

### `send: header <name> must be a string without a line break`

**When:** `send`, with a header value that is not a string or holds `\r` or
`\n`. The message names the header, never its value.
**Why:** a line break in a header value starts a new header.
**Fix:** pass a single-line string; convert a number with `String(value)`.

### `send: the memory mailer was told to fail this send`

**When:** a test, on a send through `createMemoryMailer()` after
`failNext()`. It is a `MailFailure`, `code: 'MAIL_FAILED'`, with a `cause`
as a real outage has, so code that logs `error.cause` is exercised too.
**Why:** that is what `failNext` is for: proving what your code does when a
send throws. Calls queue — two `failNext()` fail the next two sends — and a
message refused by `checkMessage` does not consume one.
**Fix:** expected in the test that asked for it. When it shows up in the next
test, the mailer is shared between tests: create one per test, or call
`clear()`:

```ts
import { beforeEach } from 'bun:test';
import { createMemoryMailer } from '@nxgt/mail';

const mailer = createMemoryMailer();
beforeEach(() => mailer.clear());
```

---

## Locale

### `pickLocale: supported must hold at least one locale`

A `TypeError`.

**When:** the first `pickLocale` call, with an empty `supported` list:
typically a list read from configuration or from a catalogue folder that is
empty.
**Why:** `pickLocale` answers one of `supported`; with none, it has nothing to
answer. This is a wiring mistake, not something a recipient caused.
**Fix:** pass the locales your e-mails are built in, as literals, so the
compiler also checks the fallback:

```ts
import { pickLocale } from '@nxgt/mail';

const supported = ['en', 'fr'] as const;

declare const storedLocale: string | null;
const locale = pickLocale(storedLocale, supported, 'en');
```

### `pickLocale: fallback must be one of supported`

A `TypeError`.

**When:** the first `pickLocale` call, when `supported` is a `string[]` built
at run time and does not hold `fallback`. With literal types, the same
mistake is a
[compile error](#ts2345-argument-of-type-de-is-not-assignable-to-parameter-of-type-en--fr)
instead.
**Why:** the fallback is what `pickLocale` answers when nothing matches, and
an e-mail can only be rendered in a supported locale.
**Fix:** make the fallback one of the list, or declare the list as literals:

```ts
import { pickLocale } from '@nxgt/mail';

const supported = ['en', 'fr'] as const;

pickLocale('de', supported, 'en'); // 'en'
```

---

## Conformance (transport authors)

These come from `@nxgt/mail/conformance`, which a transport author runs
against their transport. A failing case throws an `Error` whose message
starts with `conformance: `; the test title names the case id
(`failure.outage`, `send.deliversBytes`, …).

### A transport that translates its failures

Most failures below have the same fix: catch what the provider throws or
answers, and throw the `@nxgt/mail` class that says what happened, with the
provider's error as `cause`. Once, and without retrying. The same
transport as in [the transports guide](guide/transports.md#a-transport-over-http),
shortened:

```ts
// http-mailer.ts
import { checkMessage, MailFailure, type Mailer, MailRefused } from '@nxgt/mail';

export function createHttpMailer(options: {
  readonly endpoint: string;
  readonly apiKey: string;
  /** For tests; the global fetch otherwise. */
  readonly fetch?: (url: string, init: RequestInit) => Promise<Response>;
}): Mailer {
  const post = options.fetch ?? ((url, init) => fetch(url, init));
  return {
    async send(message) {
      checkMessage(message);
      let response: Response;
      try {
        response = await post(options.endpoint, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${options.apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify(message),
        });
      } catch (cause) {
        throw new MailFailure('send: the provider could not be reached', { cause });
      }
      const cause = new Error(`the provider answered ${response.status}`);
      if (response.status === 400 || response.status === 422) {
        throw new MailRefused('send: the provider refused the message', { cause });
      }
      if (!response.ok) {
        throw new MailFailure('send: the provider did not accept the message', { cause });
      }
      const body = (await response.json()) as { id?: string };
      return { messageId: body.id ?? null };
    },
  };
}
```

### `describeMailer: no test runner found — pass runner: { describe, it } from your test framework`

A `TypeError`.

**When:** loading the file that calls `describeMailer` without `runner`,
where no global `describe` and `it` exist: under `bun test`, which never puts
them on `globalThis`; under Vitest without `globals: true`; or in a script run
outside a test runner. Jest defines them, unless `injectGlobals` is off.
**Why:** the suite depends on no test runner; without `runner`, it looks for
the globals and finds none.
**Fix:** pass them:

```ts
import { describe, it } from 'bun:test';
import { describeMailer, referenceMailerHarness } from '@nxgt/mail/conformance';

describeMailer({
  name: 'my transport',
  harness: referenceMailerHarness(), // yours: see the harness below
  runner: { describe, it },
});
```

### `describeMailer: skip names no case: <id>`

A `TypeError`.

**When:** loading the test file, when a key of `skip` is not the id of a
case: a typo, or a case that was renamed or removed in a newer version.
**Why:** a skip that matches nothing would hide nothing today and silently
hide a real case the day one gets that name.
**Fix:** use an id from `allMailerCases`, with the reason, which is printed in
the test title:

```ts
import { describe, it } from 'bun:test';
import { describeMailer, referenceMailerHarness } from '@nxgt/mail/conformance';

describeMailer({
  name: 'my transport',
  harness: referenceMailerHarness(),
  runner: { describe, it },
  skip: { 'send.recipients': 'the sandbox delivers to one recipient only' },
});
```

### `faults not provided: the failure contract is not proven for this transport`

**When:** the `failure.*` cases. Either they fail with
`conformance: <id>: faults not provided: … — pass faults: false to describeMailer to skip it on purpose`,
or, with `faults: false`, they are skipped with this reason in their title.
**Why:** the harness's `open()` answered no `faults`, so the suite cannot make
the transport fail the way its provider fails, and the failure contract —
*an outage throws `MailFailure`, nothing is retried* — is not proven. It is
reported, never passed over.
**Fix:** give the harness `faults`, driven by the fake provider the transport
talks to in the test — not by a wrapper that throws in front of the
transport, which would prove the wrapper. With the `fakeProvider()` of
[the transports guide](guide/transports.md#faults--failing-the-way-the-provider-fails),
which answers 503 for an outage and 422 for a refusal:

```ts
import type { MailerHarness } from '@nxgt/mail/conformance';
import { fakeProvider } from './fake-provider'; // the guide's, as is
import { createHttpMailer } from './http-mailer'; // yours

export const harness: MailerHarness = {
  async open() {
    const provider = fakeProvider(); // one per case, never shared
    return {
      mailer: createHttpMailer({
        endpoint: 'https://mail.example.test/send',
        apiKey: 'test',
        fetch: provider.fetch,
      }),
      delivered: async () => provider.delivered(),
      faults: provider.faults,
    };
  },
};
```

Pass `faults: false` only for a transport whose failures truly cannot be
simulated, so the skip is on purpose and visible.

### `conformance: <send> resolved; it must reject`

`<send>` is, for example, `a send during an outage`, `a refused send`,
`a send with no recipient`, `a send with a line break in the subject` or
`a send to something that is not an address`.

**When:** a `failure.*` or `send.refuses*` case.
**Why:** the transport answered where it had to throw: it caught the
provider's error and resolved, perhaps with `{ messageId: null }`, or it did
not call `checkMessage`. A caller then tells a user to check an inbox that
will stay empty.
**Fix:** call `checkMessage(message)` first thing in `send`, and let every
failure reject, as in
[a transport that translates its failures](#a-transport-that-translates-its-failures).
Never catch and log.

### `conformance: an outage must throw MailFailure from @nxgt/mail`

Also `conformance: a refusal must throw MailRefused from @nxgt/mail`.

**When:** `failure.outage` or `failure.refusal`.
**Why:** the transport rejected, but not with the class from its
`@nxgt/mail` peer: it threw the provider's error untranslated, defined its
own class, or bundled its own copy of `@nxgt/mail`. A consumer's
`error instanceof MailFailure` is then `false`; see
[the entry above](#error-instanceof-mailfailure-is-false-for-an-outage).
**Fix:** import `MailFailure` and `MailRefused` from `@nxgt/mail`, declared as
a peer and external in the build, and throw them with the provider's error as
`cause`.

### `conformance: an outage must carry the transport's error as cause`

Also `conformance: a refusal must carry the transport's error as cause`.

**When:** `failure.outage` or `failure.refusal`.
**Why:** the transport threw the right class without `{ cause }`. The
provider's error is what the operator needs to find out what happened; the
`MailError` message is only a shape.
**Fix:**

```ts
import { MailFailure } from '@nxgt/mail';

try {
  await fetch('https://provider.example/send');
} catch (cause) {
  throw new MailFailure('send: the provider could not be reached', { cause });
}
```

### `conformance: an outage must carry the code MAIL_FAILED`

Also `conformance: a refusal must carry the code MAIL_REFUSED` and
`conformance: MailFailure must extend MailError`.

**When:** `failure.outage` or `failure.refusal`, after the `instanceof` check
passed.
**Why:** the error is an instance of the class but its `code` or prototype
was changed — a subclass overriding `code`, or an object patched after
construction.
**Fix:** throw `new MailFailure(…)` or `new MailRefused(…)` as they are; do
not subclass them.

### `conformance: the transport retried a failed hand-over`

Also `conformance: the transport retried a refused message`.

**When:** `failure.outage` or `failure.refusal`: `faults.attempts()` counted
more than one hand-over for one `send`.
**Why:** the transport retries in secret. A retry belongs to the caller, who
knows whether the e-mail is still worth sending; a retry inside the
transport can deliver the same e-mail twice, and hides an outage for as long
as it lasts.
**Fix:** one hand-over per `send`, and throw on failure. If
`attempts()` counts something else — a connection check, an authentication
request — count only the hand-overs of a message.

### `conformance: a name let a second recipient through`

**When:** `send.hostileName`: a recipient whose `name` holds an address, a
comma and a semicolon (`'Ada <mallory@example.test>, "Eve" <eve@example.test>;'`)
was delivered to more than its own `address`.
**Why:** the transport pasted the display name into the `To` header
unquoted, so the receiving server read the name as more recipients. A name is
free text, often typed by a user; quoting it is the transport's job.
**Fix:** hand the provider the address object and let it format the header
(nodemailer, for one, quotes `{ name, address }` itself), or write the name
as an RFC 5322 quoted-string:

```ts
import { type Address, addressOf } from '@nxgt/mail';

function formatAddress(address: Address): string {
  if (typeof address === 'string') return address;
  const name = address.name.replace(/[\\"]/g, '\\$&');
  return name === '' ? addressOf(address) : `"${name}" <${address.address}>`;
}
```

A name outside ASCII also needs RFC 2047 encoding in a raw header; a provider
API that takes the name as its own field does both for you.

### `conformance: <what>, yet something was delivered`

`<what>` is `the message was refused` or `the hand-over failed`.

**When:** a `send.refuses*` or `failure.outage` case: the transport rejected,
but the receiving end got the message anyway.
**Why:** the transport handed the message over and then threw: it validated
after sending, or it reported a failure the provider did not have. A caller
told "not sent" retries, and the e-mail arrives twice.
**Fix:** call `checkMessage(message)` **before** the hand-over, and throw only
for a hand-over that did not succeed.

### Other `conformance:` messages

Each names what the transport did not do, in the case whose id is in the
test title:

| Message | Case | What to fix |
| --- | --- | --- |
| `conformance: send did not answer an object with messageId` | `send.answersSentMail` | resolve with `{ messageId }` |
| `conformance: messageId must be a non-empty string or null` | `send.answersSentMail` | answer `null` when the provider gives no id, never `''` or `undefined` |
| `conformance: expected 1 delivered message, got <n>` | `send.deliversBytes` | one `send`, one message; check `delivered()` reads a fresh receiving end per `open()` |
| `conformance: the subject was not delivered as sent` | `send.deliversBytes` | encode the subject for non-ASCII (accents, an emoji) and do not trim it |
| `conformance: the html part was not delivered as sent` | `send.deliversBytes` | send the HTML as is, UTF-8, no re-encoding of entities |
| `conformance: the text part was not delivered as sent` | `send.deliversBytes` | send the text part as is, line breaks included |
| `conformance: the recipients delivered are not the recipients sent` | `send.recipients` | deliver to every recipient, in order, with `{ name, address }` sent to `address` |
| `conformance: a send with no recipient must throw MailRefused` | `send.refusesNoRecipient` | call `checkMessage` |
| `conformance: a line break in the subject must throw MailRefused` | `send.refusesLineBreakInSubject` | call `checkMessage` |
| `conformance: a malformed address must throw MailRefused` | `send.refusesWithoutTheValue` | call `checkMessage` |
| `conformance: the refusal message holds the refused value` | `send.refusesWithoutTheValue` | name where the problem is, never the value |
| `conformance: the send after a failure was not delivered` | `failure.recovers` | do not leave the transport broken after a failure: reopen the connection on the next send |
| `conformance: faults are required` | a `failure.*` case whose `run` you called yourself | pass `faults` in the context, or go through `runMailerCase`, which skips the case instead |

### A bug in `@nxgt/mail` itself

A `conformance:` failure against `referenceMailerHarness()`, or a `send: …`
refusal of a message this page says is valid, is a bug in this package.
Open an issue on
[`softistx/nxgt-mail`](https://github.com/softistx/nxgt-mail/issues) with the
message, the package version and the smallest message or harness that
reproduces it — with example addresses, never real ones.
