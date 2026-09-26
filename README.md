# nxgt-mail

Transactional e-mails that are **typed, translated, and rendered with no engine
at run time**.

Write one template per e-mail with [Maizzle](https://maizzle.com) and Tailwind
CSS 4, and one [ICU](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
message catalogue per language. A build step compiles both into render
functions whose arguments are checked by TypeScript:

```ts
import { mails } from './generated/mail';

const { subject, html, text } = mails.verifyEmail({
  locale: 'fr',
  name: 'Ada',
  link: 'https://example.test/verify?token=…',
  hours: 24,
});
```

A missing or misspelled argument, an unknown locale or an unknown e-mail is a
compile error. At run time there is string substitution and `Intl`, nothing
else. Presets ship a theme, layouts, components and shared messages, and every
piece of them can be overridden or replaced.

## Status

**Not released yet.** Work follows [docs/plan.md](./docs/plan.md).

| Package | Role |
| --- | --- |
| `@nxgt/mail` | The `Mailer` port, errors, locale selection, a memory mailer, the transport conformance suite |
| `@nxgt/mail-build` | The compiler and the `nxgt-mail` CLI — a build-time dependency only |
| `@nxgt/mail-preset` | The default preset: theme, layouts, components, shared messages in English and French |
| `@nxgt/mail-smtp`, `@nxgt/mail-resend` | Transports |

## Contributing

Read [AGENTS.md](./AGENTS.md) — it applies to people as much as to agents.

## License

MIT
