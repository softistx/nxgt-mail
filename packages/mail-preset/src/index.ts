/**
 * `@nxgt/mail-preset` — the default preset of `@nxgt/mail-build`: neutral
 * theme tokens tuned for e-mail clients, a transactional layout, components,
 * and the shared messages in English and French. Build time only.
 *
 * ```ts
 * export default defineMailConfig({
 *   presets: [nxgtPreset({ brand: { primary: '#4f46e5' } })],
 *   locales: ['en', 'fr'],
 *   fallbackLocale: 'en',
 * });
 * ```
 */

import type { Preset } from '@nxgt/mail-build';
import { components } from './components';
import { messages } from './messages';
import { defaultTheme, type NxgtTheme } from './theme';

export type { NxgtTheme } from './theme';

export interface NxgtPresetOptions {
	/** The brand in one place: the accent, and the logo at the top. */
	readonly brand?: {
		/** `color.primary`: the button and the links. */
		readonly primary?: string;
		/** `color.onPrimary`: text written on the accent. */
		readonly onPrimary?: string;
		/** An `http:` or `https:` URL, shown at the top of every e-mail. */
		readonly logo?: string;
		/** The logo's alternative text. */
		readonly name?: string;
	};
	/** Any token, one at a time: `{ color: { canvas: '#ffffff' } }`. */
	readonly theme?: {
		readonly [Namespace in keyof NxgtTheme]?: Partial<NxgtTheme[Namespace]>;
	};
}

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

function checkKeys(
	where: string,
	value: unknown,
	known: readonly string[],
	what: string,
): Record<string, unknown> {
	if (!isObject(value)) {
		throw new TypeError(`nxgtPreset: ${where} must be an object`);
	}
	for (const key of Object.keys(value)) {
		if (!known.includes(key)) {
			throw new TypeError(
				`nxgtPreset: ${where}.${key} is not ${what} — one of ${known.join(', ')}`,
			);
		}
	}
	return value;
}

function checkString(where: string, value: unknown): string | undefined {
	if (value !== undefined && typeof value !== 'string') {
		throw new TypeError(`nxgtPreset: ${where} must be a string`);
	}
	return value;
}

/**
 * The default preset: `TransactionalLayout`, `MailHeading`, `MailText`,
 * `MailButton`, `MailLink`, `MailDivider`, `MailSpacer` and `MailCode`; the
 * tokens of {@link NxgtTheme}; and `common.greeting`, `common.footer.why`,
 * `common.footer.ignore` in `en` and `fr`. Every option is optional; a token
 * the preset does not have is refused, by the compiler and at run time.
 */
export function nxgtPreset(options: NxgtPresetOptions = {}): Preset {
	const { brand = {}, theme = {} } = checkKeys(
		'options',
		options,
		['brand', 'theme'],
		'an option',
	) as NxgtPresetOptions;
	checkKeys(
		'brand',
		brand,
		['primary', 'onPrimary', 'logo', 'name'],
		'a brand option',
	);
	const logo = checkString('brand.logo', brand.logo) ?? null;
	if (logo !== null && !/^https?:\/\//i.test(logo)) {
		throw new TypeError(
			'nxgtPreset: brand.logo must be an http: or https: URL',
		);
	}
	const name = checkString('brand.name', brand.name) ?? '';
	if (logo === null && brand.name !== undefined) {
		throw new TypeError(
			"nxgtPreset: brand.name is the logo's alternative text — give brand.logo too",
		);
	}

	checkKeys(
		'theme',
		theme,
		Object.keys(defaultTheme),
		'a theme namespace of the preset',
	);
	const tokens: Record<string, Record<string, string>> = {};
	for (const [namespace, defaults] of Object.entries(defaultTheme)) {
		const overrides = checkKeys(
			`theme.${namespace}`,
			theme[namespace as keyof NxgtTheme] === undefined
				? {}
				: theme[namespace as keyof NxgtTheme],
			Object.keys(defaults),
			'a token of the preset',
		);
		const merged: Record<string, string> = { ...defaults };
		for (const [token, value] of Object.entries(overrides)) {
			const checked = checkString(`theme.${namespace}.${token}`, value);
			if (checked !== undefined) merged[token] = checked;
		}
		tokens[namespace] = merged;
	}
	const color = tokens.color ?? {};
	const primary = checkString('brand.primary', brand.primary);
	if (primary !== undefined) color.primary = primary;
	const onPrimary = checkString('brand.onPrimary', brand.onPrimary);
	if (onPrimary !== undefined) color.onPrimary = onPrimary;

	return {
		name: 'nxgt',
		theme: tokens,
		components: components({ logo, name }),
		messages,
	};
}
