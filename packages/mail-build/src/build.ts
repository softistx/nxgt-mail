import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { readCatalogues } from './messages/catalogue';
import {
	type CompiledEmail,
	type CompiledMail,
	compileMail,
	type TemplateFile,
} from './templates/compile';

/** What `mail.config.ts` exports. Paths are relative to the config's folder. */
export interface MailConfig {
	/** Every locale the build supports, in order: `['en', 'fr']`. */
	readonly locales: readonly string[];
	/** The reference locale: every other one must hold exactly its keys. */
	readonly fallbackLocale: string;
	/** The folder of the templates, one `.vue` per e-mail. Default `emails`. */
	readonly emails?: string;
	/** The folder of the catalogues, one `<locale>.json` per locale. Default `messages`. */
	readonly messages?: string;
	/** The generated module. Default `src/generated/mail.ts`. */
	readonly out?: string;
}

/** Types a config: `export default defineMailConfig({ … })`. */
export function defineMailConfig(config: MailConfig): MailConfig {
	return config;
}

export interface BuildOptions {
	/** The folder paths in the config are relative to. Default: the working directory. */
	readonly root?: string;
}

export interface BuildResult {
	/** The absolute path of the generated module. */
	readonly out: string;
	/** Whether the module changed: an unchanged one is not written again. */
	readonly written: boolean;
	readonly emails: readonly CompiledEmail[];
}

async function readTemplates(dir: string): Promise<TemplateFile[]> {
	const entries = await readdir(dir).then(
		(names) => names,
		(error: NodeJS.ErrnoException) => {
			if (error.code === 'ENOENT') return null;
			throw error;
		},
	);
	if (entries === null) {
		throw new TypeError(
			`build: ${dir} does not exist — put one .vue template per e-mail there, or set emails in the config`,
		);
	}
	const files = entries.filter((name) => name.endsWith('.vue')).sort();
	return Promise.all(
		files.map(async (file) => ({
			file,
			source: await readFile(join(dir, file), 'utf8'),
		})),
	);
}

/** Reads the templates and catalogues a config names, and compiles them. */
export async function compileProject(
	config: MailConfig,
	options: BuildOptions = {},
): Promise<CompiledMail> {
	const root = resolve(options.root ?? process.cwd());
	const catalogues = await readCatalogues(
		resolve(root, config.messages ?? 'messages'),
		config.locales,
	);
	return compileMail({
		locales: config.locales,
		fallbackLocale: config.fallbackLocale,
		sources: [{ name: `${config.messages ?? 'messages'}/`, catalogues }],
		templates: await readTemplates(resolve(root, config.emails ?? 'emails')),
	});
}

/**
 * Compiles the templates and catalogues of a config into its `out` module —
 * what `nxgt-mail build` runs. The module is written only when it changed.
 * A build that cannot be right throws a {@link MailBuildError} and writes
 * nothing.
 */
export async function build(
	config: MailConfig,
	options: BuildOptions = {},
): Promise<BuildResult> {
	const root = resolve(options.root ?? process.cwd());
	const out = resolve(root, config.out ?? 'src/generated/mail.ts');
	const compiled = await compileProject(config, { root });
	const current = await readFile(out, 'utf8').then(
		(text) => text,
		(error: NodeJS.ErrnoException) => {
			if (error.code === 'ENOENT') return null;
			throw error;
		},
	);
	const written = current !== compiled.module;
	if (written) {
		await mkdir(dirname(out), { recursive: true });
		await writeFile(out, compiled.module);
	}
	return { out, written, emails: compiled.emails };
}
