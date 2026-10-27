/**
 * Where `createMailRenderer` reads the build from: a folder or a map in
 * memory, the same by path. Imports Node built-ins, so it is reached from the
 * `@nxgt/mail/renderer` entry only.
 */
import { readFileSync } from 'node:fs';
import { join, posix } from 'node:path';

/** The built files by relative path, as `{ 'mail-manifest.json': '…', 'en/verify-email.html': '…' }`. */
export type MailFiles = Readonly<Record<string, string>>;

/** Where the build is read from: exactly one of `dir` and `files`. */
export type MailRendererSource =
	| {
			/** The build's output folder — where `mail-manifest.json` is — as `dist`. */
			readonly dir: string;
			readonly files?: never;
	  }
	| {
			/**
			 * The same files as the build folder, `mail-manifest.json` included, in
			 * memory: relative path to content. Keys may be written `a/b`, `./a/b`,
			 * `/a/b` or `a\b`. For templates inlined in a bundle, with no folder to
			 * read.
			 */
			readonly files: MailFiles;
			readonly dir?: never;
	  };

/** Where files are read from: a folder or a map, the same by path. */
export interface Built {
	/** The name shown in an error for `path`. */
	name(path: string): string;
	/** The content of `path`; a missing file **throws**, naming it. */
	read(path: string): string;
}

/** `\` becomes `/`, then `./`, `//` and a leading `/` go: `./en\a.html` is `en/a.html`. */
function key(path: string): string {
	return posix.normalize(path.replaceAll('\\', '/')).replace(/^\/+/, '');
}

export function builtOf(options: MailRendererSource): Built {
	if (options.files !== undefined) {
		const files = new Map<string, string>();
		for (const [path, content] of Object.entries(options.files)) {
			files.set(key(path), content);
		}
		return {
			name: (path) => path,
			read(path) {
				const content = files.get(key(path));
				if (content === undefined) {
					throw new Error(
						`createMailRenderer: ${path} cannot be read — files must hold every file of the build, mail-manifest.json included`,
					);
				}
				return content;
			},
		};
	}
	const { dir } = options;
	return {
		name: (path) => join(dir, path),
		read(path) {
			try {
				return readFileSync(join(dir, path), 'utf8');
			} catch (error) {
				throw new Error(
					`createMailRenderer: ${join(dir, path)} cannot be read — run maizzle build, and deploy its output folder`,
					{ cause: error },
				);
			}
		},
	};
}
