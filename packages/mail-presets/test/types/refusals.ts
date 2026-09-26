/**
 * What `@nxgt/mail-presets` refuses at COMPILE time.
 *
 * Checked by `tsc --noEmit`, never run. Every `@ts-expect-error` here is a
 * refusal that stops holding the moment the directive goes unused. The
 * calls that **must keep compiling** are here too, unmarked.
 *
 * **Three plausible mistakes, three refused.**
 */

import { i18n } from '@nxgt/mail-i18n';
import { type PresetName, presets } from '../../src/index';

// Must keep compiling.
const mails = presets({ only: ['verify-email', 'reset-password'] });
const plugin = i18n({
	locales: ['en', 'fr'],
	catalogues: [mails.catalogues],
	templates: [mails.templates],
});
const name: PresetName = 'magic-link';

// @ts-expect-error — a preset that does not exist.
presets({ only: ['sign-in'] });

// @ts-expect-error — only is a list.
presets({ only: 'welcome' });

// @ts-expect-error — the whole templates source, not its folder alone.
i18n({ locales: ['en'], templates: [mails.templates.dir] });

export { name, plugin };
