# Troubleshooting `@nxgt/mail`

Each entry is headed by the text you see: a compiler error, a message, or an
error `code`. Search this page for the words of your message.

How the messages are shaped:

- **A message names where the problem is, never the value.** `send: to is
  not an e-mail address` does not print the address; the link in a
  verification e-mail is a credential, and it never reaches a log through an
  error.
- **Every message starts with the call you wrote**: `send: …`,
  `listUnsubscribe: …`, `createMailRenderer: …`, `render: …`,
  `pickLocale: …`, `describeMailer: …`.
  A conformance case that fails starts with `conformance: …`.
- **A `TypeError` is a wiring mistake**: it comes from how the application
  was put together — or, from `render`, from how the call was written —
  never from what a recipient did. Fix the code; no handler should answer
  one.
- **A plain `Error` from `createMailRenderer` or `render` is a build out of
  step with the code**: a build missing, broken or older than the server, or
  a name or variable the build does not have. It is fixed by rebuilding or
  by fixing the call, never handled.
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
- [`TS2345: Argument of type '"verify-emial"' is not assignable to parameter of type '"sign-in-code" | "verify-email"'.`](#ts2345-argument-of-type-verify-emial-is-not-assignable-to-parameter-of-type-sign-in-code--verify-email)
- [`TS2307: Cannot find module './generated/mail' or its corresponding type declarations.`](#ts2307-cannot-find-module-generatedmail-or-its-corresponding-type-declarations)
- [`TS2322: Type 'string' is not assignable to type 'Uint8Array<ArrayBufferLike>'.`](#ts2322-type-string-is-not-assignable-to-type-uint8arrayarraybufferlike)
- [`TS2353: Object literal may only specify known properties, and 'path' does not exist in type 'MailAttachment'.`](#ts2353-object-literal-may-only-specify-known-properties-and-path-does-not-exist-in-type-mailattachment)
- [`TS2741: Property 'contentType' is missing in type '…' but required in type 'MailAttachment'.`](#ts2741-property-contenttype-is-missing-in-type--but-required-in-type-mailattachment)
- [`TS2740: Type 'MailAttachment' is missing the following properties from type 'readonly MailAttachment[]': length, concat, join, slice, and 26 more.`](#ts2740-type-mailattachment-is-missing-the-following-properties-from-type-readonly-mailattachment-length-concat-join-slice-and-26-more)
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
- [`send: header <name> is reserved — addresses, the subject and the MIME structure are never custom headers`](#send-header-name-is-reserved--addresses-the-subject-and-the-mime-structure-are-never-custom-headers)
- [`send: attachments must be an array`](#send-attachments-must-be-an-array)
- [`send: attachments[<n>] must be an object, as { filename, content, contentType }`](#send-attachmentsn-must-be-an-object-as--filename-content-contenttype-)
- [`send: attachments[<n>].content must be a Uint8Array — the file's bytes, never a path or a URL`](#send-attachmentsncontent-must-be-a-uint8array--the-files-bytes-never-a-path-or-a-url)
- [`send: attachments[<n>].filename must be a file name — not empty, not . or .., without / or \, a line break or a control character`](#send-attachmentsnfilename-must-be-a-file-name--not-empty-not--or--without--or--a-line-break-or-a-control-character)
- [`send: attachments[<n>].contentType must be a file's type/subtype, as application/pdf — never multipart/* or message/*`](#send-attachmentsncontenttype-must-be-a-files-typesubtype-as-applicationpdf--never-multipart-or-message)
- [`send: attachments[<n>].contentId must be 1 to 127 letters, digits and . _ ~ + -, with at most one @, as logo@acme.test`](#send-attachmentsncontentid-must-be-1-to-127-letters-digits-and--_-----with-at-most-one--as-logoacmetest)
- [`send: attachments[<n>].contentId is already another attachment's — a contentId names one file`](#send-attachmentsncontentid-is-already-another-attachments--a-contentid-names-one-file)
- [`send: html shows a cid: URL that no attachment's contentId names — attach the image with that contentId`](#send-html-shows-a-cid-url-that-no-attachments-contentid-names--attach-the-image-with-that-contentid)
- [`send: tags must be an object of names to values, as { category: 'receipt' }`](#send-tags-must-be-an-object-of-names-to-values-as--category-receipt-)
- [`send: a tag name must be 1 to 256 ASCII letters, digits, _ or -`](#send-a-tag-name-must-be-1-to-256-ascii-letters-digits-_-or--)
- [`send: tag <name> must be 1 to 256 ASCII letters, digits, _ or -`](#send-tag-name-must-be-1-to-256-ascii-letters-digits-_-or--)
- [`send: idempotencyKey must be 1 to 256 visible ASCII characters, as order-42/receipt`](#send-idempotencykey-must-be-1-to-256-visible-ascii-characters-as-order-42receipt)
- [`send: idempotencyKey was already used for a different message — a key names one e-mail`](#send-idempotencykey-was-already-used-for-a-different-message--a-key-names-one-e-mail)
- [An e-mail is delivered twice although it has an `idempotencyKey`](#an-e-mail-is-delivered-twice-although-it-has-an-idempotencykey)
- [`send: scheduledAt must be a valid Date`](#send-scheduledat-must-be-a-valid-date)
- [`send: scheduledAt is in the past`](#send-scheduledat-is-in-the-past)
- [`send: scheduledAt is more than 30 days ahead — Resend's own limit`](#send-scheduledat-is-more-than-30-days-ahead--resends-own-limit)
- [`send: scheduledAt is not supported — SMTP has no way to schedule a send, and sending it now would be wrong`](#send-scheduledat-is-not-supported--smtp-has-no-way-to-schedule-a-send-and-sending-it-now-would-be-wrong)
- [`send: the memory mailer was told to fail this send`](#send-the-memory-mailer-was-told-to-fail-this-send)

**Batch sending**
- [`sendBatch: mailer must be a Mailer, as { send }`](#sendbatch-mailer-must-be-a-mailer-as--send-)
- [`sendBatch: messages must be an array of MailMessage`](#sendbatch-messages-must-be-an-array-of-mailmessage)

**Retrying**
- [`withRetry: mailer must be a Mailer, as { send }`](#withretry-mailer-must-be-a-mailer-as--send-)
- [`withRetry: options must be an object, as { attempts }`](#withretry-options-must-be-an-object-as--attempts-)
- [`withRetry: attempts must be a positive integer`](#withretry-attempts-must-be-a-positive-integer)
- [`withRetry: baseDelayMs must be a non-negative integer` / `withRetry: maxDelayMs must be a non-negative integer`](#withretry-basedelayms-must-be-a-non-negative-integer--withretry-maxdelayms-must-be-a-non-negative-integer)
- [`withRetry: maxDelayMs must be at least baseDelayMs`](#withretry-maxdelayms-must-be-at-least-basedelayms)
- [`withRetry: signal must be an AbortSignal`](#withretry-signal-must-be-an-abortsignal)

**Unsubscribe**
- [`listUnsubscribe: url must be an https:// URL in printable ASCII, without credentials, <, >, quotes or a raw comma`](#listunsubscribe-url-must-be-an-https-url-in-printable-ascii-without-credentials---quotes-or-a-raw-comma)
- [`listUnsubscribe: mailto must be a bare e-mail address, as unsubscribe@example.com`](#listunsubscribe-mailto-must-be-a-bare-e-mail-address-as-unsubscribeexamplecom)
- [`listUnsubscribe: options must be an object, as { url }`](#listunsubscribe-options-must-be-an-object-as--url-)
- [`listUnsubscribe: url must be a string`](#listunsubscribe-url-must-be-a-string)
- [`listUnsubscribe: mailto must be a string`](#listunsubscribe-mailto-must-be-a-string)
- [Gmail shows no unsubscribe button](#gmail-shows-no-unsubscribe-button)

**Locale**
- [`pickLocale: supported must hold at least one locale`](#picklocale-supported-must-hold-at-least-one-locale)
- [`pickLocale: fallback must be one of supported`](#picklocale-fallback-must-be-one-of-supported)

**Creating the renderer**
- [`createMailRenderer: options must be an object, as { dir: 'dist' }`](#createmailrenderer-options-must-be-an-object-as--dir-dist-)
- [`createMailRenderer: dir must be the folder maizzle build wrote, as dist`](#createmailrenderer-dir-must-be-the-folder-maizzle-build-wrote-as-dist)
- [`createMailRenderer: getLanguage must be a function that answers the wanted locales, as () => user.locale`](#createmailrenderer-getlanguage-must-be-a-function-that-answers-the-wanted-locales-as---userlocale)
- [`createMailRenderer: fallbackLocale must be one of the build's locales, <locales>`](#createmailrenderer-fallbacklocale-must-be-one-of-the-builds-locales-locales)
- [`createMailRenderer: <dir>/mail-manifest.json cannot be read — run maizzle build, and deploy its output folder`](#createmailrenderer-dirmail-manifestjson-cannot-be-read--run-maizzle-build-and-deploy-its-output-folder)
- [`createMailRenderer: <dir>/<locale>/<email>.html cannot be read — run maizzle build, and deploy its output folder`](#createmailrenderer-dirlocaleemailhtml-cannot-be-read--run-maizzle-build-and-deploy-its-output-folder)
- [`createMailRenderer: <dir>/mail-manifest.json is not valid JSON`](#createmailrenderer-dirmail-manifestjson-is-not-valid-json)
- [`createMailRenderer: <dir>/mail-manifest.json is not a manifest of @nxgt/mail-i18n — build with its i18n() plugin`](#createmailrenderer-dirmail-manifestjson-is-not-a-manifest-of-nxgtmail-i18n--build-with-its-i18n-plugin)
- [`createMailRenderer: <dir>/mail-manifest.json is manifest format <format>, newer than this @nxgt/mail reads (<newest>) — upgrade @nxgt/mail`](#createmailrenderer-dirmail-manifestjson-is-manifest-format-format-newer-than-this-nxgtmail-reads-newest--upgrade-nxgtmail)
- [`createMailRenderer: mail-manifest.json describes <email> in a shape its format does not have — it was changed after the build; run maizzle build again`](#createmailrenderer-mail-manifestjson-describes-email-in-a-shape-its-format-does-not-have--it-was-changed-after-the-build-run-maizzle-build-again)
- [`createMailRenderer: <email> has no text part in <locale> — keep Maizzle's plaintext on, as @nxgt/mail-config sets it`](#createmailrenderer-email-has-no-text-part-in-locale--keep-maizzles-plaintext-on-as-nxgtmail-config-sets-it)
- [`Could not resolve "node:fs"`, or `No such module "node:fs"`, on an edge runtime](#could-not-resolve-nodefs-or-no-such-module-nodefs-on-an-edge-runtime)

**Rendering**
- [`render: <email> is not an e-mail of the build — one of <emails>`](#render-email-is-not-an-e-mail-of-the-build--one-of-emails)
- [`render: the locale asked for is not one of the build's, <locales>`](#render-the-locale-asked-for-is-not-one-of-the-builds-locales)
- [`render: the variables of <email> must be an object, as { name: 'Ada' }`](#render-the-variables-of-email-must-be-an-object-as--name-ada-)
- [`render: <email> has no variable <key> — it takes <variables>`](#render-email-has-no-variable-key--it-takes-variables)
- [`render: <email> needs the variable <key>`](#render-email-needs-the-variable-key)
- [`render: <email>: <key> must be a string or a finite number`](#render-email-key-must-be-a-string-or-a-finite-number)
- [`render: <email>: <key> must be an http:, https: or mailto: URL`](#render-email-key-must-be-an-http-https-or-mailto-url)
- [A link breaks when its value holds `&`, `+`, `#` or `/`: `?token={{ token }}` is not percent-encoded](#a-link-breaks-when-its-value-holds----or--token-token--is-not-percent-encoded)

**Observability**
- [`Cannot find package '@opentelemetry/api'`, or `Cannot find module '@opentelemetry/api'`](#cannot-find-package-opentelemetryapi-or-cannot-find-module-opentelemetryapi)
- [A `mail.send` or `mail.render` span never appears, with `@opentelemetry/api` installed](#a-mailsend-or-mailrender-span-never-appears-with-opentelemetryapi-installed)

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
- [`conformance: the harness's delivered() reads back no attachments — read them from the receiving end, or skip send.attachment with the reason`](#conformance-the-harnesss-delivered-reads-back-no-attachments--read-them-from-the-receiving-end-or-skip-sendattachment-with-the-reason)
- [`conformance: the inline image was not delivered with its content id — the HTML shows a broken image`](#conformance-the-inline-image-was-not-delivered-with-its-content-id--the-html-shows-a-broken-image)
- [`conformance: expected 1 delivered attachment, got <n>`](#conformance-expected-1-delivered-attachment-got-n)
- [`conformance: the attachment was not delivered byte for byte`](#conformance-the-attachment-was-not-delivered-byte-for-byte)
- [Other `conformance:` messages](#other-conformance-messages)
- [`checkMailEvent` refusals](#checkmailevent-refusals)
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

The other cause: `createMailRenderer`, `MailRenderer`, `MailRendererOptions`,
`RenderOptions` or `MailVariables` imported from `@nxgt/mail`. The renderer is
its own entry, since it reads files with `node:fs`:

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';
```

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
**Fix:** write the text part. The run-time renderer (`@nxgt/mail/renderer`)
always answers one, from the plain text Maizzle builds beside the HTML:

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

### `TS2345: Argument of type '"verify-emial"' is not assignable to parameter of type '"sign-in-code" | "verify-email"'.`

Or, on the variables of the same call:
`TS2353: Object literal may only specify known properties, and 'name' does not exist in type '{ readonly code: string | number; }'.`,
`Property 'name' is missing in type '{ link: string; }' but required in type …`,
`TS2554: Expected 2-3 arguments, but got 1.`, or
`TS2322: Type 'number' is not assignable to type 'string'.`

**When:** `tsc`, on a `render` call of a renderer created as
`createMailRenderer<MailEmails>(…)`, typically after a template was renamed,
or a placeholder added, renamed or removed.
**Why:** `MailEmails` lists the e-mails of the last build and the variables
each takes; `render` is typed from it. The call names an e-mail or a variable
that build does not have, leaves one out, or passes a number to a URL
variable, which is a string. Untyped, the same call would throw at run time:
[`render: <email> is not an e-mail of the build`](#render-email-is-not-an-e-mail-of-the-build--one-of-emails),
[`needs the variable`](#render-email-needs-the-variable-key) or
[`has no variable`](#render-email-has-no-variable-key--it-takes-variables).
**Fix:** a typo is fixed in the call. When the templates changed, rebuild, so
that `generated/mail.ts` describes them, then fix the calls `tsc` still
reports:

```sh
bunx maizzle build   # rewrites dist/ and generated/mail.ts, both git-ignored
```

Never edit `generated/mail.ts` by hand to silence the error: the next build
rewrites it, and the deployed build is what `render` checks at run time.

### `TS2307: Cannot find module './generated/mail' or its corresponding type declarations.`

**When:** `tsc`, on `import type { MailEmails } from './generated/mail'`, in a
fresh clone or a new project.
**Why:** `generated/mail.ts` is written by `@nxgt/mail-i18n` at the end of
`maizzle build`, in the Maizzle project, unless its `rendererTypes` option
moved it or turned it off (`false`). It is git-ignored, as `dist/` is, so it
is not there until the first build — or the import points at another folder.
**Fix:** build before type-checking, in the script CI runs too, and import it
from where `rendererTypes` writes it:

```json
{
  "scripts": {
    "typecheck": "maizzle build && tsc --noEmit"
  }
}
```

To go without it, leave the type parameter out:
`createMailRenderer({ dir: 'dist' })` takes any name and any
`MailVariables`, checked at run time only.

### `TS2322: Type 'string' is not assignable to type 'Uint8Array<ArrayBufferLike>'.`

**When:** `tsc`, on an attachment whose `content` is text:
`{ filename: 'notes.txt', content: 'notes', contentType: 'text/plain' }`.
**Why:** an attachment is bytes. A string would be sent in whatever encoding
the transport picked; bytes are sent as they are.
**Fix:** encode the text yourself, in the encoding you mean:

```ts
import type { MailAttachment } from '@nxgt/mail';

declare const csv: string;

const report: MailAttachment = {
  filename: 'report.csv',
  content: new TextEncoder().encode(csv), // UTF-8
  contentType: 'text/csv',
};
```

### `TS2353: Object literal may only specify known properties, and 'path' does not exist in type 'MailAttachment'.`

**When:** `tsc`, on an attachment written as nodemailer's, with a `path` (or
an `href`) for the transport to read.
**Why:** no transport reads a file or fetches a URL to attach it — a value
from outside could then make an e-mail carry any file the server can read.
`MailAttachment` holds the bytes.
**Fix:** read the file where your code decides which files may be read, and
pass its bytes:

```ts
import { readFile } from 'node:fs/promises';
import type { MailAttachment } from '@nxgt/mail';

const invoice: MailAttachment = {
  filename: 'invoice-42.pdf',
  content: await readFile('/srv/invoices/42.pdf'),
  contentType: 'application/pdf',
};
```

A file too large to hold in memory is too large for an e-mail: send a signed
link instead — [Sending — attachments](guide/sending.md#attachments).

### `TS2741: Property 'contentType' is missing in type '…' but required in type 'MailAttachment'.`

**When:** `tsc`, on an attachment without its `contentType`.
**Why:** nothing guesses the type from the file name: a guess can be wrong,
and a mail client opens a file by its type.
**Fix:** name it — `application/pdf`, `text/calendar`, `image/png`, or
`application/octet-stream` for bytes of no particular type.

### `TS2740: Type 'MailAttachment' is missing the following properties from type 'readonly MailAttachment[]': length, concat, join, slice, and 26 more.`

**When:** `tsc`, on `attachments: invoice` — one attachment, not in a list.
**Why:** `attachments` is a list, even of one.
**Fix:** `attachments: [invoice]`.

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
**Fix:** **nothing is known to have been sent** — never report it as sent.
After a timeout or a dropped connection the provider may have taken it all
the same, so a retry can deliver it twice; weigh that, then retry later, or
tell the user it failed:

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
      // Nothing is known to have been sent: queue a retry, or tell the user it failed.
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
malformed or too large.
**Why:** something in the message would break a header, has no valid
recipient, is an attachment that is not bytes or is badly named, or is an
`idempotencyKey` that is malformed or already used for a different message
(the memory mailer's refusal, or Resend's `409 invalid_idempotent_request`) —
or the whole message is over the provider's size limit. Sending it again
unchanged fails again.
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
Also a string holding a `,`, a `;` or a `:` — `'root,ada@example.com'`,
`'group:ada@example.com'` — often addresses joined into one string.
**Why:** a string is **only** an address — one `@`, something on each side,
no whitespace, no angle bracket, no `,` `;` or `:` — so no transport ever
parses one, and a string can never smuggle a second address in: a provider
parsing `'root,ada@example.com'` would send to two mailboxes, or to `ada`
alone. Pass several recipients as a list, `to: ['a@example.com', 'b@example.com']`.
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

### `send: header <name> is reserved — addresses, the subject and the MIME structure are never custom headers`

**When:** `send`, with a key in `headers` that names what the transport
writes from the message: `To`, `Cc`, `Bcc`, `From`, `Sender`, `Reply-To`,
`Return-Path`, `Subject`, `MIME-Version` or any `Content-*` — in any case,
`bcc` as well as `Bcc`. The message names the header, never its value.
**Why:** a header set there bypasses every check on the message. A `Bcc`
reaches an SMTP envelope as a recipient no address check saw, a second `To`
or `From` contradicts the one the transport writes, and a `Content-Type`
changes how the parts are read.
**Fix:** use the message's own fields — `to` (a list for several
recipients), `from`, `replyTo`, `subject` — and send a separate e-mail to a
recipient who must not appear to the others:

```ts
import type { Mailer, Rendered } from '@nxgt/mail';

declare const mailer: Mailer;
declare const rendered: Rendered;

// ✗ headers: { Bcc: 'audit@example.com' }
await mailer.send({ ...rendered, to: 'ada@example.com' });
await mailer.send({ ...rendered, to: 'audit@example.com' }); // ✓ the copy, on its own
```

### `send: attachments must be an array`

**When:** `send`, with `attachments` that is not a list — one attachment on
its own, or `null`.
**Why:** the attachments are a list, in order, even of one.
**Fix:** `attachments: [invoice]`; leave the field out, or pass `[]`, for none.

### `send: attachments[<n>] must be an object, as { filename, content, contentType }`

**When:** `send`, with an entry of `attachments` that is not an object —
`undefined` from a lookup that found nothing, `null`, or a hole in the list
(`[, pdf]`, `new Array(2)`). `<n>` is its index.
**Why:** each entry is one file: its name, its bytes and its type.
**Fix:** filter the list before sending, or refuse to send when a file you
meant to attach is missing — an e-mail that says "attached" with nothing
attached is worse than an error.

### `send: attachments[<n>].content must be a Uint8Array — the file's bytes, never a path or a URL`

**When:** `send`, with an attachment whose `content` is not a `Uint8Array`:
a string, an `ArrayBuffer`, a stream, or no `content` at all because the
attachment was written with a `path` or an `href`, as nodemailer takes them.
A Node `Buffer` is a `Uint8Array`, and accepted.
**Why:** an attachment is bytes the application already holds. No
transport reads a file or fetches a URL to attach it, so a value from outside
can never make an e-mail carry a file it should not.
**Fix:** read or convert it first:

```ts
import { readFile } from 'node:fs/promises';

declare const csv: string;
declare const response: Response;

const fromDisk = await readFile('/srv/invoices/42.pdf'); // a Buffer
const fromText = new TextEncoder().encode(csv);
const fromFetch = new Uint8Array(await response.arrayBuffer());
const fromArrayBuffer = new Uint8Array(new ArrayBuffer(8));
```

A file too large to read into memory is too large for an e-mail: send a
signed link instead.

### `send: attachments[<n>].filename must be a file name — not empty, not . or .., without / or \, a line break or a control character`

**When:** `send`, with an attachment whose `filename` is empty, is not a
string, is `.` or `..`, or holds `/`, `\`, a line break (U+2028 and U+2029
included), a NUL or another control character, or a format character such
as a right-to-left override.
The message never holds the name.
**Why:** the recipient's mail client shows the name and saves the file under
it. A path — `../…`, `invoices/42.pdf`, `C:\…`, `..` — asks it to save
elsewhere, a line break or a control character can split the header the name
is written in, and a right-to-left override shows `invoice\u202Efdp.exe` as
`invoiceexe.pdf`.
**Fix:** a bare file name. Accents, spaces and parentheses are fine — the
transport encodes them. From a name you did not write, keep the last segment
of the path and drop the control characters:

```ts
const safeName = (name: string) =>
  name.split(/[\\/]/).pop()?.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, '').trim().replace(/^\.\.?$/, '') ||
  'attachment';

safeName('../uploads/Relevé\nmars.pdf'); // 'Relevémars.pdf'
```

### `send: attachments[<n>].contentType must be a file's type/subtype, as application/pdf — never multipart/* or message/*`

**When:** `send`, with an attachment whose `contentType` is not a bare
`type/subtype`: an extension (`pdf`), a type with parameters
(`text/plain; charset=utf-8`), a space or a line break — or a MIME container,
`multipart/*` or `message/*`, in any case.
**Why:** the type is written into the attachment's `Content-Type` header; a
parameter there is a second, unchecked place for a name or a charset. The
transport writes the parameters it needs. A container is not a file: SMTP
writes `message/rfc822` and `multipart/mixed` unencoded, as parts of the
message itself, and the recipient gets no attachment while `send` resolves.
To forward an e-mail, attach it as `application/octet-stream` with a `.eml`
name.
**Fix:** the bare type — `text/plain`, and encode the text as UTF-8, which is
what a mail client assumes:

```ts
import type { MailAttachment } from '@nxgt/mail';

const notes: MailAttachment = {
  filename: 'notes.txt',
  content: new TextEncoder().encode('Hello'),
  contentType: 'text/plain',
};
```

### `send: attachments[<n>].contentId must be 1 to 127 letters, digits and . _ ~ + -, with at most one @, as logo@acme.test`

**When:** `send`, with an attachment whose `contentId` is empty, not a
string, longer than 127 characters, or holds anything but letters, digits,
`.` `_` `~` `+` `-` and one `@` between two runs of them — typically the id
written with its angle brackets (`<logo@acme.test>`), a space, a second `@`,
a `%` escape, or an accent.
**Why:** the id is written into the attachment's `Content-ID` header and read
back from the HTML's `cid:` URL. Restricted to what a URL takes as is, the
`cid:` URL is the id as written — nothing to percent-encode, nothing a header
must quote — and every provider takes it: Resend wants fewer than 128
characters. The transport adds the angle brackets.
**Fix:** write the id bare, and the same in the HTML:

```ts
import type { MailAttachment } from '@nxgt/mail';

declare const png: Uint8Array;

// <img src="cid:logo@acme.test"> in the template
const logo: MailAttachment = {
  filename: 'logo.png',
  content: png,
  contentType: 'image/png',
  contentId: 'logo@acme.test', // not '<logo@acme.test>'
};
```

### `send: attachments[<n>].contentId is already another attachment's — a contentId names one file`

**When:** `send`, with two attachments under the same `contentId` — often
the same image attached twice, by a list built from two sources.
**Why:** a `cid:` URL names one file; with two, which one a mail client shows
is up to the client.
**Fix:** attach each image once, and give distinct images distinct ids:

```ts
import type { MailAttachment } from '@nxgt/mail';

declare const logo: MailAttachment;
declare const others: MailAttachment[];

const attachments = [logo, ...others.filter((file) => file.contentId !== logo.contentId)];
```

### `send: html shows a cid: URL that no attachment's contentId names — attach the image with that contentId`

**When:** `send`, when the HTML uses a `cid:` URL — an attribute value,
quoted or not (`src="cid:logo"`, `background=cid:bg`), or a CSS
`url(cid:bg)` — and no attachment has that `contentId`: the image was not
attached, was attached without its `contentId`, or under an id spelled
otherwise (another case, angle brackets). The ids are compared as written,
after the URL's `%` escapes are decoded; a malformed escape names nothing.
**Why:** the e-mail would go out with a broken image, and nothing would tell
anyone. The refusal names no id: find it in the template.
**Fix:** attach the image on every send of that e-mail, with the id the
template writes:

```ts
import { readFile } from 'node:fs/promises';
import type { Mailer, Rendered } from '@nxgt/mail';

const logo = await readFile('assets/logo.png');

export async function send(mailer: Mailer, to: string, rendered: Rendered): Promise<void> {
  await mailer.send({
    ...rendered,
    to,
    attachments: [{ filename: 'logo.png', content: logo, contentType: 'image/png', contentId: 'logo' }],
  });
}
```

A `cid:` in the text part or in the HTML's prose is not read. To show an
image from a server instead, write its `https:` URL in the template.

### `send: tags must be an object of names to values, as { category: 'receipt' }`

**When:** `send`, with `tags` that is not a plain object — typically Resend's
wire format, a list of `{ name, value }`, or `null`.
**Why:** the port's tags are a record, so a name appears once; each transport
writes them in its provider's shape.
**Fix:**

```ts
import type { MailMessage } from '@nxgt/mail';

declare const rendered: Omit<MailMessage, 'to'>;

const message: MailMessage = { ...rendered, to: 'ada@example.com', tags: { category: 'receipt' } }; // not [{ name, value }]
```

### `send: a tag name must be 1 to 256 ASCII letters, digits, _ or -`

**When:** `send`, with a tag name that is empty, longer than 256 characters,
or holds anything but ASCII letters, digits, `_` and `-` — a space, a `.`, an
accent.
**Why:** Resend and Amazon SES take only those; a tag that passes here is
taken by either, and none reaches the provider to be refused there.
**Fix:** name it with those characters, as `category` or `plan-tier`.

### `send: tag <name> must be 1 to 256 ASCII letters, digits, _ or -`

**When:** `send`, when the value of the tag `<name>` is empty, longer than
256 characters, not a string, or holds anything but ASCII letters, digits,
`_` and `-` — an e-mail address, a `.`, a space, an accent, a number not
written as a string.
**Why:** the same rule as a name. The refusal names the tag and never the
value: a value refused for an `@` may be an address.
**Fix:** use an id or a category, as a string — never an address or a name,
which would land in the provider's logs:

```ts
declare const user: { id: number; plan: 'free' | 'enterprise' };

const tags = { account: String(user.id), plan: user.plan }; // not { account: user.email }
```

### `send: idempotencyKey must be 1 to 256 visible ASCII characters, as order-42/receipt`

**When:** `send`, with an `idempotencyKey` that is empty, not a string,
longer than 256 characters, or holds a space, a line break, a control
character or anything outside ASCII — an accent, an emoji.
The message never holds the key.
**Why:** a transport that deduplicates writes the key into a header (Resend's
`Idempotency-Key`), where only visible ASCII is safe, and Resend takes at most
256 characters. The key is checked the same way on every transport, even one
that ignores it, so switching transports never turns a working key into a
refusal.
**Fix:** build the key from what the e-mail is about, and encode what you did
not write. `encodeURIComponent` keeps a readable key in visible ASCII; a hash
bounds its length:

```ts
const orderRef = 'Commande n° 42'; // yours, not ASCII

// Readable, when the reference is short:
const key = `order-${encodeURIComponent(orderRef)}/receipt`; // order-Commande%20n%C2%B0%2042/receipt

// Always under 256, whatever the reference:
const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(orderRef));
const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
const hashed = `order-${hex}/receipt`; // 64 hex digits, on any runtime

// Pick one, and build it the same way on every attempt:
await mailer.send({ ...message, idempotencyKey: hashed });
```

### `send: idempotencyKey was already used for a different message — a key names one e-mail`

**When:** a test, on a send through `createMemoryMailer()` whose
`idempotencyKey` the mailer already delivered, with a message that differs —
another recipient, subject, body, header or attachment. A `MailRefused`,
`code: 'MAIL_REFUSED'`; nothing is delivered. The same message again, key
included, is not refused: it answers the first `messageId`.
**Why:** a key names one e-mail. The memory mailer refuses a second, different
message under it as Resend does (a `409` `invalid_idempotent_request`, which
`@nxgt/mail-resend` throws as `send: Resend refused the message`), so the test
fails where production would. The usual causes: a key per user or per job
rather than per e-mail, or a retry that rendered the e-mail again with a
template or a variable that changed in between.
**Fix:** one key per e-mail, and the same message on every attempt at it —
render once, keep the result with the job, and send that on retry:

```ts
const message = { ...rendered, to: user.email, idempotencyKey: `order-${order.id}/receipt` };

await mailer.send(message); // the first attempt
await mailer.send(message); // a retry: the same message, the first messageId
```

A message meant to be different — a corrected receipt — is a new e-mail:
give it a new key (`order-42/receipt-2`). Between tests, `clear()` forgets the
keys.

### An e-mail is delivered twice although it has an `idempotencyKey`

**When:** a retry — after a `MailFailure`, a timeout, a job run twice —
delivers a second copy, although both sends carried an `idempotencyKey`.
**Why:** either the key changed between the attempts, or the transport cannot
deduplicate. A key built from `Date.now()` or `crypto.randomUUID()` at each
attempt names a new send each time, so it deduplicates nothing. SMTP has no
idempotency: `@nxgt/mail-smtp` ignores the key, and a message sent twice is
delivered twice. Resend keeps a key for 24 hours; a retry after that is a new
send.
**Fix:** derive the key from what the e-mail is about — one key per e-mail
the application means to send once — and compute it the same way on every
attempt:

```ts
// ✗ a new key per attempt: every retry is a new e-mail
await mailer.send({ ...message, idempotencyKey: crypto.randomUUID() });

// ✓ the same key for every attempt at this e-mail
await mailer.send({ ...message, idempotencyKey: `order-${order.id}/receipt` });
```

A key per user (`user-${user.id}`) is the opposite mistake: the second,
different e-mail to that user is refused — by the memory mailer, as
[`send: idempotencyKey was already used for a different message — a key names one e-mail`](#send-idempotencykey-was-already-used-for-a-different-message--a-key-names-one-e-mail),
and by Resend, as `send: Resend refused the message`. When a random key is
what you have, create it once, store it with the job, and reuse it on retry.

`withRetry` already generates and reuses a key for a message that has none —
see [Retrying](#retrying) below — so this usually shows up over
`@nxgt/mail-smtp`, which ignores the key outright: an *ambiguous* SMTP
failure (a timeout waiting for the response to `DATA`, after the message was
already transmitted) is thrown as `MailFailure`, retried like any other, and
can duplicate the e-mail because SMTP has nothing to deduplicate with. That
is a documented trade-off of retrying over SMTP, not a bug: pass `attempts: 1`
to `withRetry` for a mailer built on it if the risk is not acceptable.

### `send: scheduledAt must be a valid Date`

**When:** `send`, with a `scheduledAt` that is not a `Date` — an ISO string,
a number, `new Date(Number.NaN)` — or is not a `Date` at all.
**Why:** `scheduledAt` is typed and checked as a `Date`, never a string a
provider's wire format happens to want: `@nxgt/mail-resend` converts it with
`.toISOString()` itself.
**Fix:** pass a `Date`:

```ts
// ✗ a string, however well formed
await mailer.send({ ...message, scheduledAt: '2027-01-01T09:00:00.000Z' });

// ✓ a Date
await mailer.send({ ...message, scheduledAt: new Date('2027-01-01T09:00:00.000Z') });
```

### `send: scheduledAt is in the past`

**When:** `send`, with a `scheduledAt` more than about a minute earlier than
now.
**Why:** a send in the past is not a schedule, it is a mistake — a date built
from the wrong field, a time zone dropped, a value the caller meant to add to
rather than read as is. A few seconds' tolerance absorbs clock skew between
where the message is built and the transport; it is not room for a real delay.
**Fix:** check the moment before sending, or drop `scheduledAt` to send now:

```ts
declare const remindAt: Date; // computed elsewhere, maybe already past

const scheduledAt = remindAt.getTime() > Date.now() ? remindAt : undefined;
await mailer.send({ ...message, ...(scheduledAt === undefined ? {} : { scheduledAt }) });
```

### `send: scheduledAt is more than 30 days ahead — Resend's own limit`

**When:** `send`, with a `scheduledAt` more than 30 days from now.
**Why:** [Resend accepts a scheduled send up to 30 days ahead](https://resend.com/docs/dashboard/emails/schedule-email)
and no further; `checkMessage` holds every transport to the same bound, so a
message that would be refused on Resend is refused the same way on SMTP or in
a test, rather than only in production.
**Fix:** schedule closer, or keep the date and send it yourself when the
moment comes — a scheduled job that calls `mailer.send` with no `scheduledAt`
once it is within the window:

```ts
declare const sendAt: Date; // more than 30 days out today

// Store sendAt, and send without scheduledAt once you are within 30 days of it.
```

### `send: scheduledAt is not supported — SMTP has no way to schedule a send, and sending it now would be wrong`

**When:** `send`, through `@nxgt/mail-smtp`, with a message that carries
`scheduledAt`.
**Why:** SMTP has no notion of "send this later" — the message goes to the
server the moment it is handed over. `@nxgt/mail-smtp` refuses it rather than
silently sending it now, which would look like success while doing the
opposite of what was asked.
**Fix:** schedule through a transport that supports it (`@nxgt/mail-resend`),
or hold the e-mail yourself — a job scheduled for that moment, calling `send`
with no `scheduledAt` — and send it through SMTP when the moment comes.

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

## Batch sending

Both messages below are a bare `TypeError`, thrown by `sendBatch(mailer,
messages)` before anything is attempted — a wiring mistake, never something a
recipient did. Every message that does reach a transport is checked the same
way `send` checks one, and is reported `refused` or `failed` in the result
array rather than thrown — see
[Sending many at once — `sendBatch`](guide/sending.md#sending-many-at-once--sendbatch).

### `sendBatch: mailer must be a Mailer, as { send }`

**When:** `sendBatch(mailer, messages)`, with a first argument that is not an
object with a `send` function — `undefined`, a transport's factory itself
rather than what it answers, a plain object.
**Why:** `sendBatch` sends over whichever `Mailer` it is given — through the
transport's own `sendBatch` when it has one, over repeated `send` calls
otherwise — so without one there is nothing to send through.
**Fix:** pass what a transport's factory answers:

```ts
import { sendBatch } from '@nxgt/mail';
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '' });
const results = await sendBatch(mailer, messages);
```

### `sendBatch: messages must be an array of MailMessage`

**When:** `sendBatch(mailer, messages)`, with `messages` that is not an array
— a single message passed on its own, `undefined`, or a value read from
somewhere without being checked.
**Why:** `sendBatch` answers exactly one result per message, in the same
order; there is nothing to index without a list.
**Fix:** pass a list, even of one:

```ts
import { sendBatch } from '@nxgt/mail';

const results = await sendBatch(mailer, [message]); // not sendBatch(mailer, message)
```

---

## Retrying

### `withRetry: mailer must be a Mailer, as { send }`

**When:** `withRetry(mailer, …)`, with a first argument that is not an object
with a `send` function — `undefined`, a transport's factory itself rather
than what it answers, a plain object.
**Why:** `withRetry` wraps a `Mailer`; without one there is nothing to retry.
**Fix:** pass what a transport's factory answers:

```ts
import { withRetry } from '@nxgt/mail';
import { createResendMailer } from '@nxgt/mail-resend';

const mailer = withRetry(createResendMailer({ apiKey: process.env.RESEND_API_KEY ?? '' }));
```

### `withRetry: options must be an object, as { attempts }`

**When:** `withRetry(mailer, options)`, with `options` given as something
other than an object — a number, a string, `null`.
**Why:** every option is read off it; there is nothing to read off anything
else.
**Fix:** an object, or leave it out for the defaults: `withRetry(mailer)`.

### `withRetry: attempts must be a positive integer`

**When:** `withRetry(mailer, { attempts })`, with `attempts` that is not an
integer of at least `1` — `0`, a negative number, `1.5`, `'5'`.
**Why:** `attempts` counts how many times `send` is tried, the first try
included; `0` or fewer would mean never sending at all.
**Fix:** a whole number, `1` or more — `1` disables retrying outright:

```ts
const mailer = withRetry(resend, { attempts: 1 }); // never retries
```

### `withRetry: baseDelayMs must be a non-negative integer` / `withRetry: maxDelayMs must be a non-negative integer`

**When:** `withRetry(mailer, { baseDelayMs })` or `{ maxDelayMs }`, with a
value that is not an integer of `0` or more — a negative number, a fraction,
a string.
**Why:** both are read as milliseconds for a real timer, which takes no
fraction and no negative delay.
**Fix:** a whole number of milliseconds, `0` or more:

```ts
const mailer = withRetry(resend, { baseDelayMs: 500, maxDelayMs: 60_000 });
```

### `withRetry: maxDelayMs must be at least baseDelayMs`

**When:** `withRetry(mailer, { baseDelayMs, maxDelayMs })`, with `maxDelayMs`
smaller than `baseDelayMs`.
**Why:** the backoff grows from `baseDelayMs` up to `maxDelayMs`; a cap below
the starting point is not a cap that could ever apply, and is almost always a
mistake in which option got which value.
**Fix:** swap them, or drop the smaller one and keep the default.

### `withRetry: signal must be an AbortSignal`

**When:** `withRetry(mailer, { signal })`, with `signal` given as something
other than an `AbortSignal` — an `AbortController` itself, rather than its
`.signal`.
**Why:** only a `signal` is checked for `.aborted` and listened to for
`'abort'`; the controller that creates it is a different object.
**Fix:** pass the controller's `signal`:

```ts
const controller = new AbortController();
const mailer = withRetry(resend, { signal: controller.signal }); // not `controller`
```

See [Sending — retrying](guide/sending.md#retrying--withretry) for the
backoff, the idempotency key `withRetry` generates, the ambiguous SMTP case,
and the outbox pattern for a send that must survive a restart.

---

## Unsubscribe

`listUnsubscribe` checks its options **when it is called**, before any
`send`. A value that is text but not a usable URL or address is a
`MailRefused` (`code: 'MAIL_REFUSED'`), and it never quotes the value: the
URL usually carries a per-recipient token, and a token is a credential. A
value that is not text at all is a `TypeError`, a mistake in the code.

### `listUnsubscribe: url must be an https:// URL in printable ASCII, without credentials, <, >, quotes or a raw comma`

A `MailRefused`, `code: 'MAIL_REFUSED'`.

**When:** `listUnsubscribe({ url })`, with a `url` that does not start with
`https://` (`http:`, `mailto:`, relative, empty, `HTTPS://` in capitals), that
carries a user or a password (`https://user:pass@…`), or that holds a space,
a line break, a character outside ASCII, `<`, `>`, a double quote, a backtick,
a backslash, a brace, `|`, `^`, a `,` as it is, or a `%` that starts no
escape (`%`, `%zz`) — or an escape in the host that the parser decodes into
one of those (`https://a%2Cb.test/`): typically a token or a list name pasted
into a template string without being encoded, or an `http:` URL from a
development configuration.
**Why:** RFC 8058 accepts only an `https:` URL for one-click unsubscribe, and
RFC 2369 an RFC 3986 URI — printable ASCII — between `<` and `>`. A
transport encodes a header holding anything else, and no client finds the URL
in it; a `>` would end the URL, and a raw comma is RFC 2369's separator
between two URLs, so a mail client would read the rest as a second one. A
user and a password would be read by every relay and recipient.
**Fix:** build the URL with `new URL()` and set each value with
`searchParams.set`, which percent-encodes it (`,` becomes `%2C`, a space
`+`), then pass `.href`:

```ts
import { listUnsubscribe } from '@nxgt/mail';

declare const token: string;

const url = new URL('https://example.com/unsubscribe');
url.searchParams.set('token', token);

const headers = listUnsubscribe({ url: url.href });
```

A value in the path is encoded with `encodeURIComponent` (`/u/${encodeURIComponent(list)}`).
In development, use an `https:` URL as well, or leave the headers out.

### `listUnsubscribe: mailto must be a bare e-mail address, as unsubscribe@example.com`

A `MailRefused`, `code: 'MAIL_REFUSED'`.

**When:** `listUnsubscribe({ url, mailto })`, with a `mailto` that has a
display name (`Unsubscribe <unsubscribe@example.com>`), a `mailto:` prefix,
two addresses, no `@`, a domain without a dot, a character outside ASCII,
or `?`, `&`, `=`, `#`, `%` or a double quote (`u@example.com?subject=stop`).
**Why:** `mailto` is one mailbox, and `listUnsubscribe` writes the
`<mailto:…>` around it itself; a name, a prefix or a second address would
break the header or be read as something else — in a `mailto:`, `?` starts
header fields, and `?cc=` would add a recipient.
**Fix:** pass the address alone:

```ts
import { listUnsubscribe } from '@nxgt/mail';

declare const token: string;

const headers = listUnsubscribe({
  url: `https://example.com/unsubscribe?token=${encodeURIComponent(token)}`,
  mailto: 'unsubscribe@example.com', // ✗ 'mailto:unsubscribe@example.com'
});
```

### `listUnsubscribe: options must be an object, as { url }`

A `TypeError`.

**When:** `listUnsubscribe()` with no argument, or with the URL alone:
typically `listUnsubscribe(url)`.
**Why:** the options are one object, and `url` is required in it.
**Fix:** `listUnsubscribe({ url })`.

### `listUnsubscribe: url must be a string`

A `TypeError`.

**When:** `listUnsubscribe({ url })`, with a `url` that is a `URL` object,
`undefined` or anything else that is not text — from untyped code, since
TypeScript already refuses a `URL` object (`Type 'URL' is not assignable to
type 'string'`).
**Why:** the header holds text; the helper does not guess how to turn a
value into a URL.
**Fix:** pass the URL's text:

```ts
import { listUnsubscribe } from '@nxgt/mail';

const url = new URL('https://example.com/unsubscribe');

const headers = listUnsubscribe({ url: url.href }); // ✗ { url }
```

### `listUnsubscribe: mailto must be a string`

A `TypeError`.

**When:** `listUnsubscribe({ url, mailto })`, with a `mailto` that is set
but is not a string — `null`, or an `{ name, address }` object.
**Why:** `mailto` is one bare address, as text; leave it out for none.
**Fix:** `mailto: 'unsubscribe@example.com'`, or no `mailto` at all.

### Gmail shows no unsubscribe button

**When:** the message carries both headers from `listUnsubscribe`, yet
Gmail (or Yahoo) shows no "Unsubscribe" link next to the sender.
**Why:** the headers make the button possible; the mailbox provider decides
whether to show it. The usual causes:

- **The sender is not a bulk sender, or its reputation is low.** Gmail shows
  the button to senders it recognises as sending bulk mail with a good
  reputation; a new domain, or a handful of test messages, may never get it.
- **The message is not DKIM-signed by the sending domain**, or the signature
  does not cover the two headers. RFC 8058 requires a valid DKIM signature
  whose `h=` includes `List-Unsubscribe` and `List-Unsubscribe-Post`, and
  Gmail and Yahoo also want it aligned with the `From` domain. Check the received message's original: the
  `DKIM-Signature` must have `d=` your domain and name both headers.
- **The endpoint does not unsubscribe on the POST alone.** The client POSTs
  `List-Unsubscribe=One-Click` to the URL, with no cookie and no session. An
  answer that is a redirect, a login page, a confirmation page, or an error
  for a `POST` (a route that only answers `GET`) is a failed unsubscribe.
- **The e-mail is transactional** — a sign-in code, a password reset, a
  receipt. Gmail does not offer to unsubscribe from those, and they should
  not carry the headers: nobody unsubscribes from their own password reset.

**Fix:** set the headers only on e-mails a recipient subscribed to, send
from a domain that signs with DKIM, and make the URL unsubscribe on the
`POST` itself:

```ts
declare function unsubscribeByToken(token: string): Promise<void>; // yours

// POST https://example.com/unsubscribe?token=…, body List-Unsubscribe=One-Click
async function unsubscribe(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token') ?? '';
  if (request.method === 'POST') {
    const form = await request.formData();
    if (form.get('List-Unsubscribe') !== 'One-Click') return new Response(null, { status: 400 });
    await unsubscribeByToken(token); // no login, no confirmation
    return new Response(null, { status: 200 }); // never a redirect
  }
  // GET: a person followed the link. Show a page that posts the same form.
  return new Response(
    '<form method="post"><input type="hidden" name="List-Unsubscribe" value="One-Click"><button>Unsubscribe</button></form>',
    { headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}
```

The full handler, with what the `GET` page may show, is in
[the sending guide](guide/sending.md#one-click-unsubscribe).

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

## Creating the renderer

`createMailRenderer` reads the manifest and every file it lists **once, when
it is called**. A mistake in the options is a `TypeError`, and a missing or
broken build is an `Error`. Both are thrown there, at start-up, never at the
first send. Nothing about them can be handled: fix the wiring or the
deployment, and restart.

### `createMailRenderer: options must be an object, as { dir: 'dist' }`

A `TypeError`.

**When:** `createMailRenderer()` with no argument, or with a string:
typically `createMailRenderer('dist')`.
**Why:** the options are one object, and `dir` is required in it.
**Fix:**

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' });
```

### `createMailRenderer: dir must be the folder maizzle build wrote, as dist`

A `TypeError`.

**When:** `createMailRenderer({})`, or `dir` set to `''`, to whitespace or
to something that is not a string: typically an environment variable that is
not set in this environment (`dir: process.env.MAIL_DIR`).
**Why:** `dir` is where `mail-manifest.json` is. There is no default, so a
deployment that forgot the variable does not silently read another folder.
**Fix:** pass the output folder of `maizzle build`. When it comes from the
environment, check that it is set before the call.

### `createMailRenderer: getLanguage must be a function that answers the wanted locales, as () => user.locale`

A `TypeError`.

**When:** `createMailRenderer({ dir, getLanguage: user.locale })`: the locale
passed as a value rather than a function that answers it.
**Why:** the renderer is created once, at start-up, and asks `getLanguage` at
each `render`, so the recipient of each send decides the locale.
**Fix:**

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';

declare const currentUser: () => { locale: string | null };

const mails = createMailRenderer({
  dir: 'dist',
  getLanguage: () => currentUser().locale,
});
```

To render one e-mail in a locale you already hold, pass it to `render`
instead: `mails.render('verify-email', variables, { locale: 'fr' })`.

### `createMailRenderer: fallbackLocale must be one of the build's locales, <locales>`

A `TypeError`. `<locales>` lists the locales the build wrote, as `en, fr`.

**When:** `createMailRenderer({ dir, fallbackLocale: 'de' })`, when the build
has no `de`: typically a fallback copied from another project, or a locale
removed from `i18n({ locales })` without updating the server.
**Why:** the fallback is what an e-mail is rendered in when no wanted locale
was built, so it must be one of them.
**Fix:** leave `fallbackLocale` out to use the one the build was made with
(`i18n({ fallbackLocale })`), or name one of the locales in the message.

### `createMailRenderer: <dir>/mail-manifest.json cannot be read — run maizzle build, and deploy its output folder`

An `Error`, its `cause` the file system's error (`ENOENT`, `EACCES`).

**When:** start-up, in three situations:

- `maizzle build` has not run, or wrote to another folder
  (`productionConfig(config, { output: { path: 'dist-production' } })`
  writes to `dist-production`, not `dist`).
- The server was deployed without the build: the image or the bundle holds
  the server's code, but not the output folder.
- `dir` is relative. It resolves against the folder the process was started
  from, not against the file that calls `createMailRenderer`, so the same
  code works from the project root and fails from anywhere else.

**Why:** the renderer fills the files `maizzle build` wrote; it never builds
them, so the build has to be where `dir` says, next to the running server.
**Fix:** build before you deploy, ship the output folder with the server, and
resolve `dir` from the calling file rather than from the working directory:

```ts
import { fileURLToPath } from 'node:url';
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({
  // The folder `maizzle build` wrote, relative to this file.
  dir: fileURLToPath(new URL('../emails/dist', import.meta.url)),
});
```

```dockerfile
# Next to the server's code, in the image that runs it.
COPY emails/dist ./emails/dist
```

When the server is bundled, `new URL(…, import.meta.url)` is relative to the
bundle's file: point it at where the output folder sits in the deployment.

### `createMailRenderer: <dir>/<locale>/<email>.html cannot be read — run maizzle build, and deploy its output folder`

The same message, for a file the manifest lists rather than the manifest
itself: `<email>.html` or `<email>.txt`, under the path the build wrote.

**When:** start-up, when the manifest was found but a file it lists was not:
the output folder was copied only in part, cleaned after the build, or the
manifest comes from a newer build than the files beside it.
**Why:** the manifest and the files are one build; the renderer reads every
file it lists at start-up, so a missing one fails there and not at the send
that needs it.
**Fix:** deploy the output folder whole, from a single `maizzle build`. Do
not copy files out of it one by one.

### `createMailRenderer: <dir>/mail-manifest.json is not valid JSON`

An `Error`, its `cause` the `SyntaxError`.

**When:** start-up, when `mail-manifest.json` was cut short or edited: a copy
interrupted mid-way, a merge conflict in a committed build, a hand edit.
**Why:** the file is written by `@nxgt/mail-i18n` at the end of a build, and
never meant to be edited.
**Fix:** run `maizzle build` again, and deploy its output.

### `createMailRenderer: <dir>/mail-manifest.json is not a manifest of @nxgt/mail-i18n — build with its i18n() plugin`

An `Error`.

**When:** start-up, when `dir` points at a folder whose `mail-manifest.json`
has no `locales` list (or an empty one), no `fallbackLocale` or no `emails`
object, or a `formatVersion` that is not a positive integer (`0`, `1.5`,
`"1"`, `null`): typically a `mail-manifest.json` written by something else.
**Why:** the renderer reads only the manifest the `i18n()` plugin of
`@nxgt/mail-i18n` writes. A Maizzle build without that plugin writes no
manifest at all, and fails with
[`cannot be read`](#createmailrenderer-dirmail-manifestjson-cannot-be-read--run-maizzle-build-and-deploy-its-output-folder)
instead.
**Fix:** build with the plugin:

```ts
// maizzle.config.ts
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';

export default defineMailConfig({
  plugins: [i18n({ locales: ['en', 'fr'], fallbackLocale: 'en' })],
});
```

### `createMailRenderer: <dir>/mail-manifest.json is manifest format <format>, newer than this @nxgt/mail reads (<newest>) — upgrade @nxgt/mail`

An `Error`, as `… is manifest format 2, newer than this @nxgt/mail reads (1)
— upgrade @nxgt/mail`.

**When:** start-up, when the build was made with a `@nxgt/mail-i18n` that
writes a newer manifest format than the installed `@nxgt/mail` reads: the
build tool was upgraded and the server was not, or a package that ships a
prebuilt build needs a newer `@nxgt/mail` than the one installed.
**Why:** a renderer reads every manifest format up to its `MANIFEST_FORMAT`,
and refuses a newer one rather than misread it. The format only changes when
the manifest's shape does.
**Fix:** upgrade `@nxgt/mail` in the server that renders, to a version whose
`MANIFEST_FORMAT` is at least the format in the message:

```sh
bun add @nxgt/mail@latest
```

```ts
import { MANIFEST_FORMAT } from '@nxgt/mail/renderer';

MANIFEST_FORMAT; // must be >= the manifest's formatVersion
```

A package that ships its build states the lowest `@nxgt/mail` it needs in its
peer range; see
[Rendering — which builds it reads](guide/rendering.md#which-builds-it-reads--manifest_format).

### `createMailRenderer: mail-manifest.json describes <email> in a shape its format does not have — it was changed after the build; run maizzle build again`

An `Error`.

**When:** start-up, when an e-mail's entry in the manifest lacks
`variables`, `urlVariables`, `subject` or `files`, or has no subject or HTML
file for one of the build's locales.
**Why:** every manifest format has those fields, for every e-mail and every
locale, and `@nxgt/mail-i18n` writes them all. An entry without one was
changed after `maizzle build` wrote it: a hand edit, a merge conflict resolved
in a committed build, a script that rewrote the file, a copy cut short. It is
not a version mismatch: within 0.x, a renderer reads every format up to its
own, so a build from an earlier `@nxgt/mail-i18n` 0.x keeps working.
**Fix:** run `maizzle build` again, and deploy its output without editing
`mail-manifest.json`. If the build is fresh and untouched, it is a
[bug in this package](#a-bug-in-nxgtmail-itself).

### `createMailRenderer: <email> has no text part in <locale> — keep Maizzle's plaintext on, as @nxgt/mail-config sets it`

An `Error`.

**When:** start-up, after a build whose config turned Maizzle's plain-text
output off: `plaintext: false`, in the project's config or in a plugin that
comes after `@nxgt/mail-config`'s base.
**Why:** every e-mail is sent with a text part — `Rendered` and `MailMessage`
require one — and the renderer only fills it; it does not derive it from the
HTML at send time.
**Fix:** remove the `plaintext: false`, then run `maizzle build` again.
`defineMailConfig`'s base turns the text part on, laid out in paragraphs.
Leave `plaintext` out rather than writing `plaintext: true`: `true` replaces
the base's options, and the text part runs onto one line again — see
[@nxgt/mail-config's troubleshooting](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-config/docs/troubleshooting.md#the-plain-text-part-is-one-long-line-again).

### `Could not resolve "node:fs"`, or `No such module "node:fs"`, on an edge runtime

The first as a bundler prints it (esbuild, and the tools built on it), the
second as a Workers runtime does. Other edge runtimes word it their own way.

**When:** bundling or starting code that imports `@nxgt/mail/renderer` for a
runtime without Node's `node:fs`: an edge function, a worker without a Node
compatibility mode. `@nxgt/mail` itself imports no Node built-in, so code
that only uses the `Mailer` port, the errors or a transport is not affected.
**Why:** `createMailRenderer` reads the build from a file system at start-up.
A runtime without one has no files to read, so even with a compatibility
flag that lets the import through, the renderer cannot find the build.
**Fix:** render in a runtime with a file system — Node, Bun or Deno — and
send from there. `render` is synchronous and cheap once the renderer is
created, so it belongs in the server that owns the send, not at the edge.

---

## Rendering

`render` refuses a call it cannot fill correctly, and **sends nothing wrong
instead**. Every message below but the URL refusal names a mistake in the calling
code or a server out of step with its build: an `Error` or a `TypeError`,
with no `code`, to be fixed rather than handled. A URL that is refused is a
`MailRefused`, `code: 'MAIL_REFUSED'`, because the URL may come from outside.
No message holds a value: a link in a verification e-mail is a credential.

### `render: <email> is not an e-mail of the build — one of <emails>`

An `Error`. `<emails>` lists the e-mails the build wrote.

**When:** `mails.render('welcome', …)` when the build has no `welcome`:
a typo, an e-mail added to the code before its template was built, or a
server deployed with an older build. An e-mail in a subfolder is named with
its folder, as `auth/reset-password`.
**Why:** the renderer only fills what `maizzle build` wrote; the list is in
`mails.emails`.
**Fix:** use a name from the message. To catch the mismatch at start-up
rather than at a send, check the names your code uses against `mails.emails`:

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' });
const used = ['verify-email', 'reset-password'];
const missing = used.filter((name) => !mails.emails.includes(name));
if (missing.length > 0) {
  throw new Error(`e-mails missing from the build: ${missing.join(', ')}`);
}
```

To catch it before the code runs at all, type the renderer with the build's
`MailEmails`: see
[Rendering — typing the renderer](guide/rendering.md#typing-the-renderer).

### `render: the locale asked for is not one of the build's, <locales>`

An `Error`.

**When:** `render(email, variables, { locale })`, with a `locale` the build
did not write: typically a stored user locale passed as is (`'fr-CA'`,
`'de'`). A locale from `getLanguage` never fails this way: it is picked with
`pickLocale`, which falls back.
**Why:** the `locale` option is taken as given — it says "this locale", not
"prefer this one".
**Fix:** let `getLanguage` answer the wanted locale, or pick one of the
build's yourself:

```ts
import { pickLocale } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';

declare const storedLocale: string | null;

const mails = createMailRenderer({ dir: 'dist' });
const locale = pickLocale(storedLocale, mails.locales, 'en');
const rendered = mails.render('sign-in-code', { code: '123456' }, { locale });
```

### `render: the variables of <email> must be an object, as { name: 'Ada' }`

A `TypeError`.

**When:** `render(email, variables)` with `variables` that is `null`, an
array or a string: typically the value itself passed where its object was
expected, as `render('sign-in-code', code)`.
**Why:** each placeholder is filled by name, from an object.
**Fix:** `mails.render('sign-in-code', { code })`. An e-mail with no
placeholder takes no second argument at all.

### `render: <email> has no variable <key> — it takes <variables>`

An `Error`. `<variables>` lists every placeholder of the e-mail, or `none`.

**When:** `render`, with a key the e-mail does not have: a typo, a variable
removed from the template, or a whole object spread into the call
(`render('verify-email', { ...user, link })`).
**Why:** an unknown key is refused rather than ignored: it is a typo, a
template out of step with the code, or data you did not mean to put in an
e-mail.
**Fix:** pass exactly the placeholders the message lists:

```ts
declare const user: { name: string; email: string };
declare const link: string;

mails.render('verify-email', { name: user.name, link });
```

### `render: <email> needs the variable <key>`

An `Error`.

**When:** `render`, without a value for one of the e-mail's placeholders.
The variables of an e-mail are those of **all its locales**, its subject and
its text part included, so a placeholder only the `fr` message uses is
still required when rendering in `en`.
**Why:** a placeholder left unfilled would go out as `{{ link }}`.
**Fix:** pass it. When a value is optional, decide what the e-mail says
without it in the template, and pass an empty string where that is correct:
`{ name: user.name ?? '' }`.

### `render: <email>: <key> must be a string or a finite number`

A `TypeError`.

**When:** `render`, with a value that is `null`, `undefined`, `NaN`,
`Infinity`, a boolean, an array, a `Date` or a `URL`: typically a field read
from a database that may be missing.
**Why:** a value is written as text. A number is written as `String(n)`;
anything else would render as `null`, `undefined` or `[object Object]` in a
sent e-mail.
**Fix:** convert it yourself, in the format the recipient should read:

```ts
declare const inviteUrl: URL;
declare const expiresAt: Date;

mails.render('invitation', {
  link: inviteUrl.href,
  expires: expiresAt.toLocaleDateString('fr-FR'),
});
```

### `render: <email>: <key> must be an http:, https: or mailto: URL`

A `MailRefused`, `code: 'MAIL_REFUSED'`.

**When:** `render`, for a placeholder that starts an `href`, `src`,
`background`, `poster` or `action` attribute in the template
(`href="{{ link }}"`), when its value is not an absolute `http:`, `https:`
or `mailto:` URL: a relative link (`/verify`, `//host`), a `javascript:`,
`data:` or `cid:` URL, or a URL holding whitespace, a quote, `<`, `>` or a backtick —
typically an unencoded query value, as `?email=ada lovelace`.
**Why:** that placeholder decides where the link leads, and a mail client
follows it as written. The build records which placeholders sit there, in
the manifest; escaping alone would not stop `javascript:`.
**Fix:** pass an absolute URL, built with `URL` so every part is encoded:

```ts
declare const token: string;

const link = new URL('/verify', 'https://app.example');
link.searchParams.set('token', token);

mails.render('verify-email', { name: 'Ada', link: link.href });
```

An inline image's `cid:` is refused here too: write it in the template, as
`src="cid:logo"`, not through a placeholder, and attach the image with that
`contentId` — see [Sending — inline images](guide/sending.md#inline-images--cid).

When the URL comes from outside your code, handle the refusal as any
[`MAIL_REFUSED`](#mail_refused--mailrefused-the-message-was-refused-as-malformed):
sending the same value again fails again.

### A link breaks when its value holds `&`, `+`, `#` or `/`: `?token={{ token }}` is not percent-encoded

No error: the e-mail is sent, and the link in it is wrong.

**When:** a template writes a placeholder **after** the start of a URL
attribute, as `href="https://app.example/verify?token={{ token }}"`, and the
value holds a character that means something in a URL: a base64 token with
`+` or `/`, a value with `&`, `#`, `?` or a space.
**Why:** only a placeholder that **starts** the attribute is a URL variable,
checked as a URL. One later in the value is filled like any other: escaped
for HTML (`&` becomes `&amp;`, which a mail client reads back as `&`), never
percent-encoded — the renderer cannot know which part of a URL it fills. The
scheme is fixed by the template, so it is safe; the link is only wrong.
**Fix:** encode the value yourself:

```ts
declare const token: string;

mails.render('verify-email', { name: 'Ada', token: encodeURIComponent(token) });
```

Or make the whole URL the placeholder (`href="{{ link }}"`) and build it with
`URL`, as in the entry above: it is then encoded by `URL` and checked by the
renderer.

---

## Observability

`@nxgt/mail/telemetry` throws nothing of its own: `withMailTelemetry` and
`withMailRendererTelemetry` only observe, and rethrow whatever the wrapped
`Mailer` or `MailRenderer` throws, unchanged. The two entries below are not a
message this package prints — they are what happens around it.

### `Cannot find package '@opentelemetry/api'`, or `Cannot find module '@opentelemetry/api'`

**When:** importing `@nxgt/mail/telemetry`, in a project that has not
installed `@opentelemetry/api`.
**Why:** it is an **optional peer** of `@nxgt/mail` — not installed unless
something imports this subpath, so a project that never uses
`withMailTelemetry` or `withMailRendererTelemetry` never needs it.
**Fix:** `bun add @opentelemetry/api` (or `npm install`, `pnpm add`). No
SDK is required to run: with none registered, every span and every metric
here is a no-op, and `mailer.send` or `render` behaves exactly as unwrapped.

### A `mail.send` or `mail.render` span never appears, with `@opentelemetry/api` installed

**When:** `withMailTelemetry` or `withMailRendererTelemetry` wraps a `Mailer` or a
`MailRenderer`, sends and renders happen, and nothing shows up in your
backend.
**Why:** `@opentelemetry/api`'s own tracer and meter answer no-ops until a
`TracerProvider` and a `MeterProvider` are **registered** — installing the
package is not the same as configuring an SDK.
**Fix:** register both before the first send, as your platform's OTel setup
does — `@opentelemetry/sdk-trace-base`'s `BasicTracerProvider` with an
exporter and `trace.setGlobalTracerProvider(provider)`,
`@opentelemetry/sdk-metrics`' `MeterProvider` with a reader and
`metrics.setGlobalMeterProvider(provider)` — the same two calls
`telemetry.spec.ts` makes with the in-memory exporters, before any
`withMailTelemetry`-wrapped mailer is created.

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
`a send with no recipient`, `a send with a line break in the subject`,
`a send with a Bcc header`, `a send with an attachment named with a path` or
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

### `conformance: the harness's delivered() reads back no attachments — read them from the receiving end, or skip send.attachment with the reason`

**When:** `send.attachment`, on a harness whose `delivered()` answers
messages without an `attachments` field — typically one written before
`@nxgt/mail` had attachments.
**Why:** a missing field is not "no attachment arrived": the case cannot tell
a transport that drops files from a harness that does not look. It fails
rather than pass a transport it did not check.
**Fix:** read the attachments back from the receiving end, decoded to bytes
— `[]` when none arrived:

```ts
import type { DeliveredMail } from '@nxgt/mail/conformance';
import type { ParsedMail } from 'mailparser';

// Over SMTP, from what mailparser parsed:
const fromSmtp = (parsed: ParsedMail): DeliveredMail['attachments'] =>
  parsed.attachments.map((file) => ({
    filename: file.filename ?? '',
    content: new Uint8Array(file.content),
    contentType: file.contentType,
  }));

// From a JSON body, where the content is base64:
const fromJson = (files: { filename: string; content: string; contentType: string }[]) =>
  files.map((file) => ({
    ...file,
    content: Uint8Array.from(atob(file.content), (char) => char.charCodeAt(0)),
  }));
```

If the provider cannot carry attachments at all, say so:
`skip: { 'send.attachment': 'the provider takes no attachments' }`.

### `conformance: expected 1 delivered attachment, got <n>`

**When:** `send.attachment` or `send.inlineImage`: the message arrived with
no attachment, or with more than the one sent.
**Why:** the transport left `message.attachments` out of what it handed
over — the usual cause when a transport builds the provider's request field
by field — or the harness reads the parts of the body as attachments too.
**Fix:** map each attachment into the provider's request, as in
[the transports guide](guide/transports.md#a-transport-over-http); in the
harness, read only the parts the provider marks as attachments.

### `conformance: the attachment was not delivered byte for byte`

**When:** `send.attachment`, whose file holds every byte from 0 to 255.
**Why:** the bytes were read as text on the way — decoded as UTF-8 (every
byte above 127 changes), a NUL cut short, or line breaks rewritten — or
base64 was encoded from a string instead of the bytes. Over JSON, the usual
cause is a `Uint8Array` handed to `JSON.stringify` as it is: it becomes an
object keyed by index (`{"0":0,"1":1,…}`), never base64, so the harness's
`atob` throws or decodes something else.
**Fix:** encode the bytes, never a string made of them: base64 from the
`Uint8Array` for a JSON API, a `Buffer` of the same bytes for nodemailer.
In the harness, decode base64 back to bytes, not to a string.

### `conformance: the inline image was not delivered with its content id — the HTML shows a broken image`

**When:** `send.inlineImage`: the attachment arrived, but without the
`contentId` it was sent with, or with another one.
**Why:** the transport left `contentId` out of what it handed over (nodemailer
calls it `cid`, Resend `content_id`), or the harness does not read it back —
or reads it with its angle brackets, `<logo-7f3a@example.test>`.
**Fix:** pass the id through, and read it back bare:

```ts
import type { MailAttachment } from '@nxgt/mail';

// In the transport, for nodemailer:
const toNodemailer = (file: MailAttachment) => ({
  filename: file.filename,
  content: Buffer.from(file.content),
  contentType: file.contentType,
  ...(file.contentId === undefined ? {} : { cid: file.contentId }),
});

// In an SMTP harness: mailparser's cid has no angle brackets. Parse with
// simpleParser(stream, { skipImageLinks: true }), or the HTML read back has
// its cid: URLs rewritten as data: URLs.
```

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
| `conformance: a Bcc header must throw MailRefused` | `send.refusesAddressHeader` | call `checkMessage`, from a version of `@nxgt/mail` that refuses reserved headers |
| `conformance: an attachment named with a path must throw MailRefused` | `send.refusesAttachmentPath` | call `checkMessage`, from a version of `@nxgt/mail` that checks attachments (0.2 on) |
| `conformance: the refusal message holds the refused value` | `send.refusesWithoutTheValue`, `send.refusesAddressHeader`, `send.refusesAttachmentPath` | name where the problem is, never the value |
| `conformance: a send with an idempotency key did not answer SentMail` | `send.idempotencyKey` | accept the key, and resolve as for any message: a provider that cannot deduplicate is no reason to refuse |
| `conformance: the idempotency key was written into the e-mail` | `send.idempotencyKey` | the recipients, subject, HTML or text read back hold the key: keep it out of what builds the e-mail, and send it as the provider's header (Resend's `Idempotency-Key`), or leave it out |
| `conformance: the message with an attachment was not delivered` | `send.attachment` | a message with attachments is a message: deliver it |
| `conformance: the attachment was not delivered with its file name` | `send.attachment` | pass the name as is; the name `reçu n° 42.pdf` needs RFC 2231 encoding in a raw header — nodemailer and a JSON API do it for you |
| `conformance: the attachment was not delivered with its content type` | `send.attachment` | pass `contentType` through; do not guess it from the name |
| `conformance: the parts of a message with an attachment were not delivered as sent` | `send.attachment` | keep the HTML and the text parts beside the attachment — `multipart/mixed` around `multipart/alternative` |
| `conformance: the message with an inline image was not delivered` | `send.inlineImage` | a message with an inline image is a message: deliver it |
| `conformance: the harness's delivered() reads back no attachments — read them from the receiving end, or skip send.inlineImage with the reason` | `send.inlineImage` | read the attachments back, each with its `contentId`, as for `send.attachment` |
| `conformance: the inline image was not delivered with its content type` | `send.inlineImage` | pass `contentType` through |
| `conformance: the inline image was not delivered byte for byte` | `send.inlineImage` | encode the bytes, never a string made of them |
| `conformance: the html part of a message with an inline image was not delivered as sent` | `send.inlineImage` | send the HTML as is — never rewrite its `cid:` URLs; over SMTP, parse with `skipImageLinks: true` in the harness |
| `conformance: a send with tags did not answer SentMail` | `send.tags` | accept the tags and resolve as for any message: a provider that has no tags is no reason to refuse |
| `conformance: a tag was written into the e-mail` | `send.tags` | send the tags to the provider's own field (Resend's `tags`), or leave them out — never in the recipients, subject, HTML or text |
| `conformance: the send after a failure was not delivered` | `failure.recovers` | do not leave the transport broken after a failure: reopen the connection on the next send |
| `conformance: faults are required` | a `failure.*` case whose `run` you called yourself | pass `faults` in the context, or go through `runMailerCase`, which skips the case instead |

### `checkMailEvent` refusals

For a package mapping a **second** provider's webhook to `MailEvent` — see
[Delivery events — writing a second provider's mapping](guide/events.md#writing-a-second-providers-mapping).
Each names the field the mapping got wrong:

| Message | Fix |
| --- | --- |
| `conformance: messageId must be a non-empty string` | map the provider's own message id, never `''` |
| `conformance: recipient must be a non-empty string` | map the address the provider reports the event for |
| `conformance: timestamp must be a valid Date` | `new Date(providersTimestamp)`, checked with `Number.isNaN` |
| `conformance: tags must be a record of strings` | every value a string, or leave the key out |
| `conformance: a bounced event's bounceType must be 'hard' or 'soft'` | classify the provider's own bounce code into one of the two |
| `` conformance: a opened event's tracking must be true `` / `` a clicked event's tracking must be true `` | set `tracking: true` on both |
| `conformance: a clicked event's url must be a string or null` | the link clicked, or `null` when the provider reports none |

### A bug in `@nxgt/mail` itself

A `conformance:` failure against `referenceMailerHarness()`, or a `send: …`
refusal of a message this page says is valid, is a bug in this package.
Open an issue on
[`softistx/nxgt-mail`](https://github.com/softistx/nxgt-mail/issues) with the
message, the package version and the smallest message or harness that
reproduces it — with example addresses, never real ones.
