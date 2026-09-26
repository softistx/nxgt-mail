#!/usr/bin/env node
import { access } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createJiti } from 'jiti';
import { build, type MailConfig } from './build';
import { dev } from './dev';
import { MailBuildError } from './errors';

const HELP = `Usage: nxgt-mail <command> [options]

Commands:
  build   Compile the templates and catalogues into the generated module
  dev     Render every e-mail in every locale to a folder, to look at

Options:
  -c, --config <file>  The config file (default: mail.config.ts, .mts, .js or .mjs)
  -o, --out <dir>      dev: the preview folder (default: .nxgt-mail)
  -h, --help           Show this help
`;

const CONFIG_FILES = [
	'mail.config.ts',
	'mail.config.mts',
	'mail.config.js',
	'mail.config.mjs',
];

/** `path` relative to `root` when it is inside it, absolute otherwise. */
function shown(root: string, path: string): string {
	const inside = relative(root, path);
	return inside === '' ? '.' : inside.startsWith('..') ? path : inside;
}

async function findConfig(explicit: string | undefined): Promise<string> {
	if (explicit !== undefined) return resolve(explicit);
	for (const name of CONFIG_FILES) {
		const path = resolve(name);
		const found = await access(path).then(
			() => true,
			() => false,
		);
		if (found) return path;
	}
	throw new TypeError(
		`nxgt-mail: no config — write mail.config.ts, or pass --config <file>`,
	);
}

async function main(argv: readonly string[]): Promise<number> {
	const { positionals, values } = parseArgs({
		args: [...argv],
		allowPositionals: true,
		options: {
			config: { type: 'string', short: 'c' },
			out: { type: 'string', short: 'o' },
			help: { type: 'boolean', short: 'h' },
		},
	});
	const [command] = positionals;
	if (values.help === true || command === undefined) {
		process.stdout.write(HELP);
		return values.help === true ? 0 : 1;
	}
	if (command !== 'build' && command !== 'dev') {
		process.stderr.write(`nxgt-mail: unknown command ${command}\n\n${HELP}`);
		return 1;
	}

	const path = await findConfig(values.config);
	const config = await createJiti(import.meta.url).import<MailConfig>(path, {
		default: true,
	});
	const root = dirname(path);
	const started = performance.now();

	if (command === 'build') {
		const result = await build(config, { root });
		const names = result.emails.map((email) => email.name).join(', ');
		process.stdout.write(
			`nxgt-mail: ${result.written ? 'wrote' : 'unchanged'} ${shown(root, result.out)} — ${result.emails.length} e-mail(s): ${names} (${Math.round(performance.now() - started)} ms)\n`,
		);
		return 0;
	}
	const result = await dev(config, {
		root,
		...(values.out === undefined ? {} : { outDir: values.out }),
	});
	process.stdout.write(
		`nxgt-mail: ${result.files.length} file(s) in ${shown(root, result.outDir)} — open index.html\n`,
	);
	return 0;
}

main(process.argv.slice(2)).then(
	(code) => {
		process.exitCode = code;
	},
	(error: unknown) => {
		// A build failure is the author's to fix: its message says what and
		// where. Anything else is a bug, and keeps its stack.
		const wiring =
			error instanceof TypeError &&
			/^(build|compileMessages|nxgt-mail):/.test(error.message);
		if (error instanceof MailBuildError || wiring) {
			process.stderr.write(`${error.message}\n`);
		} else {
			console.error(error);
		}
		process.exitCode = 1;
	},
);
