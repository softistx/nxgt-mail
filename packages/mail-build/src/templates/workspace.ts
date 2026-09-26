import {
	mkdir,
	mkdtemp,
	realpath,
	rm,
	symlink,
	writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Theme, themeCss } from '../presets';

/**
 * A temporary folder to render templates from, removed by `close()`.
 *
 * Tailwind resolves Maizzle's `@import "@maizzle/tailwindcss"` from the
 * template's folder, before Maizzle rewrites that import to its own copy: from
 * a consumer's project it fails wherever the package is not hoisted (Bun,
 * pnpm), and the CSS is left uncompiled without a word. So the folder links
 * `node_modules/@maizzle/tailwindcss` to the copy Maizzle depends on.
 *
 * It also holds what the presets bring: `theme.css`, which a layout imports
 * as `@import "./theme.css";` — a relative import resolves from the
 * template's folder — and `components/`, one `.vue` per component.
 */
export interface RenderWorkspace {
	readonly dir: string;
	/** The components folder, passed to Maizzle as its only source. */
	readonly components: string;
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

export interface WorkspaceContent {
	readonly theme?: Theme;
	/** Component file name → source. */
	readonly components?: Readonly<Record<string, string>>;
}

export async function openWorkspace(
	content: WorkspaceContent = {},
): Promise<RenderWorkspace> {
	const dir = await mkdtemp(join(tmpdir(), 'nxgt-mail-'));
	const components = join(dir, 'components');
	try {
		await mkdir(components);
		await writeFile(join(dir, 'theme.css'), themeCss(content.theme ?? {}));
		for (const [file, source] of Object.entries(content.components ?? {})) {
			await writeFile(join(components, file), source);
		}
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
		components,
		close: () => rm(dir, { recursive: true, force: true }),
	};
}
