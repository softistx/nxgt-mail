import { describe, expect, test } from 'bun:test';
import { MailBuildError } from '../errors';
import type { Catalogue } from '../messages/catalogue';
import { compileMail } from './compile';

// Each case renders with Maizzle, about half a second each.
const TIMEOUT = 30_000;

const EN: Catalogue = {
	a: {
		subject: 'Hello',
		title: 'Title',
		body: 'Hello {name}',
		at: 'On {at, date, long}',
	},
	b: { title: 'No subject' },
};
const FR: Catalogue = {
	a: {
		subject: 'Bonjour',
		title: 'Titre',
		body: 'Bonjour {name}',
		at: 'Le {at, date, long}',
	},
	b: { title: 'Pas de sujet' },
};

const sfc = (template: string, props: readonly string[]) =>
	`<script setup>\ndefineProps(${JSON.stringify(props)})\n</script>\n<template>\n<Layout :lang="lang">${template}</Layout>\n</template>\n`;

function compile(file: string, source: string, en: Catalogue = EN) {
	return compileMail({
		locales: ['en', 'fr'],
		fallbackLocale: 'en',
		sources: [
			{ name: 'messages/', catalogues: { en, fr: en === EN ? FR : en } },
		],
		templates: [{ file, source }],
	});
}

async function refusal(
	file: string,
	source: string,
	en?: Catalogue,
): Promise<MailBuildError> {
	return compile(file, source, en).then(
		() => {
			throw new Error('compileMail accepted the template');
		},
		(error: unknown) => {
			if (error instanceof MailBuildError) return error;
			throw error;
		},
	);
}

describe('compileMail', () => {
	test(
		'types each prop from its messages, and marks a link',
		async () => {
			const { emails, module } = await compile(
				'a.vue',
				sfc(
					"<p>{{ t('a.body', { name }) }} {{ t('a.at', { at: when }) }}</p><a :href=\"link\">{{ name }}</a>",
					['name', 'when', 'link'],
				),
			);
			expect(emails).toEqual([
				{
					name: 'a',
					file: 'a.vue',
					props: new Map([
						['link', { kind: 'string', url: 'link' }],
						['name', { kind: 'string', url: null }],
						['when', { kind: 'date', url: null }],
					]),
				},
			]);
			expect(module).toContain(
				'"a": { readonly locale: Locale; readonly timeZone?: string; readonly link: string; readonly name: string; readonly when: Date; };',
			);
		},
		TIMEOUT,
	);

	const cases: readonly [string, string, string, string, string, Catalogue?][] =
		[
			[
				'an unknown key',
				'a.vue',
				sfc("<p>{{ t('a.titel') }}</p>", []),
				'TEMPLATE_KEY_UNKNOWN',
				"templates: a.vue: t('a.titel') is not a key of en, the fallback locale",
			],
			[
				'a missing argument',
				'a.vue',
				sfc("<p>{{ t('a.body') }}</p>", []),
				'TEMPLATE_ARGUMENT_MISSING',
				"templates: a.vue: t('a.body') leaves out {name}, which en declares — pass it a prop",
			],
			[
				'an argument the message does not declare',
				'a.vue',
				sfc("<p>{{ t('a.title', { name }) }}</p>", ['name']),
				'TEMPLATE_ARGUMENT_UNKNOWN',
				"templates: a.vue: t('a.title') passes {name}, which en does not declare",
			],
			[
				'an e-mail with no subject',
				'b.vue',
				sfc("<p>{{ t('b.title') }}</p>", []),
				'SUBJECT_MISSING',
				'templates: b.vue: the e-mail b has no subject — add b.subject to en, the fallback locale',
			],
			[
				'a subject argument that is not a prop',
				'a.vue',
				sfc("<p>{{ t('a.title') }}</p>", []),
				'TEMPLATE_ARGUMENT_MISSING',
				'templates: a.vue: a.subject uses {name}, which is not a prop of the template — declare it with defineProps',
				{ a: { subject: 'Hi {name}', title: 'T' } },
			],
			[
				'a date written as is',
				'a.vue',
				sfc("<p>{{ t('a.at', { at }) }} {{ at }}</p>", ['at']),
				'ARGUMENT_TYPE_MISMATCH',
				"templates: a.vue: the prop at is a date in t('a.at'), and written as is in the template",
			],
			[
				'a number used as a link',
				'a.vue',
				sfc('<p>{{ t(\'a.n\', { n }) }}</p><a :href="n">x</a>', ['n']),
				'ARGUMENT_TYPE_MISMATCH',
				"templates: a.vue: the prop n is a number in t('a.n'), and a link in the template",
				{ a: { subject: 'S', n: '{n, number}' } },
			],
			[
				'a prop never used',
				'a.vue',
				sfc("<p>{{ t('a.title') }}</p>", ['name']),
				'TEMPLATE_UNSUPPORTED',
				'templates: a.vue: declares the prop name and never uses it — remove it, or write it in the template',
			],
			[
				'a message as a link',
				'a.vue',
				sfc('<a :href="t(\'a.title\')">x</a>', []),
				'TEMPLATE_UNSUPPORTED',
				'templates: a.vue: a message starts a href — a URL is a prop, checked when the e-mail is rendered',
			],
			[
				'a prop in a style attribute',
				'a.vue',
				sfc('<p :style="name">x</p>', ['name']),
				'TEMPLATE_UNSUPPORTED',
				'templates: a.vue: the prop name lands in the style attribute — a value there is code, not text',
			],
			[
				'a prop in an event attribute',
				'a.vue',
				sfc('<p :onclick="name">x</p>', ['name']),
				'TEMPLATE_UNSUPPORTED',
				'templates: a.vue: the prop name lands in the onclick attribute — a value there is code, not text',
			],
		];
	for (const [name, file, source, code, message, en] of cases) {
		test(
			`refuses ${name}`,
			async () => {
				const error = await refusal(file, source, en);
				expect(error.message).toBe(message);
				expect(error.code).toBe(code as MailBuildError['code']);
				expect(error.template).toBe(file);
			},
			TIMEOUT,
		);
	}

	test(
		'refuses a template Maizzle cannot render, naming it',
		async () => {
			const error = await refusal(
				'a.vue',
				"<script setup>\ndefineProps([])\nthrow new Error('boom')\n</script>\n<template><p>{{ t('a.title') }}</p></template>",
			);
			expect(error.code).toBe('TEMPLATE_INVALID');
			expect(error.message).toStartWith(
				'templates: a.vue: Maizzle could not render it (',
			);
		},
		TIMEOUT,
	);
});
