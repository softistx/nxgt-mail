import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { isMainThread } from 'node:worker_threads';
import { defineMailPlugin, type MailPlugin } from '@nxgt/mail-config';
import { type Catalogue, checkCatalogues, type Messages } from './catalogues';
import { buildManifest } from './manifest';
import { templateProperties } from './template';
import { createFormatter } from './translator';
import {
	type Layout,
	parseEntry,
	watchTemplates,
	writeWrappers,
} from './wrappers';

export interface I18nOptions {
	/** Every locale the project writes, as BCP 47 tags: `['en', 'fr']`. */
	readonly locales: readonly string[];
	/** The reference every other locale is checked against. Default the first locale. */
	readonly fallbackLocale?: string;
	/** The folder of `<locale>.json` catalogues. Default `locales`. */
	readonly dir?: string;
	/** The folder of templates. Default `emails`. */
	readonly emails?: string;
	/** `nested` writes `dist/en/verify-email.html`; `flat` writes `dist/verify-email.en.html`. Default `nested`. */
	readonly layout?: Layout;
}

/** Where the wrappers go, under the project. */
export const WRAPPERS_DIR = '.maizzle/i18n';

/** The manifest's name, in the output folder. */
export const MANIFEST_FILE = 'mail-manifest.json';

const LOCALE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

function checkOptions(options: I18nOptions): void {
	if (typeof options !== 'object' || options === null) {
		throw new TypeError(
			"i18n: options must be an object, as { locales: ['en', 'fr'] }",
		);
	}
	const { locales } = options;
	if (!Array.isArray(locales) || locales.length === 0) {
		throw new TypeError(
			"i18n: locales must hold at least one locale, as ['en', 'fr']",
		);
	}
	for (const locale of locales) {
		if (typeof locale !== 'string' || !LOCALE.test(locale)) {
			throw new TypeError(
				'i18n: locales holds something that is not a locale — write each as a BCP 47 tag, as en or pt-BR',
			);
		}
	}
	if (new Set(locales).size !== locales.length) {
		throw new TypeError('i18n: locales holds the same locale twice');
	}
	if (
		options.fallbackLocale !== undefined &&
		!locales.includes(options.fallbackLocale)
	) {
		throw new TypeError('i18n: fallbackLocale must be one of locales');
	}
	for (const key of ['dir', 'emails'] as const) {
		const value = options[key];
		if (value !== undefined && (typeof value !== 'string' || value === '')) {
			throw new TypeError(`i18n: ${key} must be a folder of the project`);
		}
	}
	if (
		options.layout !== undefined &&
		options.layout !== 'nested' &&
		options.layout !== 'flat'
	) {
		throw new TypeError("i18n: layout must be 'nested' or 'flat'");
	}
}

/** Reads `<dir>/<locale>.json` for each locale. A missing or broken file **throws**. */
function readCatalogues(
	dir: string,
	dirName: string,
	locales: readonly string[],
): Record<string, Catalogue> {
	const out: Record<string, Catalogue> = {};
	for (const locale of locales) {
		const file = join(dir, `${locale}.json`);
		const name = `${dirName}/${locale}.json`;
		if (!existsSync(file)) {
			throw new Error(
				`i18n: ${name} is missing — every locale has a catalogue`,
			);
		}
		try {
			out[locale] = JSON.parse(readFileSync(file, 'utf8'));
		} catch {
			throw new Error(`i18n: ${name} is not valid JSON`);
		}
	}
	return out;
}

/**
 * The i18n plugin, for `defineMailConfig`:
 *
 * ```ts
 * defineMailConfig({ plugins: [i18n({ locales: ['en', 'fr'] })] });
 * ```
 *
 * It checks `locales/<locale>.json`, writes one wrapper per template and
 * locale under `.maizzle/i18n/` so one build writes every locale, gives each
 * template `t`, `locale` and `placeholder`, and writes
 * `dist/mail-manifest.json`. A catalogue or a template that cannot be right
 * **fails the build**, naming the locale and the key.
 */
export function i18n(options: I18nOptions): MailPlugin {
	checkOptions(options);
	const { locales } = options;
	const fallbackLocale = options.fallbackLocale ?? (locales[0] as string);
	const layout = options.layout ?? 'nested';
	const dirName = options.dir ?? 'locales';
	const emailsName = options.emails ?? 'emails';
	const cwd = process.cwd();
	const emailsDir = resolve(cwd, emailsName);
	const wrappersDir = resolve(cwd, WRAPPERS_DIR);

	const messages = checkCatalogues(
		readCatalogues(resolve(cwd, dirName), dirName, locales),
		locales,
		fallbackLocale,
	);
	const reference = messages.get(fallbackLocale) as Messages;
	const format = createFormatter('i18n');
	const regenerate = () =>
		writeWrappers({ emailsDir, emailsName, wrappersDir, locales, layout });
	// A parallel build loads the config again in each worker: only the main
	// thread writes, so two workers never write the same file.
	if (isMainThread) regenerate();

	return defineMailPlugin({
		name: 'i18n',
		content: [`${wrappersDir}/**/*.vue`],
		// `maizzle serve` watches locales/ already; another folder is added.
		...(dirName === 'locales' ? {} : { server: { watch: [`${dirName}/**`] } }),
		vite: { plugins: [watchTemplates(emailsDir, regenerate)] },
		beforeRender({ config, template }) {
			const path = relative(
				wrappersDir,
				join(template.path.dir, template.path.name),
			)
				.split(sep)
				.join('/');
			const entry = parseEntry(path, layout, locales);
			if (entry === null) {
				throw new Error(
					`i18n: ${relative(cwd, join(template.path.dir, template.path.base))} is not built through the i18n plugin — leave content to it, and put templates in ${emailsName}/`,
				);
			}
			config.vue ??= {};
			config.vue.globalProperties = {
				...config.vue.globalProperties,
				...templateProperties({
					...entry,
					messages: messages.get(entry.locale) as Messages,
					reference,
					format,
				}),
			};
		},
		afterBuild({ files, config }) {
			const outputDir = resolve(cwd, config.output?.path ?? 'dist');
			const manifest = buildManifest({
				files,
				outputDir,
				htmlExtension: config.output?.extension ?? 'html',
				layout,
				locales,
				fallbackLocale,
				messages,
			});
			writeFileSync(
				join(outputDir, MANIFEST_FILE),
				`${JSON.stringify(manifest, null, '\t')}\n`,
			);
		},
	});
}
