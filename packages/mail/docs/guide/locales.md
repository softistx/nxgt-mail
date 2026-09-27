# Locales

This page is for choosing the locale an e-mail is rendered in. The locale of an
e-mail is **the recipient's** — usually a field of the user — and not the
language of the request that triggered the send.

```ts
import { pickLocale } from '@nxgt/mail';

const supported = ['en', 'fr'] as const;

pickLocale('fr-CA', supported, 'en'); // 'fr'
pickLocale(['de', 'fr', 'en'], supported, 'en'); // 'fr'
pickLocale(null, supported, 'en'); // 'en'
```

## `pickLocale`

```ts
type WantedLocales = string | null | undefined | readonly (string | null | undefined)[];

function pickLocale<const L extends string>(
	wanted: WantedLocales,
	supported: readonly L[],
	fallback: NoInfer<L>,
): L;
```

| Parameter | Type | Effect |
| --- | --- | --- |
| `wanted` | `WantedLocales` | The recipient's locales, most wanted first: their stored locale, then — when they are the visitor — their `Accept-Language`. `null`, `undefined` and empty strings are skipped, so a user field that may be missing goes in as is |
| `supported` | `readonly L[]` | The locales you have catalogues for. Its literal types become the answer's type |
| `fallback` | `L` | The answer when nothing wanted matches. Must be one of `supported`, which the compiler checks |

It answers one of `supported`, **spelled as in `supported`**, typed as their
union — `'en' | 'fr'` above — so it goes straight into whatever renders the
e-mail: your own function's `locale` argument, or the `locale` option of the
renderer, `mails.render(email, variables, { locale })` — see
[Rendering — choosing the locale](rendering.md#choosing-the-locale). With the
renderer, pass `mails.locales` as `supported`.

Pure: no request context, no global, no I/O.

### How a wanted locale matches

For each wanted locale **in turn**, the first that matches wins:

1. an exact match, ignoring case and `_` versus `-`;
2. a match on the language alone.

| `wanted` | `supported` | Answer | Why |
| --- | --- | --- | --- |
| `'fr'` | `['en', 'fr']` | `'fr'` | exact |
| `'fr-CA'`, `'fr_CA'` | `['en', 'fr']` | `'fr'` | the language, when the region is not supported |
| `'pt'` | `['en', 'pt-BR']` | `'pt-BR'` | the only Portuguese supported |
| `'PT-br'` | `['en', 'pt-BR']` | `'pt-BR'` | case does not matter; the supported spelling is answered |
| `'fr-CA'` | `['fr', 'fr-CA']` | `'fr-CA'` | exact beats language |
| `'fr-BE'` | `['fr-CA', 'fr']` | `'fr'` | the bare language beats another region |
| `['fr-CH', 'en']` | `['en', 'fr']` | `'fr'` | the **first** wanted locale wins, even when a later one is an exact match |
| `null`, `[]`, `['', null, 'de']` | `['en', 'fr']` | the fallback | nothing wanted, or nothing matching |

### What it refuses

A fallback outside `supported` is a compile error:

```ts
import { pickLocale } from '@nxgt/mail';

// @ts-expect-error — 'de' is not one of supported
pickLocale('fr', ['en', 'fr'], 'de');
```

At run time — when the list is built dynamically — the same mistakes throw a
bare `TypeError`, because they are wiring mistakes and not a request's:

| Mistake | `TypeError` message |
| --- | --- |
| `supported` is empty | `pickLocale: supported must hold at least one locale` |
| `fallback` is not in `supported` | `pickLocale: fallback must be one of supported` |

## `parseAcceptLanguage`

```ts
function parseAcceptLanguage(header: string | null | undefined): string[];
```

The locales of an `Accept-Language` header, most wanted first: ordered by their
`q` weight, ties keeping the header's order. `q=0` entries, `*` and empty
entries are dropped; a missing or empty header answers `[]`.

```ts
import { parseAcceptLanguage } from '@nxgt/mail';

parseAcceptLanguage('fr-CA,fr;q=0.9,en;q=0.8'); // ['fr-CA', 'fr', 'en']
parseAcceptLanguage('en;q=0.5, de, fr;q=0.5'); // ['de', 'en', 'fr']
parseAcceptLanguage('fr;q=0, *, , en'); // ['en']
parseAcceptLanguage(null); // []
```

Its answer is meant to be spread into `pickLocale`'s `wanted`, after the
recipient's stored locale.

## Whose locale

Use the request's `Accept-Language` **only when the recipient is the visitor**
— signing up, asking for a password reset — and only after any locale you have
stored for them. When someone else triggers the send — an administrator
inviting a user, a job sending a reminder — the request's language is the wrong
person's.

```ts
import { type Mailer, parseAcceptLanguage, pickLocale } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';

// The locales the build was made in, as a tuple for the Locale type; at run
// time they are also mails.locales.
const supported = ['en', 'fr'] as const;
type Locale = (typeof supported)[number];

const mails = createMailRenderer({ dir: 'dist' });

// The visitor is the recipient: their stored locale, then their browser's.
export function localeOfVisitor(request: Request, stored: string | null): Locale {
	return pickLocale([stored, ...parseAcceptLanguage(request.headers.get('accept-language'))], supported, 'en');
}

// Someone else is the recipient: their locale only, never the request's.
export async function invite(
	mailer: Mailer,
	invitee: { email: string; locale: string | null },
	invite: { organization: string; inviter: string; link: string; expiresIn: string },
): Promise<void> {
	const locale = pickLocale(invitee.locale, supported, 'en');
	await mailer.send({ to: invitee.email, ...mails.render('invitation', invite, { locale }) });
}
```

## See also

- [Rendering](rendering.md) — the renderer's `getLanguage` and `{ locale }`.
- [Sending](sending.md) — what to do with the rendered e-mail next.
