import { MailBuildError } from '../errors';
import type { RenderedTemplate, Token } from './render';

/**
 * Where a value lands, which decides what the render function does to it:
 *
 * - `text` and `attribute`: HTML-escaped (in `html`; `text` is left as is);
 * - `link`: an `href` it starts — escaped, and refused unless `http:`,
 *   `https:` or `mailto:`;
 * - `resource`: a `src` it starts — escaped, and refused unless `http:` or
 *   `https:`.
 */
export type Context = 'text' | 'attribute' | 'link' | 'resource';

export type Segment =
	| { readonly kind: 'static'; readonly text: string }
	| (Token & { readonly context: Context });

// Attributes a browser or a mail client follows as a URL.
const LINKS = new Set(['href', 'xlink:href', 'action', 'formaction']);
const RESOURCES = new Set(['src', 'background', 'poster', 'cite']);
const SAFE_PREFIX = /^(https?:\/\/|mailto:)/i;

// The attribute a position inside a tag belongs to, and the value before it.
const ATTRIBUTE = /\s([^\s"'=<>/]+)\s*=\s*(?:"([^"]*)|'([^']*))$/;

function unsupported(file: string, what: string): MailBuildError {
	return new MailBuildError(
		'TEMPLATE_UNSUPPORTED',
		`templates: ${file}: ${what}`,
		{ template: file },
	);
}

function inside(html: string, position: number, open: string, close: string) {
	return html.lastIndexOf(open, position) > html.lastIndexOf(close, position);
}

function describe(token: Token): string {
	if (token.kind === 'prop') return `the prop ${token.prop}`;
	if (token.kind === 'lang') return 'lang';
	return 'a message';
}

function contextOf(
	file: string,
	html: string,
	position: number,
	token: Token,
): Context {
	if (inside(html, position, '<style', '</style')) {
		throw unsupported(file, `${describe(token)} lands in a <style> element`);
	}
	if (inside(html, position, '<script', '</script')) {
		throw unsupported(file, `${describe(token)} lands in a <script> element`);
	}
	const tagStart = html.lastIndexOf('<', position);
	if (tagStart <= html.lastIndexOf('>', position)) return 'text';

	const attribute = ATTRIBUTE.exec(html.slice(tagStart, position));
	if (attribute === null) {
		throw unsupported(
			file,
			`${describe(token)} lands in a tag outside a quoted attribute value`,
		);
	}
	const name = (attribute[1] ?? '').toLowerCase();
	const before = attribute[2] ?? attribute[3] ?? '';
	if (name === 'style' || name.startsWith('on')) {
		throw unsupported(
			file,
			`${describe(token)} lands in the ${name} attribute — a value there is code, not text`,
		);
	}
	const link = LINKS.has(name);
	if (!link && !RESOURCES.has(name)) return 'attribute';
	if (before !== '') {
		// The scheme is fixed by the template: the value only adds to it.
		if (SAFE_PREFIX.test(before)) return 'attribute';
		throw unsupported(
			file,
			`${describe(token)} lands in a ${name} whose fixed start is not http:, https: or mailto:`,
		);
	}
	if (token.kind !== 'prop') {
		throw unsupported(
			file,
			`${describe(token)} starts a ${name} — a URL is a prop, checked when the e-mail is rendered`,
		);
	}
	return link ? 'link' : 'resource';
}

function split(
	output: string,
	rendered: RenderedTemplate,
	context: (position: number, token: Token) => Context,
): Segment[] {
	const segments: Segment[] = [];
	let last = 0;
	for (const match of output.matchAll(rendered.placeholder)) {
		const position = match.index;
		if (position > last) {
			segments.push({ kind: 'static', text: output.slice(last, position) });
		}
		const token = rendered.token(match);
		segments.push({ ...token, context: context(position, token) });
		last = position + match[0].length;
	}
	if (last < output.length) {
		segments.push({ kind: 'static', text: output.slice(last) });
	}
	return segments;
}

/** The `html` of a rendered template, split at its placeholders, each placed. */
export function splitHtml(file: string, rendered: RenderedTemplate): Segment[] {
	return split(rendered.html, rendered, (position, token) =>
		contextOf(file, rendered.html, position, token),
	);
}

/** The `text` of a rendered template, split at its placeholders. */
export function splitText(rendered: RenderedTemplate): Segment[] {
	return split(rendered.text, rendered, () => 'text');
}
