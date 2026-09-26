import { mkdir, mkdtemp, realpath, rm, symlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * A temporary folder to render templates from, removed by `close()`.
 *
 * Tailwind resolves Maizzle's `@import "@maizzle/tailwindcss"` from the
 * template's folder, before Maizzle rewrites that import to its own copy: from
 * a consumer's project it fails wherever the package is not hoisted (Bun,
 * pnpm), and the CSS is left uncompiled without a word. So the folder links
 * `node_modules/@maizzle/tailwindcss` to the copy Maizzle depends on.
 */
export interface RenderWorkspace {
	readonly dir: string;
	close(): Promise<void>;
}

async function maizzleTailwind(): Promise<string> {
	// Real paths: a require from a symlinked path looks beside the link.
	const framework = await realpath(
		fileURLToPath(import.meta.resolve('@maizzle/framework')),
	);
	const entry = createRequire(framework).resolve('@maizzle/tailwindcss');
	return dirname(await realpath(entry));
}

export async function openWorkspace(): Promise<RenderWorkspace> {
	const dir = await mkdtemp(join(tmpdir(), 'nxgt-mail-'));
	try {
		const scope = join(dir, 'node_modules', '@maizzle');
		await mkdir(scope, { recursive: true });
		await symlink(
			await maizzleTailwind(),
			join(scope, 'tailwindcss'),
			// A junction needs no privilege on Windows; elsewhere it is ignored.
			process.platform === 'win32' ? 'junction' : 'dir',
		);
	} catch (error) {
		await rm(dir, { recursive: true, force: true });
		throw error;
	}
	return {
		dir,
		close: () => rm(dir, { recursive: true, force: true }),
	};
}
