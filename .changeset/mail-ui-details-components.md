---
'@nxgt/mail-ui': minor
---

Add the details components, in the style of `@nxgt/material-vue`: `NxEventChip` (an invitation's date and time, its tint mixed at build time), `NxAttributes`, `NxPostalAddress` (its country named in each locale), `NxOpeningHours`, `NxContacts` (linked with `mailto:` and `tel:`), `NxFileList` (attachments or downloads, the size written by locale) and `NxRating` (read only, or a row of review links).

Their words are 21 new shared messages in `uiCatalogues`, in `en` and `fr`: `common.attributes`, `common.postalAddress`, `common.openingHours.*`, `common.contacts.*`, `common.fileList.*` and `common.rating.star`. A project with a locale other than `en` and `fr` writes them in its own catalogue, or its build fails on the first one missing, as for the other `common` keys — see [Another locale](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-ui/docs/guide/messages.md#another-locale).
