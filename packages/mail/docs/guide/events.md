# Delivery events

This page is for what a provider reports **after** `send` hands a message
over: delivered, bounced, complained, delayed — and, if the provider tracks
it, opened or clicked. `@nxgt/mail` itself carries only the neutral shape;
verifying a provider's webhook and mapping it to that shape lives in the
provider's own package, `@nxgt/mail-resend/webhooks` today.

## The shape — `MailEvent`

```ts
import type { MailEvent } from '@nxgt/mail';

declare function suppress(recipient: string): void; // your own: stop sending to this address

function handle(event: MailEvent): void {
	switch (event.type) {
		case 'delivered':
			break; // the receiving server took the message
		case 'bounced':
			if (event.bounceType === 'hard') suppress(event.recipient); // never send this address again
			break; // 'soft' — a temporary rejection: the provider may retry on its own
		case 'complained':
			suppress(event.recipient); // marked as spam after delivery
			break;
		case 'delayed':
			break; // not a failure yet — a full inbox, a slow server
		case 'opened':
		case 'clicked':
			break; // tracking, sent only when the provider tracks it — see below
	}
}
```

Every event carries:

| Field | Type | |
| --- | --- | --- |
| `messageId` | `string` | The id `send` answered as `SentMail.messageId`, the provider's own |
| `recipient` | `string` | The address the provider reports the event for, exactly as it sent it |
| `timestamp` | `Date` | When the provider says the event happened |
| `tags` | `Readonly<Record<string, string>>` | The message's own `tags`, echoed back — an empty record when the provider does not |
| `raw` | `unknown` | The provider's own payload for this event, untouched — the escape hatch for a field this shape does not carry |

`bounced` adds `bounceType`, `'hard'` or `'soft'`: **hard** means the address
itself is bad (unknown user, no such domain) — permanent, sending again fails
again; **soft** means a temporary rejection (a full inbox, greylisting, a
transient server problem) — the provider may retry on its own, and so may
you, later.

`opened` and `clicked` are **optional, and marked as tracking**: a provider
sends them only when tracking is turned on (a pixel, rewritten links), unlike
the four above, which every provider sends unconditionally. Both carry
`tracking: true`, so `'tracking' in event` tells the two families apart
without a type-by-type list. `clicked` also carries `url`, the link clicked,
or `null` when the provider does not report one.

## No PII beyond what the provider already sends

`recipient` is the address the provider itself reports — never enriched from
your own data. `raw` is the provider's payload, untouched: for `opened` and
`clicked`, some providers put more inside it, including the recipient's IP
address and user agent (Resend's `click.ipAddress`, `click.userAgent`). Read
`raw` only when you have decided you want that, and never persist it without
a reason — an IP address is personal data like any other.

## An absence is `null`; a failure throws

A webhook subpath answers `null` for an event type it does not map — Resend
also sends `email.sent`, `email.scheduled`, `email.failed`, `email.received`
and `email.suppressed`, none of them mapped here — as an absence, never a
throw:

```ts
const event = await webhook.verify(request);
if (event === null) return new Response(null, { status: 202 }); // acknowledged, nothing to act on
```

What throws is a request that cannot be **trusted**: a signature that does
not match, or a timestamp too old or too far in the future.
`MailWebhookRefused` carries a `code`:

| `code` | When |
| --- | --- |
| `INVALID_SIGNATURE` | A `svix-*` header is missing, the signature does not match any of the ones sent, or the body was not the exact raw text the signature was computed over |
| `EXPIRED_TIMESTAMP` | `svix-timestamp` sits outside the tolerance, either way |

Both mean the same thing to a handler — answer `401`, and never retry: a
signature is either fixed by giving `verify` the right raw body and secret,
or the request was never a genuine webhook.

```ts
import { MailWebhookRefused } from '@nxgt/mail';

try {
	const event = await webhook.verify(request);
	// …
} catch (error) {
	if (error instanceof MailWebhookRefused) return new Response(null, { status: 401 });
	throw error;
}
```

## Writing a second provider's mapping

`@nxgt/mail/conformance` exports `sampleMailEvent` and `checkMailEvent`, the
same way it exports `sampleMessage` for a transport: a package mapping a
second provider's webhook to `MailEvent` can check its own mapping holds the
same invariants — a non-empty `messageId` and `recipient`, a valid
`timestamp`, `tags` of strings only, `bounceType` on every bounced event,
`tracking: true` and (for `clicked`) a `url` on the two tracking events —
without depending on `@nxgt/mail-resend`.

```ts
import { checkMailEvent, sampleMailEvent } from '@nxgt/mail/conformance';

const event = mapMyProviderWebhook(examplePayload);
checkMailEvent(event); // throws if the mapping breaks the shape
```

There is no `describeMailEvent` suite of cases yet, the way `describeMailer`
runs the whole port against a transport — see the
[roadmap](../roadmap.md#later) — because there is only one provider mapping
`@nxgt/mail` so far; `checkMailEvent` grows into one the day a second exists.

## See also

- [`@nxgt/mail-resend/webhooks`](https://github.com/softistx/nxgt-mail/tree/develop/packages/mail-resend#webhooks--delivery-events) —
  verifies Resend's signature and answers `MailEvent`.
- SMTP has no webhooks of its own: an SMTP relay reports delivery through the
  MTA's own logs, or a bounce back to the envelope sender as a DSN
  (delivery status notification) e-mail — out of scope here; see
  [`@nxgt/mail-smtp`'s roadmap](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-smtp/docs/roadmap.md).
