/**
 * What `@nxgt/mail-i18n` refuses at COMPILE time.
 *
 * Checked by `tsc --noEmit`, never run. Every `@ts-expect-error` here is a
 * refusal that stops holding the moment the directive goes unused — so a
 * refusal that quietly weakens fails the typecheck instead of passing
 * unnoticed. The count is in the README; a count that goes down is a
 * regression.
 *
 * The calls that **must keep compiling** are here too, unmarked: a refusal
 * that refuses the correct call is a bug.
 *
 * A message key is a `string`: whether it exists is checked by the build,
 * against the catalogues, not by the compiler.
 *
 * **Sixteen plausible mistakes, sixteen refused.**
 */

import type { MailPlugin } from '@nxgt/mail-config';
import type { ComponentCustomProperties } from 'vue';
import { type Catalogue, createTranslator, i18n } from '../../src/index';

// Must keep compiling.
const plugin: MailPlugin = i18n({
	locales: ['en', 'fr'],
	fallbackLocale: 'en',
	dir: 'locales',
	emails: 'emails',
	layout: 'flat',
	catalogues: [{ en: { common: { greeting: 'Hello {name},' } } }],
	templates: [{ dir: '/app/node_modules/pkg/emails', emails: ['welcome'] }],
});
const catalogue: Catalogue = { verifyEmail: { subject: 'Confirm, {name}' } };
const t = createTranslator({ en: catalogue }, () => 'en');
t('verifyEmail.subject', { name: 'Ada', count: 2, at: new Date() }, 'en');
declare const template: ComponentCustomProperties;
template.t('verifyEmail.title', { minutes: 15 });
template.placeholder('link');
template.locale.toUpperCase();

// 1. The plugin called with no locales.
// @ts-expect-error — locales is required.
i18n({});

// 2. One locale as a string.
// @ts-expect-error — locales is a list.
i18n({ locales: 'en' });

// 3. A layout that does not exist.
// @ts-expect-error — nested or flat.
i18n({ locales: ['en'], layout: 'tree' });

// 4. A catalogue with a leaf that is not a message.
// @ts-expect-error — a leaf is an ICU string.
const broken: Catalogue = { verifyEmail: { expires: 15 } };

// 5. A language provider that answers nothing usable.
// @ts-expect-error — a locale, or a function that answers one.
createTranslator({ en: catalogue }, 1);

// 6. An argument that is an object.
// @ts-expect-error — a string, a number or a Date.
t('verifyEmail.subject', { name: { first: 'Ada' } });

// 7. A placeholder named by something that is not a name.
// @ts-expect-error — placeholder('name').
template.placeholder(1);

// 8. A template that assigns its locale.
// @ts-expect-error — the locale is the build's.
template.locale = 'de';

// 9. A fallback locale that is not a tag.
// @ts-expect-error — a locale, as 'en'.
i18n({ locales: ['en'], fallbackLocale: 1 });

// 10. A folder that is not a path.
// @ts-expect-error — a folder of the project.
i18n({ locales: ['en'], emails: 1 });

// 11. A key that is not a string, in a template.
// @ts-expect-error — t('verifyEmail.title').
template.t(1);

// 12. A language that is not a locale, per call.
// @ts-expect-error — a locale, or a function that answers one.
t('verifyEmail.subject', {}, 1);

// 13. Package catalogues given as one, not a list.
// @ts-expect-error — a list of catalogues by locale.
i18n({ locales: ['en'], catalogues: { en: {} } });

// 14. Package catalogues whose locale holds a message, not a catalogue.
// @ts-expect-error — { en: { common: {...} } }.
i18n({ locales: ['en'], catalogues: [{ en: 'Hello' }] });

// 15. Package templates given as one folder, not a list.
// @ts-expect-error — a list of template folders.
i18n({ locales: ['en'], templates: { dir: '/pkg/emails' } });

// 16. A package's e-mails given as one name, not a list.
const pkg = '/pkg/emails';
// @ts-expect-error — ['welcome'].
i18n({ locales: ['en'], templates: [{ dir: pkg, emails: 'welcome' }] });

export { broken, plugin };
