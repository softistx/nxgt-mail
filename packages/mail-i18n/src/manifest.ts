import { readFileSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';
import type { Messages } from './catalogues';
import { createFormatter } from './translator';
import { type Entry, entryPath, type Layout, parseEntry } from './wrappers';

/** One e-mail, as the renderer reads it. */
export interface ManifestEmail {
	/** Every placeholder of the e-mail, in any locale, sorted. */
	readonly variables: readonly string[];
	/**
	 * The placeholders a URL attribute starts with — `href`, `src`,
	 * `background`, `poster`, `action`: they decide the scheme, so a URL fills
	 * them. One later in the value, as `?token={{ token }}`, is not one.
	 */
	readonly urlVariables: readonly string[];
	/** The subject per locale, its placeholders kept as `{{ name }}`. */
	readonly subject: Readonly<Record<string, string>>;
	/** The built files per locale, relative to the output folder. */
	readonly files: Readonly<
		Record<string, { readonly html: string; readonly text: string | null }>
	>;
}

/** `dist/mail-manifest.json`: what the build wrote, for the renderer. */
export interface Manifest {
	readonly locales: readonly string[];
	readonly fallbackLocale: string;
	readonly emails: Readonly<Record<string, ManifestEmail>>;
}

// Copied in packages/mail/src/renderer.ts, which reads this manifest: change both.
const PLACEHOLDER = /\{\{\s*([a-z][a-zA-Z0-9]*)\s*\}\}/g;
/** An attribute that holds a URL, its value starting with a placeholder: that placeholder is the whole scheme. */
const URL_ATTRIBUTE =
	/\s(?:href|src|background|poster|action)\s*=\s*(?:"\s*(\{\{[^"]*)"|'\s*(\{\{[^']*)')/gi;

/** `{{ name }}` — what `placeholder('name')` writes. */
export const placeholderMark = (name: string) => `{{ ${name} }}`;

const placeholdersIn = (text: string) =>
	[...text.matchAll(PLACEHOLDER)].map((match) => match[1] as string);

/** `auth/reset-password` → `auth.resetPassword`: where its messages live. */
export const emailKey = (email: string) =>
	email
		.split('/')
		.map((segment) =>
			segment.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase()),
		)
		.join('.');

/**
 * The subject of `email` in `locale`: the message `<emailKey>.subject`, each
 * argument a placeholder. A missing subject, or one with an argument that is
 * not a string, **throws**.
 */
function subjectOf(
	email: string,
	locale: string,
	messages: Messages,
	format: ReturnType<typeof createFormatter>,
): string {
	const key = `${emailKey(email)}.subject`;
	const message = messages.get(key);
	if (message === undefined) {
		throw new Error(
			`i18n: ${email} has no subject — add ${key} to the catalogues`,
		);
	}
	const args: Record<string, string> = {};
	for (const [name, kind] of message.args) {
		if (message.selects.has(name)) {
			throw new Error(
				`i18n: ${locale}: ${key} chooses on {${name}} with a select — a subject's arguments are placeholders, which always choose other`,
			);
		}
		if (kind !== 'string') {
			throw new Error(
				`i18n: ${locale}: ${key} uses {${name}} as a ${kind} — a subject's arguments are placeholders, filled at send time as strings`,
			);
		}
		args[name] = placeholderMark(name);
	}
	return format(locale, key, message.text, args);
}

/** One e-mail in one locale, as found in the build's files. */
interface Built {
	readonly entry: Entry;
	html: string | null;
	text: string | null;
}

const sorted = (values: Iterable<string>) => [...new Set(values)].sort();

/**
 * Reads what the build wrote — `files`, absolute, under `outputDir` — and
 * answers the manifest: for each e-mail its placeholders, those in a URL, its
 * subject per locale and its files.
 */
export function buildManifest(options: {
	readonly files: readonly string[];
	readonly outputDir: string;
	readonly htmlExtension: string;
	readonly layout: Layout;
	readonly locales: readonly string[];
	readonly fallbackLocale: string;
	readonly messages: ReadonlyMap<string, Messages>;
}): Manifest {
	const { layout, locales } = options;
	const format = createFormatter('i18n');
	const found = new Map<string, Built>();
	for (const file of options.files) {
		const path = relative(options.outputDir, file).split(sep).join('/');
		if (path.startsWith('../') || isAbsolute(path)) {
			throw new Error(
				`i18n: ${path} was written outside the output folder — the i18n plugin lays out every e-mail; set no plaintext.destination and no output path in a template`,
			);
		}
		const dot = path.lastIndexOf('.');
		const base = path.slice(0, Math.max(dot, 0));
		const entry = dot > 0 ? parseEntry(base, layout, locales) : null;
		if (entry === null) {
			throw new Error(
				`i18n: ${path} is not where the i18n plugin puts an e-mail — set no output path in a template`,
			);
		}
		const seen = found.get(base) ?? { entry, html: null, text: null };
		if (path.slice(dot + 1) === options.htmlExtension) seen.html = path;
		else seen.text = path;
		found.set(base, seen);
	}

	const emails: Record<string, ManifestEmail> = {};
	for (const email of sorted(
		[...found.values()].map((seen) => seen.entry.email),
	)) {
		const variables: string[] = [];
		const urlVariables: string[] = [];
		const subject: Record<string, string> = {};
		const files: Record<string, { html: string; text: string | null }> = {};
		for (const locale of locales) {
			const seen = found.get(entryPath({ email, locale }, layout));
			if (seen?.html == null) {
				throw new Error(`i18n: ${email} was not built in ${locale}`);
			}
			const html = readFileSync(join(options.outputDir, seen.html), 'utf8');
			// Vue renders an unresolved component as nothing, and Maizzle still
			// writes the doctype: the build would pass with an empty e-mail.
			if (html.replace(/<!doctype[^>]*>/i, '').trim() === '') {
				throw new Error(
					`i18n: ${seen.html} is empty — a tag of its template resolved to no component; list the plugin that brings it, as ui()`,
				);
			}
			variables.push(...placeholdersIn(html));
			for (const match of html.matchAll(URL_ATTRIBUTE)) {
				urlVariables.push(
					...placeholdersIn(match[1] ?? match[2] ?? '').slice(0, 1),
				);
			}
			// A <Plaintext> block is in the text part only.
			if (seen.text !== null) {
				const text = readFileSync(join(options.outputDir, seen.text), 'utf8');
				variables.push(...placeholdersIn(text));
			}
			subject[locale] = subjectOf(
				email,
				locale,
				options.messages.get(locale) as Messages,
				format,
			);
			variables.push(...placeholdersIn(subject[locale]));
			files[locale] = { html: seen.html, text: seen.text };
		}
		emails[email] = {
			variables: sorted(variables),
			urlVariables: sorted(urlVariables),
			subject,
			files,
		};
	}
	return {
		locales: [...locales],
		fallbackLocale: options.fallbackLocale,
		emails,
	};
}
