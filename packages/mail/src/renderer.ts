/**
 * `@nxgt/mail/renderer` — fills the files `maizzle build` wrote with
 * `@nxgt/mail-i18n`. Its own entry because it reads them with `node:fs`: the
 * main entry, which every transport imports, stays free of Node built-ins.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MailRefused } from './errors';
import { pickLocale, type WantedLocales } from './locale';
import type { Rendered } from './types';

/** The manifest's name in the build's output folder, as `@nxgt/mail-i18n` writes it. */
const MANIFEST_FILE = 'mail-manifest.json';

/**
 * The newest manifest format this renderer reads. It reads every format up
 * to this one, within 0.x: a build from any earlier `@nxgt/mail-i18n` 0.x
 * keeps working. A manifest without `formatVersion` is format 1, as
 * `@nxgt/mail-i18n` 0.1 and 0.2 wrote it. Copied in
 * packages/mail-i18n/src/manifest.ts: change both.
 */
export const MANIFEST_FORMAT = 1;

/**
 * A value only known at send time. A number is written as `String(n)`; any
 * other type is refused, so an object never renders as `[object Object]`.
 */
export type MailVariables = Readonly<Record<string, string | number>>;

/**
 * The e-mails of a build, each with the variables it takes: the `MailEmails`
 * that `@nxgt/mail-i18n` writes in `generated/mail.ts`.
 */
export type MailEmailsOf<E> = { readonly [K in keyof E]: MailVariables };

/** What any build takes, when the renderer is not given its `MailEmails`. */
export type AnyMailEmails = Readonly<Record<string, MailVariables>>;

/**
 * `render`'s arguments after the e-mail's name: its variables, which may be
 * left out when it takes none, and the options. An e-mail without variables
 * is `Readonly<Record<string, never>>`, as `@nxgt/mail-i18n`'s
 * `rendererTypes()` writes it: change both together.
 */
export type RenderArguments<V> =
	Readonly<Record<string, never>> extends V
		? [variables?: V, options?: RenderOptions]
		: [variables: V, options?: RenderOptions];

export interface MailRendererOptions {
	/** The build's output folder — where `mail-manifest.json` is — as `dist`. */
	readonly dir: string;
	/**
	 * The locales wanted, most wanted first, asked at each render — as
	 * `@nxgt/i18n`'s language provider: `() => user.locale`, or a Hono
	 * handler's `() => c.get('language')`. Picked with `pickLocale`. Default:
	 * none, so the fallback locale.
	 */
	readonly getLanguage?: () => WantedLocales;
	/** The locale when none wanted is built. Default the manifest's. */
	readonly fallbackLocale?: string;
}

export interface RenderOptions {
	/** Render in this locale, one the build wrote, rather than asking `getLanguage`. */
	readonly locale?: string;
}

/**
 * Given the build's `MailEmails`, an unknown e-mail, a missing or unknown
 * variable, or a number for a URL is a compile error; without it, any name
 * and any variables compile, and the same mistakes throw.
 */
export interface MailRenderer<E extends MailEmailsOf<E> = AnyMailEmails> {
	/** The e-mails of the build, sorted, as `['reset-password', 'verify-email']`. */
	readonly emails: readonly (keyof E & string)[];
	/** The locales of the build. */
	readonly locales: readonly string[];
	/**
	 * `email` in the wanted locale, every `{{ variable }}` filled: escaped in
	 * `html`, as is in `text` and the subject. A missing or unknown variable,
	 * an unknown e-mail or locale **throws** an `Error`; a URL variable that
	 * is not an `http:`, `https:` or `mailto:` URL throws `MailRefused`.
	 */
	render<N extends keyof E & string>(
		email: N,
		...rest: RenderArguments<E[N]>
	): Rendered;
}

/** One e-mail in one locale, read. */
interface Parts {
	readonly subject: string;
	readonly html: string;
	readonly text: string;
}

interface Email {
	readonly variables: ReadonlySet<string>;
	readonly urlVariables: ReadonlySet<string>;
	readonly locales: ReadonlyMap<string, Parts>;
}

/**
 * `{{ name }}` — what `@nxgt/mail-i18n`'s `placeholder('name')` writes. A
 * copy of `PLACEHOLDER` in `packages/mail-i18n/src/manifest.ts`, as is the
 * manifest's shape below: change both, or a declared variable goes unfilled.
 */
const PLACEHOLDER = /\{\{\s*([a-z][a-zA-Z0-9]*)\s*\}\}/g;

/** A line break a header would split on: each run becomes one space. */
const LINE_BREAKS = /[\r\n\v\f\u0085\u2028\u2029]+/g;

/** What a URL variable may hold: a scheme a mail client cannot run. */
const SAFE_URL = /^(?:https?:\/\/|mailto:)/i;

/** Whitespace, a control, a quote or a bracket: what no URL holds as is. */
const hasUnsafeUrlChar = (value: string) =>
	[...value].some((char) => {
		const code = char.codePointAt(0) ?? 0;
		return code < 0x21 || code === 0x7f || /[\s"'<>`]/.test(char);
	});

const HTML_ESCAPES: Readonly<Record<string, string>> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
};

const escapeHtml = (value: string) =>
	value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringList = (value: unknown): value is string[] =>
	Array.isArray(value) && value.every((item) => typeof item === 'string');

function checkOptions(options: MailRendererOptions): void {
	if (!isObject(options)) {
		throw new TypeError(
			"createMailRenderer: options must be an object, as { dir: 'dist' }",
		);
	}
	if (typeof options.dir !== 'string' || options.dir.trim() === '') {
		throw new TypeError(
			'createMailRenderer: dir must be the folder maizzle build wrote, as dist',
		);
	}
	if (
		options.getLanguage !== undefined &&
		typeof options.getLanguage !== 'function'
	) {
		throw new TypeError(
			'createMailRenderer: getLanguage must be a function that answers the wanted locales, as () => user.locale',
		);
	}
}

/** Reads `dir/path`; a missing file **throws**, naming it. */
function readBuilt(dir: string, path: string): string {
	try {
		return readFileSync(join(dir, path), 'utf8');
	} catch (error) {
		throw new Error(
			`createMailRenderer: ${join(dir, path)} cannot be read — run maizzle build, and deploy its output folder`,
			{ cause: error },
		);
	}
}

/** The manifest, its shape checked: a broken one **throws**. */
function readManifest(dir: string) {
	const file = join(dir, MANIFEST_FILE);
	let manifest: unknown;
	try {
		manifest = JSON.parse(readBuilt(dir, MANIFEST_FILE));
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new Error(`createMailRenderer: ${file} is not valid JSON`, {
				cause: error,
			});
		}
		throw error;
	}
	if (
		!isObject(manifest) ||
		!isStringList(manifest.locales) ||
		manifest.locales.length === 0 ||
		typeof manifest.fallbackLocale !== 'string' ||
		!isObject(manifest.emails)
	) {
		throw new Error(
			`createMailRenderer: ${file} is not a manifest of @nxgt/mail-i18n — build with its i18n() plugin`,
		);
	}
	// Absent: format 1, written before the field was.
	const format = 'formatVersion' in manifest ? manifest.formatVersion : 1;
	if (!Number.isSafeInteger(format) || (format as number) < 1) {
		throw new Error(
			`createMailRenderer: ${file} is not a manifest of @nxgt/mail-i18n — build with its i18n() plugin`,
		);
	}
	if ((format as number) > MANIFEST_FORMAT) {
		throw new Error(
			`createMailRenderer: ${file} is manifest format ${format}, newer than this @nxgt/mail reads (${MANIFEST_FORMAT}) — upgrade @nxgt/mail`,
		);
	}
	return {
		locales: manifest.locales,
		fallbackLocale: manifest.fallbackLocale,
		emails: manifest.emails,
	};
}

/** One e-mail of the manifest, with its files read in every locale. */
function readEmail(
	dir: string,
	name: string,
	entry: unknown,
	locales: readonly string[],
): Email {
	const broken = () =>
		new Error(
			`createMailRenderer: ${MANIFEST_FILE} describes ${name} in a shape its format does not have — it was changed after the build; run maizzle build again`,
		);
	if (
		!isObject(entry) ||
		!isStringList(entry.variables) ||
		!isStringList(entry.urlVariables) ||
		!isObject(entry.subject) ||
		!isObject(entry.files)
	) {
		throw broken();
	}
	const parts = new Map<string, Parts>();
	for (const locale of locales) {
		const subject = entry.subject[locale];
		const files = entry.files[locale];
		if (
			typeof subject !== 'string' ||
			!isObject(files) ||
			typeof files.html !== 'string'
		) {
			throw broken();
		}
		if (typeof files.text !== 'string') {
			throw new Error(
				`createMailRenderer: ${name} has no text part in ${locale} — keep Maizzle's plaintext on, as @nxgt/mail-config sets it`,
			);
		}
		parts.set(locale, {
			subject,
			html: readBuilt(dir, files.html),
			text: readBuilt(dir, files.text),
		});
	}
	return {
		variables: new Set(entry.variables),
		urlVariables: new Set(entry.urlVariables),
		locales: parts,
	};
}

/** Each variable of `email` as a string, checked against what it declares. */
function checkVariables(
	name: string,
	email: Email,
	variables: unknown,
): Map<string, string> {
	if (!isObject(variables)) {
		throw new TypeError(
			`render: the variables of ${name} must be an object, as { name: 'Ada' }`,
		);
	}
	const values = new Map<string, string>();
	for (const [key, value] of Object.entries(variables)) {
		if (!email.variables.has(key)) {
			throw new Error(
				`render: ${name} has no variable ${key} — it takes ${[...email.variables].join(', ') || 'none'}`,
			);
		}
		if (typeof value === 'number' && Number.isFinite(value)) {
			values.set(key, String(value));
		} else if (typeof value === 'string') {
			values.set(key, value);
		} else {
			throw new TypeError(
				`render: ${name}: ${key} must be a string or a finite number`,
			);
		}
	}
	for (const key of email.variables) {
		const value = values.get(key);
		if (value === undefined) {
			throw new Error(`render: ${name} needs the variable ${key}`);
		}
		if (
			email.urlVariables.has(key) &&
			(!SAFE_URL.test(value) || hasUnsafeUrlChar(value) || !URL.canParse(value))
		) {
			throw new MailRefused(
				`render: ${name}: ${key} must be an http:, https: or mailto: URL`,
			);
		}
	}
	return values;
}

/** `source` with each placeholder replaced, in one pass: a value is never read again. */
const fill = (
	source: string,
	values: ReadonlyMap<string, string>,
	write: (value: string) => string,
) =>
	source.replace(PLACEHOLDER, (mark, key: string) => {
		const value = values.get(key);
		return value === undefined ? mark : write(value);
	});

/**
 * The run-time renderer: the files `maizzle build` wrote with
 * `@nxgt/mail-i18n`, filled with the values of one send.
 *
 * ```ts
 * import type { MailEmails } from './generated/mail';
 *
 * const mails = createMailRenderer<MailEmails>({ dir: 'dist', getLanguage: () => user.locale });
 * await mailer.send({ to: user.email, ...mails.render('verify-email', { name, link }) });
 * ```
 *
 * Reads the manifest and every file once, here: a missing or broken build
 * **throws** when the renderer is created, not at the first send. A wrong
 * option is a `TypeError`.
 */
export function createMailRenderer<E extends MailEmailsOf<E> = AnyMailEmails>(
	options: MailRendererOptions,
): MailRenderer<E> {
	checkOptions(options);
	const { dir } = options;
	const manifest = readManifest(dir);
	const fallback = options.fallbackLocale ?? manifest.fallbackLocale;
	if (!manifest.locales.includes(fallback)) {
		throw new TypeError(
			`createMailRenderer: fallbackLocale must be one of the build's locales, ${manifest.locales.join(', ')}`,
		);
	}
	const emails = new Map<string, Email>();
	for (const [name, entry] of Object.entries(manifest.emails)) {
		emails.set(name, readEmail(dir, name, entry, manifest.locales));
	}
	const getLanguage = options.getLanguage;

	const renderer: MailRenderer = Object.freeze({
		emails: Object.freeze([...emails.keys()].sort()),
		locales: Object.freeze([...manifest.locales]),
		render(
			name: string,
			variables: MailVariables = {},
			renderOptions: RenderOptions = {},
		): Rendered {
			const email = emails.get(name);
			if (email === undefined) {
				throw new Error(
					`render: ${String(name)} is not an e-mail of the build — one of ${[...emails.keys()].sort().join(', ')}`,
				);
			}
			const locale =
				renderOptions.locale ??
				pickLocale(getLanguage?.(), manifest.locales, fallback);
			const parts = email.locales.get(locale);
			if (parts === undefined) {
				throw new Error(
					`render: the locale asked for is not one of the build's, ${manifest.locales.join(', ')}`,
				);
			}
			const values = checkVariables(name, email, variables);
			return {
				subject: fill(parts.subject, values, (value) => value)
					.replace(LINE_BREAKS, ' ')
					.trim(),
				html: fill(parts.html, values, escapeHtml),
				text: fill(parts.text, values, (value) => value),
			};
		},
	});
	// The types only narrow what the same checks refuse at run time.
	return renderer as unknown as MailRenderer<E>;
}
