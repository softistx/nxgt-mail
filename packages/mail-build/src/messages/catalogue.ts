import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MailBuildError } from '../errors';

/**
 * A catalogue as written: nested objects whose leaves are ICU messages.
 *
 * ```json
 * { "verifyEmail": { "subject": "Confirm your e-mail address" } }
 * ```
 */
export interface Catalogue {
	readonly [key: string]: string | Catalogue;
}

/** Catalogues by locale. One source is a preset's, or the application's. */
export type Catalogues = Readonly<Record<string, Catalogue>>;

/** A catalogue flattened to dotted keys: `verifyEmail.subject`. */
export type FlatCatalogue = ReadonlyMap<string, string>;

const SEGMENT = /^[a-z][a-zA-Z0-9]*$/;

function flattenInto(
	into: Map<string, string>,
	kinds: Map<string, 'message' | 'namespace'>,
	catalogue: Catalogue,
	locale: string,
	source: string,
	prefix: string,
): void {
	if (
		typeof catalogue !== 'object' ||
		catalogue === null ||
		Array.isArray(catalogue)
	) {
		throw new MailBuildError(
			'CATALOGUE_INVALID',
			`messages: ${locale}: ${prefix || '(root)'} in ${source} must be an object of messages`,
			prefix === '' ? { locale } : { locale, key: prefix },
		);
	}
	for (const [segment, value] of Object.entries(catalogue)) {
		const key = prefix === '' ? segment : `${prefix}.${segment}`;
		if (!SEGMENT.test(segment)) {
			throw new MailBuildError(
				'KEY_NOT_CAMEL_CASE',
				`messages: ${locale}: ${key} in ${source} is not camelCase — every segment of a key is camelCase, as verifyEmail.title`,
				{ locale, key },
			);
		}
		const kind = typeof value === 'string' ? 'message' : 'namespace';
		const before = kinds.get(key);
		if (before !== undefined && before !== kind) {
			throw new MailBuildError(
				'KEY_CONFLICT',
				`messages: ${locale}: ${key} is a ${before} in one catalogue and a ${kind} in ${source} — a later catalogue overrides a message, never a namespace`,
				{ locale, key },
			);
		}
		kinds.set(key, kind);
		if (typeof value === 'string') {
			into.set(key, value);
		} else {
			flattenInto(into, kinds, value, locale, source, key);
		}
	}
}

/**
 * Merges the catalogues of one locale, earliest first: a later catalogue
 * overrides a **message**, one key at a time, and never replaces a namespace.
 *
 * `sources` are named for the error messages: `"preset nxgt"`,
 * `"messages/fr.json"`.
 */
export function mergeCatalogues(
	locale: string,
	sources: readonly { readonly name: string; readonly catalogue: Catalogue }[],
): FlatCatalogue {
	const merged = new Map<string, string>();
	const kinds = new Map<string, 'message' | 'namespace'>();
	for (const { name, catalogue } of sources) {
		flattenInto(merged, kinds, catalogue, locale, name, '');
	}
	return merged;
}

/**
 * Reads `<dir>/<locale>.json` for each locale. A locale without a file
 * answers `null` for it — an absence, which the merge treats as empty; a file
 * that is not JSON fails the build.
 */
export async function readCatalogues(
	dir: string,
	locales: readonly string[],
): Promise<Record<string, Catalogue | null>> {
	const out: Record<string, Catalogue | null> = {};
	for (const locale of locales) {
		const path = join(dir, `${locale}.json`);
		const text = await readFile(path, 'utf8').then(
			(t) => t,
			(error: NodeJS.ErrnoException) => {
				if (error.code === 'ENOENT') return null;
				throw error;
			},
		);
		if (text === null) {
			out[locale] = null;
			continue;
		}
		try {
			out[locale] = JSON.parse(text) as Catalogue;
		} catch (cause) {
			throw new MailBuildError(
				'CATALOGUE_INVALID',
				`messages: ${locale}: ${path} is not valid JSON`,
				{ locale, cause },
			);
		}
	}
	return out;
}
