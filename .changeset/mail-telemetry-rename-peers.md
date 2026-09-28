---
"@nxgt/mail-resend": patch
"@nxgt/mail-smtp": patch
---

The `@nxgt/mail` peer moves to `^0.9.0`: upgrade `@nxgt/mail` with it. No behaviour change here — `@nxgt/mail`'s `withTelemetry`/`withRendererTelemetry` rename to `withMailTelemetry`/`withMailRendererTelemetry` does not touch a transport.
