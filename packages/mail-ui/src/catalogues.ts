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
			'avatar-group': { more: '{count, plural, other {# more}}' },
			timeline: { empty: 'No activity yet' },
			metrics: {
				'of-target': 'of {target}',
				'this-period': 'This period',
				'last-period': 'Last period',
			},
			'see-also': 'See also',
			'count-badge': {
				label: '{count, plural, one {# notification} other {# notifications}}',
			},
			attributes: 'Attributes',
			'file-list': {
				empty: 'No files',
				download: 'Download',
				size: '{size} {unit, select, kb {KB} mb {MB} gb {GB} other {B}}',
			},
			'postal-address': 'Address',
			'opening-hours': {
				label: 'Opening hours',
				closed: 'Closed all day',
				days: {
					sunday: 'Sunday',
					monday: 'Monday',
					tuesday: 'Tuesday',
					wednesday: 'Wednesday',
					thursday: 'Thursday',
					friday: 'Friday',
					saturday: 'Saturday',
				},
			},
			contacts: {
				label: 'Contacts',
				types: {
					email: 'E-mail',
					fax: 'Fax',
					mobile: 'Mobile',
					phone: 'Phone',
					website: 'Website',
				},
			},
			rating: { star: '{value} of {max}' },
			footer: {
				why: 'You received this e-mail because you have an account with {brand}.',
				ignore: 'If you did not ask for this, you can ignore this e-mail.',
			},
		},
	},
	fr: {
		common: {
			greeting: 'Bonjour {name},',
			'avatar-group': {
				more: '{count, plural, one {# autre} other {# autres}}',
			},
			timeline: { empty: 'Aucune activité pour le moment' },
			metrics: {
				'of-target': 'sur {target}',
				'this-period': 'Cette période',
				'last-period': 'Période précédente',
			},
			'see-also': 'Voir aussi',
			'count-badge': {
				label: '{count, plural, one {# notification} other {# notifications}}',
			},
			attributes: 'Attributs',
			'file-list': {
				empty: 'Aucun fichier',
				download: 'Télécharger',
				size: '{size} {unit, select, kb {Ko} mb {Mo} gb {Go} other {o}}',
			},
			'postal-address': 'Adresse',
			'opening-hours': {
				label: "Horaires d'ouverture",
				closed: 'Fermé toute la journée',
				days: {
					sunday: 'Dimanche',
					monday: 'Lundi',
					tuesday: 'Mardi',
					wednesday: 'Mercredi',
					thursday: 'Jeudi',
					friday: 'Vendredi',
					saturday: 'Samedi',
				},
			},
			contacts: {
				label: 'Contacts',
				types: {
					email: 'E-mail',
					fax: 'Fax',
					mobile: 'Mobile',
					phone: 'Téléphone',
					website: 'Site web',
				},
			},
			rating: { star: '{value} sur {max}' },
			footer: {
				why: 'Vous recevez cet e-mail parce que vous avez un compte chez {brand}.',
				ignore:
					"Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.",
			},
		},
	},
} as const;
