import { readFileSync, writeFileSync } from 'node:fs';
import type { MaizzleConfig } from '@maizzle/framework';

/**
 * The tags that end a paragraph, followed by a blank line, and those that end
 * a line. Maizzle's build writes the HTML on few lines, and
 * `string-strip-html` keeps only the line breaks it finds, so without these
 * the text part runs the whole e-mail onto one line.
 */
const PARAGRAPHS = new Set([
	'blockquote',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'ol',
	'p',
	'table',
	'ul',
]);
const LINES = new Set(['br', 'div', 'hr', 'li', 'tr']);

type StripOptions = NonNullable<
	Extract<MaizzleConfig['plaintext'], object>['options']
>;
/** What `string-strip-html` hands its `cb`. */
type StripTag = Parameters<NonNullable<StripOptions['cb']>>[0];

/**
 * The `cb` of Maizzle's `plaintext.options`: a paragraph, a heading, a list
 * or a table ends with a blank line, a `<br>`, a `<div>`, a row or a list item
 * with a line break, and every other tag is stripped as
 * `string-strip-html` proposes — a link's address still written after it.
 */
export function breakBlocks({
	tag,
	deleteFrom,
	deleteTo,
	rangesArr,
	proposedReturn,
}: StripTag): void {
	if (proposedReturn === null || deleteFrom === null || deleteTo === null) {
		return;
	}
	const name = 'name' in tag ? tag.name.toLowerCase() : '';
	// A line ends where its element closes: breaking at both ends would give
	// two items in a row a blank line between them, as two paragraphs.
	const closes = !('slashPresent' in tag) || tag.slashPresent !== false;
	if (PARAGRAPHS.has(name)) {
		rangesArr.push(deleteFrom, deleteTo, '\n\n');
	} else if (name === 'br' || name === 'hr' || (LINES.has(name) && closes)) {
		rangesArr.push(deleteFrom, deleteTo, '\n');
	} else {
		rangesArr.push(...proposedReturn);
	}
}

// What a spacer, a divider or a preheader's padding holds, and a reader never
// sees: a zero-width joiner, space or no-break space, a combining grapheme
// joiner, a figure space, a soft hyphen.
const INVISIBLE = /\u034F|[\u00AD\u2007\u200B-\u200D\u2060\uFEFF]/g;

// A link's address as `dumpLinkHrefsNearby` writes it: a URL with its scheme,
// or one placeholder the renderer fills, as `{{ link }}`.
const ADDRESS = /^(?:[a-z][\w+.-]*:\S+|\{\{\s*[\w.-]+\s*\}\})$/i;

/**
 * The text part tidied: no invisible characters, no trailing spaces, at most
 * one blank line in a row, and no address repeated on its own line when the
 * line before already ends with it — a link whose text is its address.
 */
export function tidyPlaintext(text: string): string {
	const lines: string[] = [];
	for (const raw of text.replace(INVISIBLE, '').split(/\r?\n/)) {
		const line = raw.trim();
		const previous = lines.findLast((kept) => kept !== '');
		const repeated =
			previous !== undefined &&
			(previous === line || previous.endsWith(` ${line}`));
		if (repeated && ADDRESS.test(line)) {
			continue;
		}
		if (line === '' && (lines.length === 0 || lines.at(-1) === '')) continue;
		lines.push(line);
	}
	while (lines.at(-1) === '') lines.pop();
	return lines.length === 0 ? '' : `${lines.join('\n')}\n`;
}

// HTML a template wrote under a text part's extension, which is never tidied.
const HTML = /^\s*<(?:!doctype|html)\b/i;

/**
 * Rewrites each text part Maizzle wrote, tidied: the files of its
 * `afterBuild` with the `plaintext` extension, none when `plaintext` is off,
 * and never one that holds HTML.
 */
export function tidyPlaintextFiles(
	files: readonly string[],
	plaintext: MaizzleConfig['plaintext'],
): void {
	if (!plaintext) return;
	const extension =
		typeof plaintext === 'object' ? (plaintext.extension ?? 'txt') : 'txt';
	for (const file of files) {
		if (!file.endsWith(`.${extension}`)) continue;
		const text = readFileSync(file, 'utf8');
		if (HTML.test(text)) continue;
		const tidied = tidyPlaintext(text);
		if (tidied !== text) writeFileSync(file, tidied);
	}
}
