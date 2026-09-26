import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	entryPath,
	parseEntry,
	watchTemplates,
	writeWrappers,
} from './wrappers';

describe('entryPath and parseEntry', () => {
	test('lay an e-mail out per locale, and read it back', () => {
		const entry = { email: 'auth/reset-password', locale: 'pt-BR' };
		expect(entryPath(entry, 'nested')).toBe('pt-BR/auth/reset-password');
		expect(entryPath(entry, 'flat')).toBe('auth/reset-password.pt-BR');
		for (const layout of ['nested', 'flat'] as const) {
			expect(
				parseEntry(entryPath(entry, layout), layout, ['en', 'pt-BR']),
			).toEqual(entry);
		}
	});

	test('answer null for a path that is not one e-mail in a locale', () => {
		expect(parseEntry('de/welcome', 'nested', ['en'])).toBeNull();
		expect(parseEntry('en', 'nested', ['en'])).toBeNull();
		expect(parseEntry('welcome.de', 'flat', ['en'])).toBeNull();
		expect(parseEntry('welcome', 'flat', ['en'])).toBeNull();
	});
});

describe('writeWrappers', () => {
	let root = '';
	afterEach(() => rmSync(root, { recursive: true, force: true }));

	const project = (emails: string[]) => {
		root = mkdtempSync(join(tmpdir(), 'mail-i18n-'));
		for (const email of emails) {
			mkdirSync(join(root, 'emails', email, '..'), { recursive: true });
			writeFileSync(join(root, 'emails', `${email}.vue`), '<template />');
		}
		return (layout: 'nested' | 'flat' = 'nested') =>
			writeWrappers({
				emailsDir: join(root, 'emails'),
				emailsName: 'emails',
				wrappersDir: join(root, '.maizzle/i18n'),
				locales: ['en', 'fr'],
				layout,
			});
	};

	test('writes one wrapper per template and locale, importing the template', () => {
		const write = project(['welcome', 'auth/reset-password']);
		expect(write()).toEqual(['auth/reset-password', 'welcome']);
		const wrapper = readFileSync(
			join(root, '.maizzle/i18n/fr/auth/reset-password.vue'),
			'utf8',
		);
		expect(wrapper).toContain(
			"import Email from '../../../../emails/auth/reset-password.vue';",
		);
		expect(wrapper).toContain('<template><Email /></template>');
		expect(existsSync(join(root, '.maizzle/i18n/en/welcome.vue'))).toBe(true);
	});

	test('rewrites a wrapper only when its text changed', async () => {
		const write = project(['welcome']);
		write();
		const file = join(root, '.maizzle/i18n/en/welcome.vue');
		const before = statSync(file).mtimeMs;
		await Bun.sleep(20);
		write();
		expect(statSync(file).mtimeMs).toBe(before);
	});

	test('removes the wrappers of a template that is gone, or of another layout', () => {
		const write = project(['welcome', 'goodbye']);
		write();
		rmSync(join(root, 'emails/goodbye.vue'));
		write('flat');
		expect(existsSync(join(root, '.maizzle/i18n/en/goodbye.vue'))).toBe(false);
		expect(existsSync(join(root, '.maizzle/i18n/en/welcome.vue'))).toBe(false);
		expect(existsSync(join(root, '.maizzle/i18n/welcome.fr.vue'))).toBe(true);
	});

	test('answers no e-mail for a project with no templates folder', () => {
		const write = project([]);
		expect(write()).toEqual([]);
	});

	test('fails the build on a template that is not kebab-case', () => {
		const write = project(['auth/Reset_Password']);
		expect(() => write()).toThrow(
			new Error(
				'i18n: emails/auth/Reset_Password.vue is not a kebab-case name — name a template as verify-email.vue',
			),
		);
	});
});

describe('watchTemplates', () => {
	const serve = (regenerate: () => void) => {
		const listeners = new Map<string, (file: string) => void>();
		const watched: string[] = [];
		watchTemplates('/project/emails', regenerate).configureServer({
			watcher: {
				add: (path) => watched.push(path),
				on: (event, listener) => listeners.set(event, listener),
			},
		});
		return { listeners, watched };
	};

	test('regenerates when a template is added or removed, and only then', () => {
		let calls = 0;
		const { listeners, watched } = serve(() => {
			calls += 1;
		});
		expect(watched).toEqual(['/project/emails']);
		listeners.get('add')?.('/project/emails/welcome.vue');
		listeners.get('unlink')?.('/project/emails/auth/reset.vue');
		listeners.get('add')?.('/project/emails/notes.md');
		listeners.get('add')?.('/project/components/Button.vue');
		expect(calls).toBe(2);
	});

	test('reports a template the build would refuse, and keeps the server running', () => {
		const error = spyOn(console, 'error').mockImplementation(() => {});
		try {
			const { listeners } = serve(() => {
				throw new Error('i18n: emails/Bad.vue is not a kebab-case name');
			});
			expect(() =>
				listeners.get('add')?.('/project/emails/Bad.vue'),
			).not.toThrow();
			expect(error).toHaveBeenCalledWith(
				'i18n: emails/Bad.vue is not a kebab-case name',
			);
		} finally {
			error.mockRestore();
		}
	});
});
