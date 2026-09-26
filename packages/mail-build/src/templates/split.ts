import { templateError } from './error';
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

// Attributes whose value is text once escaped. Anything else — `style`,
// `on*`, `srcdoc`, `srcset`, `content`, `data`… — is code or a URL list, and
// a value there fails the build.
const TEXT_ATTRIBUTES = new Set([
	'alt',
	'title',
	'lang',
	'xml:lang',
	'dir',
	'id',
	'name',
	'class',
	'role',
	'width',
	'height',
	'label',
	'summary',
	'abbr',
]);
const TEXT_PREFIXES = ['aria-', 'data-'];
// Attributes a mail client follows as one URL.
const LINKS = new Set(['href', 'xlink:href']);
const RESOURCES = new Set(['src', 'background', 'poster']);
const SAFE_PREFIX = /^(https?:\/\/|mailto:)/i;
const RAW_TEXT = new Set(['style', 'script']);

/** What the scanner is in at a position of the output. */
type State =
	| { readonly in: 'text' | 'comment' | 'declaration' | 'tag' | 'unquoted' }
	| { readonly in: 'raw'; readonly element: string }
	| { readonly in: 'value'; readonly name: string; readonly quote: string };

/** The state at a placeholder, and the attribute value before it when in one. */
interface Place {
	readonly state: State;
	readonly before: string;
}

function describe(token: Token): string {
	if (token.kind === 'prop') return `the prop ${token.prop}`;
	if (token.kind === 'lang') return 'lang';
	return 'a message';
}

const article = (name: string) =>
	name.startsWith('href') || name.startsWith('xlink') ? 'an' : 'a';

const TAG = /^<\/?([A-Za-z][\w:-]*)/;
const ATTRIBUTE = /^([^\s"'=<>/]+)(\s*=\s*(["']?))?/;

/**
 * Scans HTML forwards, one character at a time — text, tags, quoted and
 * unquoted attribute values, comments, declarations, raw-text elements — and
 * answers the state at each placeholder. A `>` inside an attribute value stays
 * in it; the content of an Outlook conditional comment is markup, scanned as
 * such.
 */
function scan(
	html: string,
	placeholders: readonly { readonly index: number; readonly length: number }[],
): Place[] {
	const places: Place[] = [];
	let state: State = { in: 'text' };
	let element = '';
	let valueStart = 0;
	let next = 0;
	let i = 0;

	// Advances to `to`; a placeholder crossed on the way was inside a tag's
	// syntax — an attribute name, a tag name — where no value belongs.
	const advance = (to: number) => {
		while (
			next < placeholders.length &&
			(placeholders[next]?.index ?? 0) < to
		) {
			places.push({ state: { in: 'tag' }, before: '' });
			next += 1;
		}
		i = to;
	};

	while (i < html.length) {
		const placeholder = placeholders[next];
		if (placeholder !== undefined && placeholder.index === i) {
			places.push({
				state,
				before: state.in === 'value' ? html.slice(valueStart, i) : '',
			});
			next += 1;
			i += placeholder.length;
			continue;
		}
		const char = html[i];
		switch (state.in) {
			case 'text': {
				if (html.startsWith('<!--[if', i)) state = { in: 'declaration' };
				else if (html.startsWith('<!--', i)) {
					state = { in: 'comment' };
					advance(i + 4);
					continue;
				} else if (html.startsWith('<!', i)) state = { in: 'declaration' };
				else {
					const tag = TAG.exec(html.slice(i, i + 64));
					if (tag !== null) {
						element = tag[0].startsWith('</')
							? ''
							: (tag[1] ?? '').toLowerCase();
						state = { in: 'tag' };
						advance(i + tag[0].length);
						continue;
					}
				}
				i += 1;
				continue;
			}
			case 'comment':
				if (html.startsWith('-->', i)) {
					state = { in: 'text' };
					advance(i + 3);
					continue;
				}
				i += 1;
				continue;
			case 'declaration':
				if (char === '>') state = { in: 'text' };
				i += 1;
				continue;
			case 'raw':
				if (
					html.slice(i, i + state.element.length + 2).toLowerCase() ===
					`</${state.element}`
				) {
					state = { in: 'tag' };
					element = '';
					advance(i + 2);
					continue;
				}
				i += 1;
				continue;
			case 'tag': {
				if (char === '>') {
					state = RAW_TEXT.has(element)
						? { in: 'raw', element }
						: { in: 'text' };
					i += 1;
					continue;
				}
				const attribute = ATTRIBUTE.exec(html.slice(i, i + 256));
				if (attribute === null) {
					i += 1; // whitespace or `/`
					continue;
				}
				const quote = attribute[3];
				if (attribute[2] !== undefined) {
					state =
						quote === '' || quote === undefined
							? { in: 'unquoted' }
							: {
									in: 'value',
									name: (attribute[1] ?? '').toLowerCase(),
									quote,
								};
				}
				advance(i + attribute[0].length);
				valueStart = i;
				continue;
			}
			case 'unquoted':
				if (char === '>' || /\s/.test(char ?? '')) state = { in: 'tag' };
				else i += 1;
				continue;
			case 'value':
				if (char === state.quote) state = { in: 'tag' };
				i += 1;
				continue;
		}
	}
	return places;
}

function contextOf(file: string, place: Place, token: Token): Context {
	const refuse = (what: string) =>
		templateError('TEMPLATE_UNSUPPORTED', file, `${describe(token)} ${what}`);
	const { state, before } = place;
	switch (state.in) {
		case 'text':
		case 'comment':
			return 'text';
		case 'raw':
			throw refuse(`lands in a <${state.element}> element`);
		case 'declaration':
		case 'tag':
		case 'unquoted':
			throw refuse('lands in a tag outside a quoted attribute value');
		case 'value':
			break;
	}
	const name = state.name;
	const link = LINKS.has(name);
	if (link || RESOURCES.has(name)) {
		if (before !== '') {
			// The scheme is fixed by the template: the value only adds to it.
			if (SAFE_PREFIX.test(before)) return 'attribute';
			throw refuse(
				`lands in ${article(name)} ${name} whose fixed start is not http:, https: or mailto:`,
			);
		}
		if (token.kind !== 'prop') {
			throw refuse(
				`starts ${article(name)} ${name} — a URL is a prop, checked when the e-mail is rendered`,
			);
		}
		return link ? 'link' : 'resource';
	}
	if (
		TEXT_ATTRIBUTES.has(name) ||
		TEXT_PREFIXES.some((prefix) => name.startsWith(prefix))
	) {
		return 'attribute';
	}
	throw refuse(
		`lands in the ${name} attribute — only text attributes (alt, title, aria-*…) and URLs (href, src) take a value`,
	);
}

function split(
	output: string,
	rendered: RenderedTemplate,
	context: (index: number, token: Token) => Context,
): Segment[] {
	const segments: Segment[] = [];
	let last = 0;
	let index = 0;
	for (const match of output.matchAll(rendered.placeholder)) {
		if (match.index > last) {
			segments.push({ kind: 'static', text: output.slice(last, match.index) });
		}
		const token = rendered.token(match);
		segments.push({ ...token, context: context(index, token) });
		index += 1;
		last = match.index + match[0].length;
	}
	if (last < output.length) {
		segments.push({ kind: 'static', text: output.slice(last) });
	}
	return segments;
}

/** The `html` of a rendered template, split at its placeholders, each placed. */
export function splitHtml(file: string, rendered: RenderedTemplate): Segment[] {
	const places = scan(
		rendered.html,
		[...rendered.html.matchAll(rendered.placeholder)].map((match) => ({
			index: match.index,
			length: match[0].length,
		})),
	);
	return split(rendered.html, rendered, (index, token) => {
		const place = places[index];
		if (place === undefined)
			throw new Error('splitHtml: a placeholder was not scanned');
		return contextOf(file, place, token);
	});
}

/** The `text` of a rendered template, split at its placeholders. */
export function splitText(rendered: RenderedTemplate): Segment[] {
	return split(rendered.text, rendered, () => 'text');
}
