import type { Catalogues } from '@nxgt/mail-build';

/**
 * The shared messages, in every locale the preset translates. An application
 * overrides one key by writing it in its own catalogue; a locale the preset
 * does not translate must write every key.
 */
export const messages: Catalogues = {
	en: {
		common: {
			greeting: 'Hello {name},',
			footer: {
				why: 'You are receiving this e-mail because of an action on your account.',
				ignore: 'If you did not ask for this, you can ignore this e-mail.',
			},
		},
	},
	fr: {
		common: {
			greeting: 'Bonjour {name},',
			footer: {
				why: 'Vous recevez cet e-mail suite à une action sur votre compte.',
				ignore:
					'Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail.',
			},
		},
	},
};
