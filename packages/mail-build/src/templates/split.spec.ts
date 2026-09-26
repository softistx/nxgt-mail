import { describe, expect, test } from 'bun:test';
import { MailBuildError } from '../errors';
import type { RenderedTemplate, Token } from './render';
import { splitHtml, splitText } from './split';

// Placeholders as renderTemplate makes them: prop 0 is `link`, prop 1 `name`.
const P0 = 'QabcP0Q';
const P1 = 'QabcP1Q';
const M0 = 'QabcM0Q';
const LANG = 'QabcL0Q';
const PROPS = ['link', 'name'];

function rendered(html: string, text = ''): RenderedTemplate {
	return {
		html,
		text,
		calls: [],
		placeholder: /Qabc([PML])(\d+)Q/g,
		token(match): Token {
			const index = Number(match[2]);
			if (match[1] === 'M') return { kind: 'message', call: index };
			if (match[1] === 'L') return { kind: 'lang' };
			return { kind: 'prop', prop: PROPS[index] ?? '' };
		},
	};
}

function refusal(html: string): string {
	try {
		splitHtml('a.vue', rendered(html));
	} catch (error) {
		if (error instanceof MailBuildError) {
			expect(error.code).toBe('TEMPLATE_UNSUPPORTED');
			return error.message;
		}
		throw error;
	}
	throw new Error('splitHtml accepted the output');
}

describe('splitHtml', () => {
	test('splits at each placeholder and places it', () => {
		expect(
			splitHtml(
				'a.vue',
				rendered(
					`<html lang="${LANG}"><p title="${M0}">${P1}</p><a href="${P0}">x</a><img src="${P0}"></html>`,
				),
			),
		).toEqual([
			{ kind: 'static', text: '<html lang="' },
			{ kind: 'lang', context: 'attribute' },
			{ kind: 'static', text: '"><p title="' },
			{ kind: 'message', call: 0, context: 'attribute' },
			{ kind: 'static', text: '">' },
			{ kind: 'prop', prop: 'name', context: 'text' },
			{ kind: 'static', text: '</p><a href="' },
			{ kind: 'prop', prop: 'link', context: 'link' },
			{ kind: 'static', text: '">x</a><img src="' },
			{ kind: 'prop', prop: 'link', context: 'resource' },
			{ kind: 'static', text: '"></html>' },
		]);
	});

	test('a value after a fixed http(s) or mailto start is an attribute, not a URL to check', () => {
		expect(
			splitHtml(
				'a.vue',
				rendered(`<a href='https://x.test/?q=${P1}'>x</a>`),
			)[1],
		).toEqual({ kind: 'prop', prop: 'name', context: 'attribute' });
	});

	test('text inside an Outlook conditional comment is text', () => {
		expect(
			splitHtml('a.vue', rendered(`<!--[if mso]><p>${P1}</p><![endif]-->`))[1],
		).toEqual({ kind: 'prop', prop: 'name', context: 'text' });
	});

	const cases: readonly [string, string, string][] = [
		[
			'a value in a <style> element',
			`<style>p { color: ${P1} }</style>`,
			'templates: a.vue: the prop name lands in a <style> element',
		],
		[
			'a value in a <script> element',
			`<script>var x = "${P1}"</script>`,
			'templates: a.vue: the prop name lands in a <script> element',
		],
		[
			'a value in a tag, outside an attribute value',
			`<p ${P1}>x</p>`,
			'templates: a.vue: the prop name lands in a tag outside a quoted attribute value',
		],
		[
			'an unquoted attribute value',
			`<p title=${P1}>x</p>`,
			'templates: a.vue: the prop name lands in a tag outside a quoted attribute value',
		],
		[
			'a value in a style attribute',
			`<p style="color: ${P1}">x</p>`,
			'templates: a.vue: the prop name lands in the style attribute — a value there is code, not text',
		],
		[
			'a value in an event handler',
			`<p onclick="${P1}">x</p>`,
			'templates: a.vue: the prop name lands in the onclick attribute — a value there is code, not text',
		],
		[
			'a link whose fixed start is not http(s)',
			`<a href="javascript:${P1}">x</a>`,
			'templates: a.vue: the prop name lands in a href whose fixed start is not http:, https: or mailto:',
		],
		[
			'a message starting a link',
			`<a href="${M0}">x</a>`,
			'templates: a.vue: a message starts a href — a URL is a prop, checked when the e-mail is rendered',
		],
		[
			'lang starting an image source',
			`<img src="${LANG}">`,
			'templates: a.vue: lang starts a src — a URL is a prop, checked when the e-mail is rendered',
		],
	];
	for (const [name, html, message] of cases) {
		test(`refuses ${name}`, () => {
			expect(refusal(html)).toBe(message);
		});
	}
});

describe('splitText', () => {
	test('places every value as text', () => {
		expect(splitText(rendered('', `${M0}\n\n${P0}`))).toEqual([
			{ kind: 'message', call: 0, context: 'text' },
			{ kind: 'static', text: '\n\n' },
			{ kind: 'prop', prop: 'link', context: 'text' },
		]);
	});
});
