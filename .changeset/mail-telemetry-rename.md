---
"@nxgt/mail": minor
---

`@nxgt/mail/telemetry`'s `withTelemetry` and `withRendererTelemetry` are renamed to `withMailTelemetry` and `withMailRendererTelemetry` — `@nxgt/telemetry` exports its own `withTelemetry`, colliding for a project importing both. The old names are kept as `@deprecated` aliases of the same functions (no behaviour change, no runtime warning), removed in 1.0.
