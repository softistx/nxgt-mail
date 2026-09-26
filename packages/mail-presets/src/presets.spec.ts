import { describe, expect, test } from 'bun:test';
import { emailKey } from '@nxgt/mail-i18n';
import { PRESETS, presetCatalogues, presets, TEMPLATES_DIR } from './presets';

const refuses = (options: unknown, message: string) =>
	expect(() => presets(options as never)).toThrow(new TypeError(message));

describe('presets — wiring mistakes', () => {
	test('refuses options that are not an object', () => {
		refuses(
			null,
			"presets: options must be an object, as { only: ['verify-email'] }",
		);
	});

	test('refuses only that is not a list of presets', () => {
		const empty =
			"presets: only must list at least one preset, as ['verify-email']";
		refuses({ only: [] }, empty);
		refuses({ only: 'welcome' }, empty);
		refuses(
			{ only: ['sign-in'] },
			`presets: only holds something that is not a preset — name one of ${PRESETS.join(', ')}`,
		);
		refuses(
			{ only: ['welcome', 'welcome'] },
			'presets: only holds the same preset twice',
		);
	});
});

describe('presets — what it answers', () => {
	test('every preset by default, with every message', () => {
		expect(presets()).toEqual({
			templates: { dir: TEMPLATES_DIR },
			catalogues: presetCatalogues,
		});
	});

	test('only the presets asked for, and their messages with the shared ones', () => {
		const { templates, catalogues } = presets({
			only: ['sign-in-code'],
		});
		expect(templates).toEqual({ dir: TEMPLATES_DIR, emails: ['sign-in-code'] });
		expect(Object.keys(catalogues.en ?? {})).toEqual(['presets', 'signInCode']);
		expect(Object.keys(catalogues.fr ?? {})).toEqual(['presets', 'signInCode']);
	});

	test('a template and a group of messages for every preset, in every locale', async () => {
		for (const name of PRESETS) {
			expect(await Bun.file(`${TEMPLATES_DIR}/${name}.vue`).exists()).toBe(
				true,
			);
			for (const catalogue of Object.values(presetCatalogues)) {
				expect(catalogue[emailKey(name)]).toBeObject();
			}
		}
	});
});
