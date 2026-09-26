import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createJiti } from 'jiti';
import { type BuildOptions, compileProject, type MailConfig } from './build';
import type { MailProp } from './templates/compile';

export interface DevOptions extends BuildOptions {
	/** Where the previews go, relative to `root`. Default `.nxgt-mail`. */
	readonly outDir?: string;
}

export interface DevResult {
	/** The absolute path of the preview folder; `index.html` lists every file. */
	readonly outDir: string;
	/** Every file written, relative to `outDir`. */
	readonly files: readonly string[];
}

type RenderFunction = (args: Record<string, unknown>) => {
	readonly subject: string;
	readonly html: string;
	readonly text: string;
};

/** A value to preview a prop with: its name, where a string shows it. */
function sample(name: string, prop: MailProp): unknown {
	if (prop.url !== null) return `https://example.com/${name}`;
	if (prop.kind === 'number') return 3;
	if (prop.kind === 'date') return new Date('2026-01-15T09:30:00Z');
	return `[${name}]`;
}

const escapeHtml = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/**
 * Renders every e-mail in every locale, with a sample value for each prop,
 * to `<outDir>/<email>.<locale>.html` and `.txt` — what `nxgt-mail dev` runs,
 * to look at the e-mails in a browser. It writes nothing to `out`.
 */
export async function dev(
	config: MailConfig,
	options: DevOptions = {},
): Promise<DevResult> {
	const root = resolve(options.root ?? process.cwd());
	const outDir = resolve(root, options.outDir ?? '.nxgt-mail');
	const compiled = await compileProject(config, { root });

	const scratch = await mkdtemp(join(tmpdir(), 'nxgt-mail-dev-'));
	let mails: Readonly<Record<string, RenderFunction>>;
	try {
		const path = join(scratch, 'mail.ts');
		await writeFile(path, compiled.module);
		const module = await createJiti(import.meta.url, {
			moduleCache: false,
		}).import<{ mails: Record<string, RenderFunction> }>(path);
		mails = module.mails;
	} finally {
		await rm(scratch, { recursive: true, force: true });
	}

	await mkdir(outDir, { recursive: true });
	const files: string[] = [];
	const rows: string[] = [];
	for (const email of compiled.emails) {
		const render = mails[email.name];
		if (render === undefined) {
			throw new Error(`dev: the module has no mails.${email.name}`);
		}
		const args = Object.fromEntries(
			[...email.props].map(([name, prop]) => [name, sample(name, prop)]),
		);
		for (const locale of config.locales) {
			const rendered = render({ ...args, locale });
			const base = `${email.file.slice(0, -'.vue'.length)}.${locale}`;
			await writeFile(join(outDir, `${base}.html`), rendered.html);
			await writeFile(
				join(outDir, `${base}.txt`),
				`Subject: ${rendered.subject}\n\n${rendered.text}`,
			);
			files.push(`${base}.html`, `${base}.txt`);
			rows.push(
				`<tr><td>${escapeHtml(email.name)}</td><td>${escapeHtml(locale)}</td><td>${escapeHtml(rendered.subject)}</td><td><a href="${base}.html">html</a> · <a href="${base}.txt">text</a></td></tr>`,
			);
		}
	}
	await writeFile(
		join(outDir, 'index.html'),
		`<!doctype html><meta charset="utf-8"><title>nxgt-mail previews</title><table><tr><th>E-mail</th><th>Locale</th><th>Subject</th><th></th></tr>${rows.join('')}</table>\n`,
	);
	files.push('index.html');
	return { outDir, files };
}
