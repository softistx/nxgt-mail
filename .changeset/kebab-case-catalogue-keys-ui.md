---
"@nxgt/mail-ui": minor
---

**Breaking.** The shared `common.*` messages of `uiCatalogues` move to
`kebab-case`, matching our convention (`@nxgt/mail-i18n` 0.4 still accepts
the old `camelCase` form too, so nothing throws — but an override under the
old key is now silently unread, and a template still calling the old key
fails the build; see the troubleshooting entry for the exact error). The
renamed keys, old → new:

- `common.avatarGroup.more` → `common.avatar-group.more`
- `common.metrics.ofTarget` → `common.metrics.of-target`
- `common.metrics.thisPeriod` → `common.metrics.this-period`
- `common.metrics.lastPeriod` → `common.metrics.last-period`
- `common.seeAlso` → `common.see-also`
- `common.countBadge.label` → `common.count-badge.label`
- `common.fileList.empty` → `common.file-list.empty`
- `common.fileList.download` → `common.file-list.download`
- `common.fileList.size` → `common.file-list.size`
- `common.postalAddress` → `common.postal-address`
- `common.openingHours.label` → `common.opening-hours.label`
- `common.openingHours.closed` → `common.opening-hours.closed`
- `common.openingHours.days.*` → `common.opening-hours.days.*`

Every other `common.*` key is one word and unchanged (`common.greeting`,
`common.attributes`, `common.rating.star`, `common.footer.*`, `common.timeline.empty`, `common.contacts.*`). Rename the keys in any
`locales/<locale>.json` override that touches them; the components
themselves need no change.
