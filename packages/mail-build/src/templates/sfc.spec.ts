import { describe, expect, test } from 'bun:test';
import { MailBuildError } from '../errors';
import { emailName, readTemplate } from './sfc';

const sfc = (template: string, props = "'name', 'link'") =>
	`<script setup>\ndefineProps([${props}])\n</script>\n<template>\n${template}\n</template>\n`;

function refusal(file: string, source: string): MailBuildError {
	try {
		readTemplate(file, source);
	} catch (error) {
		if (error instanceof MailBuildError) return error;
		throw error;
	}
	throw new Error('readTemplate accepted the template');
}

describe('readTemplate', () => {
	test('reads the props and names the e-mail after the file', () => {
		const template = readTemplate(
			'verify-email.vue',
			sfc(
				'<Layout :lang="lang"><Text>{{ t(\'a.b\', { name }) }}</Text><Button :href="link">{{ t("a.c") }}</Button></Layout>',
			),
		);
		expect(template.email).toBe('verifyEmail');
		expect(template.props).toEqual(['name', 'link']);
	});

	test('accepts a renamed argument, a bound message and a template without script', () => {
		expect(
			readTemplate(
				'a.vue',
				sfc(
					'<img :alt="t(\'a.alt\')" :src="link"><p>{{ t(\'a.b\', { who: name }) }}</p>',
				),
			).props,
		).toEqual(['name', 'link']);
		expect(
			readTemplate('b.vue', "<template><p>{{ t('b.c') }}</p></template>").props,
		).toEqual([]);
	});

	test('emailName camel-cases a kebab-case file name', () => {
		expect(emailName('reset-password-2.vue')).toBe('resetPassword2');
	});

	const cases: readonly [string, string, string, string, string][] = [
		[
			'a file name that is not kebab-case',
			'VerifyEmail.vue',
			sfc('<p></p>'),
			'TEMPLATE_INVALID',
			'templates: VerifyEmail.vue: is not a kebab-case .vue file name — name it as verify-email.vue',
		],
		[
			'a template that does not parse',
			'a.vue',
			'<template><p>{{ name </p></template>',
			'TEMPLATE_INVALID',
			'templates: a.vue: does not parse as a single-file component (Interpolation end sign was not found.)',
		],
		[
			'no <template>',
			'a.vue',
			'<script setup>\ndefineProps([])\n</script>',
			'TEMPLATE_INVALID',
			'templates: a.vue: has no <template>',
		],
		[
			'a <script> without setup',
			'a.vue',
			'<script>\nexport default {}\n</script>\n<template><p></p></template>',
			'TEMPLATE_INVALID',
			'templates: a.vue: has a <script> without setup — declare the props in <script setup>',
		],
		[
			'a constant in <script setup>',
			'a.vue',
			'<script setup>\ndefineProps([])\nconst x = 1\n</script>\n<template><p>{{ x }}</p></template>',
			'TEMPLATE_UNSUPPORTED',
			'templates: a.vue: holds code in <script setup> — a template declares its props with defineProps([...]), unassigned, and nothing else',
		],
		[
			'a statement run at build time',
			'a.vue',
			"<script setup>\ndefineProps([])\nconsole.log('built')\n</script>\n<template><p></p></template>",
			'TEMPLATE_UNSUPPORTED',
			'templates: a.vue: holds code in <script setup> — a template declares its props with defineProps([...]), unassigned, and nothing else',
		],
		[
			'assigned props',
			'a.vue',
			"<script setup>\nconst props = defineProps(['name'])\n</script>\n<template><p>{{ name }}</p></template>",
			'TEMPLATE_UNSUPPORTED',
			'templates: a.vue: holds code in <script setup> — a template declares its props with defineProps([...]), unassigned, and nothing else',
		],
		[
			'a reserved prop',
			'a.vue',
			sfc('<p>{{ locale }}</p>', "'locale'"),
			'TEMPLATE_INVALID',
			'templates: a.vue: declares the prop locale, a name the render function uses itself',
		],
		[
			'a prop that is not camelCase',
			'a.vue',
			sfc('<p>{{ first_name }}</p>', "'first_name'"),
			'TEMPLATE_INVALID',
			'templates: a.vue: declares the prop first_name, which is not camelCase — name it as firstName',
		],
		[
			'v-if',
			'a.vue',
			sfc('<p v-if="name">x</p>'),
			'TEMPLATE_UNSUPPORTED',
			'templates: a.vue: <p> uses v-if — a template renders once, at build time, so it has no condition, no loop and no event',
		],
		[
			'v-for',
			'a.vue',
			sfc('<p v-for="x in name">x</p>'),
			'TEMPLATE_UNSUPPORTED',
			'templates: a.vue: <p> uses v-for — a template renders once, at build time, so it has no condition, no loop and no event',
		],
		[
			'v-html',
			'a.vue',
			sfc('<p v-html="name"></p>'),
			'TEMPLATE_UNSUPPORTED',
			'templates: a.vue: <p> uses v-html — a template renders once, at build time, so it has no condition, no loop and no event',
		],
		[
			'v-on',
			'a.vue',
			sfc('<p @click="name">x</p>'),
			'TEMPLATE_UNSUPPORTED',
			'templates: a.vue: <p> uses v-on — a template renders once, at build time, so it has no condition, no loop and no event',
		],
		[
			'an object bound with v-bind',
			'a.vue',
			sfc('<p v-bind="name">x</p>'),
			'TEMPLATE_UNSUPPORTED',
			'templates: a.vue: <p> binds an object with v-bind — bind each attribute by name',
		],
		[
			'an expression on a prop',
			'a.vue',
			sfc('<p>{{ name.toUpperCase() }}</p>'),
			'TEMPLATE_UNSUPPORTED',
			"templates: a.vue: {{ }} holds an expression — write a prop, or t('key', { prop }), and nothing else",
		],
		[
			'an undeclared name',
			'a.vue',
			sfc('<p>{{ nme }}</p>'),
			'TEMPLATE_UNSUPPORTED',
			'templates: a.vue: {{ }} uses nme, which is not a prop — declare it with defineProps',
		],
		[
			'an undeclared name in an attribute',
			'a.vue',
			sfc('<a :href="url">x</a>'),
			'TEMPLATE_UNSUPPORTED',
			'templates: a.vue: <a> :href uses url, which is not a prop — declare it with defineProps',
		],
		[
			'a computed key',
			'a.vue',
			sfc("<p>{{ t('a.' + name) }}</p>"),
			'TEMPLATE_UNSUPPORTED',
			"templates: a.vue: {{ }} holds an expression — write a prop, or t('key', { prop }), and nothing else",
		],
		[
			'an argument that is not a prop',
			'a.vue',
			sfc("<p>{{ t('a.b', { name: 'Ada' }) }}</p>"),
			'TEMPLATE_UNSUPPORTED',
			"templates: a.vue: {{ }} holds an expression — write a prop, or t('key', { prop }), and nothing else",
		],
		[
			'a third argument to t',
			'a.vue',
			sfc("<p>{{ t('a.b', { name }, 1) }}</p>"),
			'TEMPLATE_UNSUPPORTED',
			"templates: a.vue: {{ }} holds an expression — write a prop, or t('key', { prop }), and nothing else",
		],
	];

	for (const [name, file, source, code, message] of cases) {
		test(`refuses ${name}`, () => {
			const error = refusal(file, source);
			expect(error.code).toBe(code as MailBuildError['code']);
			expect(error.message).toBe(message);
			expect(error.template).toBe(file);
		});
	}
});
