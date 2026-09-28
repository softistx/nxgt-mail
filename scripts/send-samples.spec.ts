import { afterEach, describe, expect, test } from 'bun:test';
import {
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	fillImages,
	mailerFromEnv,
	parseArgs,
	subjectFor,
	variablesFor,
} from './send-samples';

const root = fileURLToPath(new URL('..', import.meta.url));

describe('parseArgs', () => {
	test('refuses to run without --to', () => {
		expect(() => parseArgs(['--dry-run'])).toThrow('--to is required');
	});

	test('refuses more than one recipient', () => {
		expect(() =>
			parseArgs(['--to', 'a@example.com,b@example.com', '--dry-run']),
		).toThrow('exactly one recipient');
	});

	test('requires --transport unless --dry-run', () => {
		expect(() => parseArgs(['--to', 'a@example.com'])).toThrow(
			'--transport is required',
		);
	});

	test('accepts --dry-run without --transport', () => {
		expect(parseArgs(['--to', 'a@example.com', '--dry-run'])).toEqual({
			to: 'a@example.com',
			transport: undefined,
			only: undefined,
			locale: undefined,
			dryRun: true,
		});
	});

	test('refuses an unknown --transport', () => {
		expect(() =>
			parseArgs(['--to', 'a@example.com', '--transport', 'sendgrid']),
		).toThrow('smtp or resend');
	});

	test('splits --only and --locale on commas, trimmed', () => {
		const args = parseArgs([
			'--to',
			'a@example.com',
			'--dry-run',
			'--only',
			'verify-email, welcome',
			'--locale',
			'en,fr',
		]);
		expect(args.only).toEqual(['verify-email', 'welcome']);
		expect(args.locale).toEqual(['en', 'fr']);
	});
});

describe('subjectFor', () => {
	test('is the sha, the name, the locale, then the rendered subject', () => {
		expect(subjectFor('abc1234', 'verify-email', 'en', 'Confirm')).toBe(
			'[nxgt-mail samples abc1234] verify-email · en — Confirm',
		);
	});
});

describe('fillImages', () => {
	test('swaps every acme.example sample picture for one that always loads', () => {
		const html =
			'<img src="https://acme.example/logo.png"><img src="https://acme.example/ada.png">' +
			'<img src="https://acme.example/chart.png"><img src="https://acme.example/gear.png">';
		const filled = fillImages(html);
		expect(filled).not.toContain('acme.example');
		expect(filled).toContain('data:image/svg+xml');
	});
});

/** A fake manifest naming one e-mail, so `variablesFor` is tested with no real build. */
function manifestFixture(variables: readonly string[]): string {
	const dir = mkdtempSync(join(tmpdir(), 'nxgt-mail-samples-manifest-'));
	writeFileSync(
		join(dir, 'mail-manifest.json'),
		JSON.stringify({
			formatVersion: 1,
			locales: ['en'],
			fallbackLocale: 'en',
			emails: {
				demo: {
					variables,
					urlVariables: [],
					subject: { en: 'Demo' },
					files: { en: { html: 'en/demo.html', text: 'en/demo.txt' } },
				},
			},
		}),
	);
	return dir;
}

describe('variablesFor', () => {
	test('fills a declared variable from EXAMPLES', () => {
		const dir = manifestFixture(['name']);
		try {
			expect(variablesFor(dir, 'demo', 'en')).toEqual({ name: 'Ada' });
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	test('throws, naming the variable, when no example value exists', () => {
		const dir = manifestFixture(['mysteryVar']);
		try {
			expect(() => variablesFor(dir, 'demo', 'en')).toThrow('mysteryVar');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});

describe('mailerFromEnv', () => {
	const names = ['SMTP_URL', 'MAIL_FROM', 'RESEND_API_KEY'] as const;
	const saved = new Map(names.map((name) => [name, process.env[name]]));
	afterEach(() => {
		for (const name of names) {
			const value = saved.get(name);
			if (value === undefined) delete process.env[name];
			else process.env[name] = value;
		}
	});

	test('wires smtp from SMTP_URL and MAIL_FROM, with defaults for both', () => {
		delete process.env.SMTP_URL;
		delete process.env.MAIL_FROM;
		expect(mailerFromEnv('smtp').mailer).toBeDefined();
	});

	test('refuses resend without RESEND_API_KEY', () => {
		delete process.env.RESEND_API_KEY;
		expect(() => mailerFromEnv('resend')).toThrow('RESEND_API_KEY is not set');
	});

	test('refuses resend without MAIL_FROM', () => {
		process.env.RESEND_API_KEY = 're_test_key';
		delete process.env.MAIL_FROM;
		expect(() => mailerFromEnv('resend')).toThrow('MAIL_FROM is not set');
	});

	test('wires resend once both are set', () => {
		process.env.RESEND_API_KEY = 're_test_key';
		process.env.MAIL_FROM = 'noreply@example.com';
		expect(mailerFromEnv('resend').mailer).toBeDefined();
	});
});

describe('the CLI, --dry-run', () => {
	test('writes one .html and one .eml per e-mail kept by --only/--locale, each subject prefixed to sort', async () => {
		const result = Bun.spawnSync(
			[
				'bun',
				'run',
				'scripts/send-samples.ts',
				'--to',
				'test@example.com',
				'--dry-run',
				'--only',
				'verify-email,ui-welcome-rtl,welcome,ui-welcome',
				'--locale',
				'en,ar',
			],
			{ cwd: root, stderr: 'pipe', stdout: 'pipe' },
		);
		expect(result.exitCode).toBe(0);
		const output = result.stdout.toString();

		// verify-email, welcome and ui-welcome: en only (fr is filtered out by
		// --locale, and none of the three was ever built in ar). welcome and
		// ui-welcome are distinct jobs — the mail-presets preset and the
		// mail-ui showcase fixture of the same name never collide.
		// ui-welcome-rtl: en and ar (it has no fr build).
		expect(output).toContain('wrote verify-email-en.html, verify-email-en.eml');
		expect(output).not.toContain('verify-email-fr');
		expect(output).toContain('wrote welcome-en.html, welcome-en.eml');
		expect(output).toContain('wrote ui-welcome-en.html, ui-welcome-en.eml');
		expect(output).toContain(
			'wrote ui-welcome-rtl-en.html, ui-welcome-rtl-en.eml',
		);
		expect(output).toContain(
			'wrote ui-welcome-rtl-ar.html, ui-welcome-rtl-ar.eml',
		);
		expect(output).toContain('5 e-mail(s) written');

		const match = output.match(/writing to (\S+)/);
		const dir = match?.[1];
		if (dir === undefined) {
			throw new Error('send-samples.spec: no scratch dir in the output');
		}
		try {
			const files = readdirSync(dir).sort();
			expect(files).toEqual([
				'ui-welcome-en.eml',
				'ui-welcome-en.html',
				'ui-welcome-rtl-ar.eml',
				'ui-welcome-rtl-ar.html',
				'ui-welcome-rtl-en.eml',
				'ui-welcome-rtl-en.html',
				'verify-email-en.eml',
				'verify-email-en.html',
				'welcome-en.eml',
				'welcome-en.html',
			]);
			const shaMatch = readFileSync(
				join(dir, 'verify-email-en.eml'),
				'utf8',
			).match(
				/^Subject: (\[nxgt-mail samples [0-9a-f]+\] verify-email · en — .+)$/m,
			);
			expect(shaMatch).not.toBeNull();
			const rtlSubject = readFileSync(
				join(dir, 'ui-welcome-rtl-ar.eml'),
				'utf8',
			).match(
				/^Subject: \[nxgt-mail samples [0-9a-f]+\] ui-welcome-rtl · ar — .+$/m,
			);
			expect(rtlSubject).not.toBeNull();
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}, 60_000);
});
