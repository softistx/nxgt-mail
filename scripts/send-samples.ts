#!/usr/bin/env bun

/**
 * A private, unpublished script: every `@nxgt/mail-presets` e-mail, in each
 * shipped locale, and the `@nxgt/mail-ui` showcase fixtures (`en`, `fr`, and
 * the `ar` right-to-left fixture `packages/mail-ui/src/build.spec.ts` builds
 * for its "a right-to-left locale" tests), sent to one address so Steve can
 * check the real rendering in Gmail, Outlook and Apple Mail — a check no
 * automated test can do. No package here is published, and this never runs
 * in CI beyond its own `--dry-run` spec (no network there).
 *
 * ```sh
 * bun run send-samples --to you@example.com --transport smtp
 * bun run send-samples --to you@example.com --transport resend --only verify-email,welcome --locale en
 * bun run send-samples --to you@example.com --dry-run
 * ```
 *
 * Transports come from the environment only, and a secret is never read back
 * or printed:
 *
 * - `--transport smtp`: `SMTP_URL` (`smtp://user:pass@host:587`, or Mailpit's
 *   `smtp://localhost:1025` when unset) and, optionally, `MAIL_FROM`.
 * - `--transport resend`: `RESEND_API_KEY` and `MAIL_FROM`, both required.
 *
 * Every send goes through `withRetry`, with a small delay between sends for
 * Resend's rate limit. `--dry-run` writes each message's `.html` and `.eml`
 * under a temp dir instead of sending anything.
 */

import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Mailer, type MailMessage, withRetry } from '@nxgt/mail';
import { createMailRenderer } from '@nxgt/mail/renderer';
import { createResendMailer } from '@nxgt/mail-resend';
import { createSmtpMailer } from '@nxgt/mail-smtp';
import nodemailer from 'nodemailer';

const root = fileURLToPath(new URL('..', import.meta.url));

// The images `presets` and mail-ui's fixtures point at, and what a real
// client is shown instead — copied from `scripts/previews.ts`: change both.
const LOGO = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="28"><text x="0" y="22" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#0f766e">Acme</text></svg>',
)}`;
const AVATAR = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="#0f766e"/><text x="24" y="31" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff">A</text></svg>',
)}`;
const CHART = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="534" height="200"><rect width="534" height="200" fill="#f6f6fa"/>' +
		[40, 90, 70, 130, 110, 60, 150]
			.map(
				(bar, index) =>
					`<rect x="${37 + index * 70}" y="${180 - bar}" width="40" height="${bar}" rx="4" fill="#485096"/>`,
			)
			.join('') +
		'</svg>',
)}`;
const GEAR = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="5" fill="none" stroke="#020918" stroke-width="2"/><circle cx="8" cy="8" r="1.5" fill="#020918"/></svg>',
)}`;

/** The `link` each preset shows, by its name; any other gets `example.link`. Copied from `scripts/previews.ts`. */
const LINKS: Readonly<Record<string, string>> = {
	'verify-email': 'https://acme.example/verify?token=5f2c9e',
	'reset-password': 'https://acme.example/reset?token=5f2c9e',
	'password-changed': 'https://acme.example/security',
	'email-changed': 'https://acme.example/security',
	'magic-link': 'https://acme.example/sign-in?token=5f2c9e',
	'new-sign-in': 'https://acme.example/security',
	welcome: 'https://acme.example/start',
	invitation: 'https://acme.example/join?invite=5f2c9e',
	'account-deleted': 'https://acme.example/restore?token=5f2c9e',
	'two-factor-enabled': 'https://acme.example/security',
	'two-factor-disabled': 'https://acme.example/security',
	'recovery-code-used': 'https://acme.example/security',
	'confirm-action': 'https://acme.example/security',
	'invitation-accepted': 'https://acme.example/team',
};

/** The `expiresIn` of an e-mail whose token lives longer than an hour, per locale. Copied from `scripts/previews.ts`. */
const EXPIRES_IN: Readonly<Record<string, Readonly<Record<string, string>>>> = {
	invitation: { en: '7 days', fr: '7 jours' },
	'account-deleted': { en: '30 days', fr: '30 jours' },
};

/** What a placeholder holds, per locale. Copied from `scripts/previews.ts`: change both. */
const EXAMPLES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
	en: {
		name: 'Ada',
		link: 'https://acme.example/verify?token=5f2c9e',
		code: '482 913',
		expiresIn: '1 hour',
		device: 'Firefox on macOS',
		location: 'Lyon, France',
		time: 'September 26, 2026, 9:14 PM',
		when: 'September 26, 2026, 9:14 PM',
		recoveryCodesLeft: 'You have 3 recovery codes left.',
		inviter: 'Grace Hopper',
		invitee: 'Marie Curie',
		organization: 'Acme Labs',
		newEmail: 'ada@new.example',
		badgeSize: '84 KB',
		email: 'support@acme.example',
		mobile: '+33 6 12 34 56 78',
		site: 'https://portal.acme.example',
	},
	fr: {
		name: 'Ada',
		link: 'https://acme.example/verify?token=5f2c9e',
		code: '482 913',
		expiresIn: '1 heure',
		device: 'Firefox sur macOS',
		location: 'Lyon, France',
		time: '26 septembre 2026 à 21:14',
		when: '26 septembre 2026 à 21:14',
		recoveryCodesLeft: 'Il vous reste 3 codes de récupération.',
		inviter: 'Grace Hopper',
		invitee: 'Marie Curie',
		organization: 'Acme Labs',
		newEmail: 'ada@new.example',
		badgeSize: '84 Ko',
		email: 'support@acme.example',
		mobile: '+33 6 12 34 56 78',
		site: 'https://portal.acme.example',
	},
};

const TRANSPORTS = ['smtp', 'resend'] as const;
export type Transport = (typeof TRANSPORTS)[number];

export interface Args {
	readonly to: string;
	readonly transport?: Transport;
	readonly only?: readonly string[];
	readonly locale?: readonly string[];
	readonly dryRun: boolean;
}

/** `argv` (after the script's own path) as {@link Args}, or throws naming the mistake. */
export function parseArgs(argv: readonly string[]): Args {
	let to: string | undefined;
	let transport: string | undefined;
	let only: string[] | undefined;
	let locale: string[] | undefined;
	let dryRun = false;
	const list = (value: string | undefined) =>
		(value ?? '')
			.split(',')
			.map((item) => item.trim())
			.filter((item) => item.length > 0);
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		switch (arg) {
			case '--to':
				to = argv[++i];
				break;
			case '--transport':
				transport = argv[++i];
				break;
			case '--only':
				only = list(argv[++i]);
				break;
			case '--locale':
				locale = list(argv[++i]);
				break;
			case '--dry-run':
				dryRun = true;
				break;
			default:
				throw new Error(`send-samples: unknown argument ${arg}`);
		}
	}
	if (to === undefined || to.trim() === '') {
		throw new Error('send-samples: --to is required, as --to you@example.com');
	}
	if (
		to.includes(',') ||
		to.includes(';') ||
		(to.match(/@/g) ?? []).length !== 1
	) {
		throw new Error('send-samples: --to must name exactly one recipient');
	}
	if (
		transport !== undefined &&
		!(TRANSPORTS as readonly string[]).includes(transport)
	) {
		throw new Error('send-samples: --transport must be smtp or resend');
	}
	if (!dryRun && transport === undefined) {
		throw new Error(
			'send-samples: --transport is required, as --transport smtp or --transport resend — unless --dry-run',
		);
	}
	return {
		to,
		transport: transport as Transport | undefined,
		only,
		locale,
		dryRun,
	};
}

interface ManifestEmail {
	readonly variables: readonly string[];
}

interface Manifest {
	readonly locales: readonly string[];
	readonly emails: Readonly<Record<string, ManifestEmail>>;
}

function readManifest(dir: string): Manifest {
	return JSON.parse(readFileSync(join(dir, 'mail-manifest.json'), 'utf8'));
}

/** One e-mail to send: a group and a name for the subject, the underlying build's e-mail key, and where it was built. */
export interface Job {
	readonly group: 'mail-presets' | 'mail-ui' | 'mail-ui-rtl';
	/** What names it in `--only` and in the subject. */
	readonly name: string;
	/** The e-mail name in the build's manifest — differs from `name` only for the rtl fixture. */
	readonly emailKey: string;
	readonly locale: string;
	readonly dir: string;
}

/** `dir`'s e-mails, in every locale it was built in, as jobs of `group`. `emailKey` defaults to the manifest's own name. */
function jobsOf(
	group: Job['group'],
	dir: string,
	nameOf: (emailKey: string) => string = (name) => name,
): Job[] {
	const manifest = readManifest(dir);
	const jobs: Job[] = [];
	for (const emailKey of Object.keys(manifest.emails).sort()) {
		for (const locale of manifest.locales) {
			jobs.push({ group, name: nameOf(emailKey), emailKey, locale, dir });
		}
	}
	return jobs;
}

/** The variables `emailKey` needs in `locale`, from `EXAMPLES`, `LINKS` and `EXPIRES_IN` — throws naming the first with no example value. */
export function variablesFor(
	dir: string,
	emailKey: string,
	locale: string,
): Record<string, string> {
	const manifest = readManifest(dir);
	const entry = manifest.emails[emailKey];
	if (entry === undefined) {
		throw new Error(`send-samples: ${dir} has no e-mail ${emailKey}`);
	}
	const examples = EXAMPLES[locale] ?? {};
	const values: Record<string, string> = {};
	for (const key of entry.variables) {
		const value =
			(key === 'link' ? LINKS[emailKey] : undefined) ??
			(key === 'expiresIn' ? EXPIRES_IN[emailKey]?.[locale] : undefined) ??
			examples[key];
		if (value === undefined) {
			throw new Error(
				`send-samples: ${emailKey} needs ${key}, with no example value for ${locale} — add it to EXAMPLES`,
			);
		}
		values[key] = value;
	}
	return values;
}

/** `html` with every sample picture swapped for one that always loads, as `scripts/previews.ts` does. */
export function fillImages(html: string): string {
	return html
		.replaceAll('https://acme.example/logo.png', LOGO)
		.replaceAll('https://acme.example/ada.png', AVATAR)
		.replaceAll('https://acme.example/chart.png', CHART)
		.replaceAll('https://acme.example/gear.png', GEAR);
}

/** `[nxgt-mail samples <sha>] <name> · <locale> — <rendered subject>`, so the samples sort in the inbox. */
export function subjectFor(
	sha: string,
	name: string,
	locale: string,
	rendered: string,
): string {
	return `[nxgt-mail samples ${sha}] ${name} · ${locale} — ${rendered}`;
}

/** `MAIL_FROM`, or a default that needs no real domain — dry-run's `.eml` uses this even when no transport is ever wired. */
function defaultFrom(): string {
	return process.env.MAIL_FROM ?? 'nxgt-mail-samples@localhost';
}

/**
 * A minimal, valid RFC 5322 message: `From`, `To`, `Subject`, `Date`, then
 * `text/plain` and `text/html` parts. `from` is never read from the message
 * itself — under `--dry-run` no transport, and so no default sender, is ever
 * wired.
 */
function eml(
	message: MailMessage & { readonly html: string; readonly text: string },
	from: string,
): string {
	const boundary = 'nxgt-mail-samples-boundary';
	const to =
		typeof message.to === 'string' ? message.to : JSON.stringify(message.to);
	return [
		`From: ${from}`,
		`To: ${to}`,
		`Subject: ${message.subject}`,
		`Date: ${new Date().toUTCString()}`,
		'MIME-Version: 1.0',
		`Content-Type: multipart/alternative; boundary="${boundary}"`,
		'',
		`--${boundary}`,
		'Content-Type: text/plain; charset=utf-8',
		'',
		message.text,
		'',
		`--${boundary}`,
		'Content-Type: text/html; charset=utf-8',
		'',
		message.html,
		'',
		`--${boundary}--`,
		'',
	].join('\r\n');
}

function gitShortSha(): string {
	const result = Bun.spawnSync(['git', 'rev-parse', '--short', 'HEAD'], {
		cwd: root,
	});
	if (result.exitCode !== 0) {
		throw new Error('send-samples: could not read the git short sha');
	}
	return result.stdout.toString().trim();
}

/** Runs `maizzle build` in `cwd`; throws with its stderr on failure. Never prints an environment variable. */
function maizzleBuild(bin: string, cwd: string): void {
	const result = Bun.spawnSync([bin, 'build'], {
		cwd,
		stderr: 'pipe',
		stdout: 'pipe',
	});
	if (result.exitCode !== 0) {
		throw new Error(
			`send-samples: maizzle build failed in ${cwd}: ${result.stderr.toString().trim()}`,
		);
	}
}

/**
 * The right-to-left fixture `packages/mail-ui/src/build.spec.ts` builds for
 * its "a right-to-left locale" describe block — the `maizzle.config.ts`,
 * both locale files and `emails/welcome.vue` are a verbatim copy of that
 * spec's own fixture (its `files` object): change both, or this stops being
 * what that spec proves is mirrored. Built fresh under a scratch dir the
 * caller removes once every job has read from it.
 */
function buildRtlFixture(mailUi: string): string {
	const scratch = join(mailUi, 'test/.tmp/rtl');
	rmSync(scratch, { recursive: true, force: true });
	const files: Record<string, string> = {
		'maizzle.config.ts': [
			"import { defineMailConfig } from '@nxgt/mail-config';",
			"import { i18n } from '@nxgt/mail-i18n';",
			"import { ui } from '../../../src/index';",
			"export default defineMailConfig({ plugins: [ui({ brand: { name: 'Acme' } }), i18n({ locales: ['en', 'ar'] })] });",
		].join('\n'),
		'locales/en.json': JSON.stringify({
			welcome: { subject: 'Welcome' },
			common: { footer: { why: 'You have an account with {brand}.' } },
		}),
		'locales/ar.json': JSON.stringify({
			welcome: { subject: 'أهلا' },
			common: { footer: { why: 'لديك حساب لدى {brand}.' } },
		}),
		'emails/welcome.vue': [
			'<template>',
			'  <NxLayout>',
			'    <NxAlert variant="error" title="Oops"><template #icon>!</template></NxAlert>',
			'    <NxCompareCard label="Sales" :current="{ value: \'120\', label: \'Now\' }" :previous="{ value: \'100\', label: \'Before\' }" :delta="12" />',
			'    <NxStatCard label="Users" value="42" :delta="5"><template #icon>i</template></NxStatCard>',
			"    <NxTimeline :items=\"[{ id: '1', title: 'Signed in', timestampLabel: 'Today' }, { id: '2', title: 'Second' }]\" />",
			"    <NxSeeAlso label=\"Links\" :items=\"[{ id: 'a', title: 'Docs', href: 'https://acme.example/docs' }]\" />",
			'    <NxListTile title="Item"><template #trailing>X</template></NxListTile>',
			'    <NxEntityHeader title="Header"><template #actions>A</template></NxEntityHeader>',
			"    <NxSummaryData :data=\"[{ label: 'L', value: 'V' }]\" />",
			'    <NxSteps><NxStepsItem title="Step 1" /><NxStepsItem title="Step 2" /></NxSteps>',
			'  </NxLayout>',
			'</template>',
		].join('\n'),
	};
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(join(scratch, path, '..'), { recursive: true });
		writeFileSync(join(scratch, path), content);
	}
	maizzleBuild(join(mailUi, 'node_modules/.bin/maizzle'), scratch);
	return join(scratch, 'dist');
}

export interface MailerFromEnv {
	readonly mailer: Mailer;
}

/** The transport `--transport` names, wired from the environment only — never logs a secret. */
export function mailerFromEnv(transport: Transport): MailerFromEnv {
	if (transport === 'smtp') {
		const url = process.env.SMTP_URL ?? 'smtp://localhost:1025';
		const from = process.env.MAIL_FROM ?? 'nxgt-mail-samples@localhost';
		return {
			mailer: createSmtpMailer({
				transporter: nodemailer.createTransport(url),
				from,
			}),
		};
	}
	const apiKey = process.env.RESEND_API_KEY;
	if (apiKey === undefined || apiKey.trim() === '') {
		throw new Error('send-samples: RESEND_API_KEY is not set');
	}
	const from = process.env.MAIL_FROM;
	if (from === undefined || from.trim() === '') {
		throw new Error(
			'send-samples: MAIL_FROM is not set — required with RESEND_API_KEY',
		);
	}
	return { mailer: createResendMailer({ apiKey, from }) };
}

const RESEND_DELAY_MS = 600;

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	const sha = gitShortSha();

	if (!args.dryRun) {
		console.log('send-samples: bun run build (fresh build of every package)');
		const built = Bun.spawnSync(['bun', 'run', 'build'], {
			cwd: root,
			stdio: ['inherit', 'inherit', 'inherit'],
		});
		if (built.exitCode !== 0)
			throw new Error('send-samples: bun run build failed');
	}

	const mailPresets = join(root, 'packages/mail-presets');
	const mailUi = join(root, 'packages/mail-ui');
	maizzleBuild(
		join(mailPresets, 'node_modules/.bin/maizzle'),
		join(mailPresets, 'test/fixture'),
	);
	maizzleBuild(
		join(mailUi, 'node_modules/.bin/maizzle'),
		join(mailUi, 'test/fixture'),
	);
	const rtlScratch = join(mailUi, 'test/.tmp/rtl');
	const rtlDist = buildRtlFixture(mailUi);
	try {
		await sendJobs({
			args,
			sha,
			mailPresets,
			mailUi,
			rtlDist,
		});
	} finally {
		rmSync(rtlScratch, { recursive: true, force: true });
	}
}

interface SendJobsOptions {
	readonly args: Args;
	readonly sha: string;
	readonly mailPresets: string;
	readonly mailUi: string;
	readonly rtlDist: string;
}

async function sendJobs({
	args,
	sha,
	mailPresets,
	mailUi,
	rtlDist,
}: SendJobsOptions): Promise<void> {
	let jobs = [
		...jobsOf('mail-presets', join(mailPresets, 'test/fixture/dist')),
		// Prefixed: mail-ui's own showcase fixture is also named welcome, and
		// would otherwise collide with the welcome preset — in --only and in
		// the file this writes under --dry-run.
		...jobsOf(
			'mail-ui',
			join(mailUi, 'test/fixture/dist'),
			(name) => `ui-${name}`,
		),
		...jobsOf('mail-ui-rtl', rtlDist, () => 'ui-welcome-rtl'),
	];
	if (args.only !== undefined) {
		const only = new Set(args.only);
		jobs = jobs.filter((job) => only.has(job.name));
	}
	if (args.locale !== undefined) {
		const locale = new Set(args.locale);
		jobs = jobs.filter((job) => locale.has(job.locale));
	}
	if (jobs.length === 0) {
		throw new Error('send-samples: --only/--locale left nothing to send');
	}

	const renderers = new Map<string, ReturnType<typeof createMailRenderer>>();
	const rendererFor = (dir: string) => {
		let renderer = renderers.get(dir);
		if (renderer === undefined) {
			renderer = createMailRenderer({ dir });
			renderers.set(dir, renderer);
		}
		return renderer;
	};

	let scratch: string | undefined;
	let mailer: Mailer | undefined;
	if (args.dryRun) {
		scratch = mkdtempSync(join(tmpdir(), 'nxgt-mail-samples-'));
		console.log(`send-samples: --dry-run — writing to ${scratch}`);
	} else {
		const wired = mailerFromEnv(args.transport as Transport);
		mailer = withRetry(wired.mailer);
	}

	let sent = 0;
	for (const job of jobs) {
		const renderer = rendererFor(job.dir);
		const variables = variablesFor(job.dir, job.emailKey, job.locale);
		const rendered = renderer.render(job.emailKey, variables, {
			locale: job.locale,
		});
		const subject = subjectFor(sha, job.name, job.locale, rendered.subject);
		const html = fillImages(rendered.html);
		const message: MailMessage = {
			to: args.to,
			subject,
			html,
			text: rendered.text,
		};

		if (scratch !== undefined) {
			const base = `${job.name}-${job.locale}`;
			writeFileSync(join(scratch, `${base}.html`), html);
			writeFileSync(join(scratch, `${base}.eml`), eml(message, defaultFrom()));
			console.log(`send-samples: wrote ${base}.html, ${base}.eml`);
		} else {
			await (mailer as Mailer).send(message);
			console.log(`send-samples: sent ${subject}`);
			if (args.transport === 'resend') {
				await new Promise((resolve) => setTimeout(resolve, RESEND_DELAY_MS));
			}
		}
		sent++;
	}

	console.log(
		`send-samples: ${sent} e-mail(s) ${scratch === undefined ? 'sent' : 'written'}`,
	);
	printChecklist();
}

/** Dark mode is the client's choice, not the e-mail's: what to look at once one is reopened under it. */
function printChecklist(): void {
	console.log('');
	console.log('Dark mode is chosen by the client, not the e-mail. Checklist:');
	console.log(
		'  - Switch the client or the OS to dark, then reopen each sample.',
	);
	console.log('  - Buttons: readable text, no invisible-on-dark background.');
	console.log(
		'  - Tonal chips (alerts, badges): still readable, no clash with the dark background.',
	);
	console.log('  - The code box: readable in both modes.');
	console.log(
		'  - Logos with a darkSrc configured: the dark image loads instead of the light one.',
	);
	console.log(
		'  - RTL mirroring on ar samples: alert bars, cards, timeline and steps read right to left.',
	);
}

if (import.meta.main) {
	await main();
}
