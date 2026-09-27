# Errors

`send` resolves only once Resend has answered `2xx`. Otherwise it rejects with
one of the two classes of its `@nxgt/mail` peer — this package defines no
error class, so `error instanceof MailFailure` holds whichever transport the
application wires:

- **`MailRefused`** (`code: 'MAIL_REFUSED'`) — Resend refused the message
  itself. Sending it again unchanged fails again.
- **`MailFailure`** (`code: 'MAIL_FAILED'`) — Resend could not take it:
  unreachable, too slow, rate-limited, or the key refused. Nothing is known
  to have been sent: after a timeout or a dropped connection, Resend may have
  accepted it all the same.

Nothing is retried. Whether and when to retry is yours to decide, where you
can see it.

```ts
import { MailError, type MailErrorCode, type Mailer, type MailMessage } from '@nxgt/mail';

function statusOf(code: MailErrorCode): number {
	switch (code) {
		case 'MAIL_FAILED':
			return 503;
		case 'MAIL_REFUSED':
			return 422;
	}
}

export async function sendOrRespond(mailer: Mailer, message: MailMessage): Promise<Response> {
	try {
		await mailer.send(message);
		return new Response(null, { status: 202 });
	} catch (error) {
		if (!(error instanceof MailError)) throw error;
		return Response.json({ code: error.code }, { status: statusOf(error.code) });
	}
}
```

## Which answer is which

Resend answers an error as `{ statusCode, name, message }`:

| Resend answers | Typical `name` | Throws |
| --- | --- | --- |
| `400` | `validation_error` | `MailRefused` |
| `413` | — (not in Resend's reference: a request too large for what sits in front of the API; refused, as a resend would fail again) | `MailRefused` |
| `422` | `validation_error`, `missing_required_field`, `invalid_attachment` | `MailRefused` |
| `401`, `403` | `missing_api_key`, `invalid_api_key`, an unverified domain | `MailFailure` |
| `429` | `rate_limit_exceeded`, `daily_quota_exceeded` | `MailFailure` |
| `5xx` | `internal_server_error` | `MailFailure` |
| any other status | — | `MailFailure` |
| no answer: DNS, a refused connection, TLS | — | `MailFailure` — `send: Resend could not be reached` |
| no answer within `timeoutMs` | — | `MailFailure` — `send: Resend did not answer within <timeoutMs> ms` |

A `401` or `403` is a failure although it is a `4xx`: a bad key or an
unverified domain refuses every message alike. It is the wiring that is
wrong, not the message.

## What `cause` holds

For an answer, `cause` is a plain `Error` — the transport defines no class —
carrying what Resend said:

| Property | Type | Example |
| --- | --- | --- |
| `message` | `string` | `Resend answered 422 validation_error` |
| `status` | `number` | `422` |
| `errorName` | `string \| null` | `'validation_error'`, or `null` when the body had none |
| `detail` | `string \| null` | Resend's own `message`, or `null` |

For no answer, `cause` is the `fetch` error — a `TypeError` from the runtime,
or the `TimeoutError` of the timeout.

```ts
import { MailError } from '@nxgt/mail';

try {
	await mailer.send(message);
} catch (error) {
	if (error instanceof MailError) {
		const cause = error.cause as { status?: number; errorName?: string | null };
		logger.warn({ code: error.code, status: cause.status, resend: cause.errorName }, error.message);
	}
	throw error;
}
```

Neither message holds a value: never the key, an address, a subject, or what
Resend said. Resend's own message can quote an address, so it is kept on
`detail` and never put in a `message` — log `detail` only where your logs may
hold one.

## The messages

| `message` | Class | When |
| --- | --- | --- |
| `send: Resend refused the message` | `MailRefused` | A `400`, `413` or `422` |
| `send: Resend could not take the message` | `MailFailure` | Any other answer that is not `2xx` |
| `send: Resend could not be reached` | `MailFailure` | `fetch` threw |
| `send: Resend did not answer within <timeoutMs> ms` | `MailFailure` | The timeout aborted the request |
| `send: from is missing — give the message a from, or createResendMailer a default one` | `MailRefused` | A message without `from`, on a mailer without a default. No request is made |
| `send: …` from `checkMessage` | `MailRefused` | A message no transport hands over — see [`@nxgt/mail`'s troubleshooting](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/troubleshooting.md#sending) |

## Wiring — a `TypeError`

A bad option is a mistake in how the application was put together, thrown
when `createResendMailer` is called, never at the first send. No message
prints the value:

| `message` | When |
| --- | --- |
| `createResendMailer: options must be an object, as { apiKey }` | `createResendMailer()`, or the key passed on its own |
| `createResendMailer: apiKey must be a Resend API key — is the environment variable set?` | No `apiKey`, an empty or a blank one |
| `createResendMailer: apiKey holds whitespace — trim the value it was read from` | A key with a space or a line break in it |
| `createResendMailer: baseUrl must be an http: or https: URL` | `baseUrl` without its scheme, or not a string |
| `createResendMailer: fetch must be a function` | `fetch` that is not a function |
| `createResendMailer: timeoutMs must be a positive integer` | `0`, a negative number, a fraction |
| `createResendMailer: timeoutMs must be at most 2147483647 — a longer timer fires at once` | A `timeoutMs` above 2³¹ − 1 ms, about 24.8 days |
| `createResendMailer: from must be an e-mail address, as noreply@example.com or { name, address }` | A default `from` that is not an address — `'Acme <noreply@acme.test>'` included |

## See also

- [Troubleshooting](../troubleshooting.md) — each message, its cause and its
  fix.
- [`@nxgt/mail` — sending](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/sending.md)
  — the errors, from the caller's side.
