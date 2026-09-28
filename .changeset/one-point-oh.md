---
"@nxgt/mail": major
"@nxgt/mail-smtp": major
"@nxgt/mail-resend": major
"@nxgt/mail-config": major
"@nxgt/mail-i18n": major
"@nxgt/mail-ui": major
"@nxgt/mail-presets": major
---

1.0.0: the surface is stable. From here, a breaking change waits for the next major; the policies are in `docs/plan-1.0.md`.

Every internal peer moves to `^1.0.0` in this release, so upgrade the `@nxgt/mail*` packages together.

The one breaking change: `@nxgt/mail` drops the three aliases deprecated in 0.9, as their doc comments announced. Rename them when you upgrade:

- `withTelemetry` → `withMailTelemetry`
- `withRendererTelemetry` → `withMailRendererTelemetry`
- `RetryOptions` → `MailRetryOptions`

The other six packages change no API. A prebuilt format-1 build still reads with any `@nxgt/mail` (`MANIFEST_FORMAT` stays 1), so a package that ships one can peer `@nxgt/mail` `>=0.1.0 <2`.
