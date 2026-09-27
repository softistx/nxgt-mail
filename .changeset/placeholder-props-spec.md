---
"@nxgt/mail-ui": patch
---

A generic spec now checks every prop of every component against `placeholder('x')`: read from each component's own `defineProps`, so a new component or prop with no declared expectation fails it. It found three props that silently corrupted or mis-rendered a placeholder instead of failing the build: `NxAvatar`'s `size`, `NxAvatarGroup`'s `max`, and `NxLayout`'s `width` now throw the same "must be a number known when the e-mail is built" message `NxProgress`, `NxCountBadge` and `NxRating` already did.
