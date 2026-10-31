---
'@nxgt/mail': minor
---

Add `@nxgt/mail/unsubscribe-token`: `signUnsubscribeToken(claims, secret)` and `verifyUnsubscribeToken(token, secret)`, the signed token a `listUnsubscribe` URL carries. HMAC-SHA256 over `node:crypto`, `base64url(claims).base64url(signature)`, claims any JSON value but `null`, constant-time comparison, `null` for anything the secret did not sign, and a `TypeError` for a secret under 32 characters. A new subpath, so `@nxgt/mail` itself still imports no Node built-in.
