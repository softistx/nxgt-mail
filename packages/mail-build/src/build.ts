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
	if (files.length === 0) {
		throw new TypeError(
			`build: ${dir} holds no .vue template — put one per e-mail there`,
		);
	}
	return Promise.all(
		files.map(async (file) => ({
			file,
			source: await readFile(join(dir, file), 'utf8'),
		})),
	);
}

const isStringArray = (value: unknown): value is readonly string[] =>
	Array.isArray(value) && value.every((item) => typeof item === 'string');

/** A config is data a user wrote: checked before it is used. */
function checkConfig(config: unknown): asserts config is MailConfig {
	if (typeof config !== 'object' || config === null) {
		throw new TypeError(
			'build: the config must be an object — export default defineMailConfig({ … })',
		);
	}
	const { locales, fallbackLocale, emails, messages, out } = config as Record<
		string,
		unknown
	>;
	if (locales === undefined && fallbackLocale === undefined) {
		throw new TypeError(
			'build: the config has no locales — is it the default export? export default defineMailConfig({ … })',
		);
	}
	if (!isStringArray(locales)) {
		throw new TypeError(
			"build: locales must be a list of locales, as ['en', 'fr']",
		);
	}
	if (typeof fallbackLocale !== 'string' || !locales.includes(fallbackLocale)) {
		throw new TypeError(
			"build: fallbackLocale must be one of locales, as 'en'",
		);
	}
	for (const [name, value] of Object.entries({ emails, messages, out })) {
		if (value !== undefined && typeof value !== 'string') {
			throw new TypeError(`build: ${name} must be a path, or left out`);
		}
	}
}

/** Reads the templates and catalogues a config names, and compiles them. */
export async function compileProject(
	config: MailConfig,
	options: BuildOptions = {},
): Promise<CompiledMail> {
	checkConfig(config);
	const root = resolve(options.root ?? process.cwd());
	const messagesDir = resolve(root, config.messages ?? 'messages');
	const catalogues = await readCatalogues(messagesDir, config.locales);
	if (Object.values(catalogues).every((catalogue) => catalogue === null)) {
		throw new TypeError(
			`build: ${messagesDir} holds no catalogue — write one <locale>.json per locale there, or set messages in the config`,
		);
	}
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
	checkConfig(config);
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
