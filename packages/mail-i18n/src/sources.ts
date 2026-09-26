import { isAbsolute } from 'node:path';
import type { TemplateFolder } from './wrappers';

/** A package's folder of templates, for `i18n({ templates })`. */
export interface TemplateSource {
	/** The folder, absolute. */
	readonly dir: string;
	/** The e-mails of the folder to build, as `['verify-email']`. Default every one. */
	readonly emails?: readonly [string, ...string[]];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isSource = (source: unknown): source is TemplateSource =>
	isObject(source) &&
	typeof source.dir === 'string' &&
	isAbsolute(source.dir) &&
	(source.emails === undefined ||
		(Array.isArray(source.emails) &&
			source.emails.length > 0 &&
			source.emails.every((email) => typeof email === 'string') &&
			new Set(source.emails).size === source.emails.length));

/** Refuses a `templates` option that is not a list of {@link TemplateSource}. */
export function checkTemplates(
	templates: unknown,
): asserts templates is readonly TemplateSource[] | undefined {
	if (
		templates !== undefined &&
		(!Array.isArray(templates) || !templates.every(isSource))
	) {
		throw new TypeError(
			"i18n: templates must be a list of template folders, as [{ dir: '/abs/path/emails' }] — emails, when given, names at least one, each once",
		);
	}
}

/**
 * The folders the wrappers are written from: the project's `emails/` first,
 * so its template replaces a package's of the same name, then each package's.
 */
export function templateFolders(
	emails: { readonly dir: string; readonly name: string },
	templates: readonly TemplateSource[],
): TemplateFolder[] {
	return [
		{ dir: emails.dir, label: emails.name },
		...templates.map((source, index) => ({
			dir: source.dir,
			label: `templates[${index}]`,
			packaged: true,
			...(source.emails && { only: source.emails }),
		})),
	];
}
