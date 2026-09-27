/**
 * The messages the layouts and templates share, in `en` and `fr`, for
 * `@nxgt/mail-i18n`:
 *
 * ```ts
 * i18n({ locales: ['en', 'fr'], catalogues: [uiCatalogues] })
 * ```
 *
 * The project's `locales/<locale>.json` overrides any of them key by key. A
 * project in another locale writes the `common` keys itself.
 */
export const uiCatalogues = {
	en: {
		common: {
			greeting: 'Hello {name},',
			avatarGroup: { more: '{count, plural, other {# more}}' },
			timeline: { empty: 'No activity yet' },
			footer: {
				why: 'You received this e-mail because you have an account with {brand}.',
				ignore: 'If you did not ask for this, you can ignore this e-mail.',
			},
		},
	},
	fr: {
		common: {
			greeting: 'Bonjour {name},',
			avatarGroup: { more: '{count, plural, one {# autre} other {# autres}}' },
			timeline: { empty: 'Aucune activité pour le moment' },
			footer: {
				why: 'Vous recevez cet e-mail parce que vous avez un compte chez {brand}.',
				ignore:
					"Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.",
			},
		},
	},
} as const;
