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
	if (proposedReturn === null) return;
	const name = 'name' in tag ? tag.name.toLowerCase() : '';
	if (deleteFrom !== null && deleteTo !== null) {
		if (PARAGRAPHS.has(name) || LINES.has(name)) {
			rangesArr.push(
				deleteFrom,
				deleteTo,
				PARAGRAPHS.has(name) ? '\n\n' : '\n',
			);
			return;
		}
	}
	rangesArr.push(...proposedReturn);
}

// What a spacer, a divider or a preheader's padding holds, and a reader never
// sees: a zero-width joiner, space or no-break space, a combining grapheme
// joiner, a figure space, a soft hyphen.
const INVISIBLE = /\u034F|[\u00AD\u2007\u200B-\u200D\u2060\uFEFF]/g;

// An address as a link's text holds it: no space, or one placeholder the
// renderer fills, as `{{ link }}`.
const ADDRESS = /^(?:\S+|\{\{\s*[\w.-]+\s*\}\})$/;

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
		if (line !== '' && previous?.endsWith(line) && ADDRESS.test(line)) {
			continue;
		}
		if (line === '' && (lines.length === 0 || lines.at(-1) === '')) continue;
		lines.push(line);
	}
	while (lines.at(-1) === '') lines.pop();
	return lines.length === 0 ? '' : `${lines.join('\n')}\n`;
}

/** Rewrites each text part Maizzle wrote, tidied; `files` is its `afterBuild`'s. */
export function tidyPlaintextFiles(
	files: readonly string[],
	extension = 'txt',
): void {
	for (const file of files) {
		if (!file.endsWith(`.${extension}`)) continue;
		const text = readFileSync(file, 'utf8');
		const tidied = tidyPlaintext(text);
		if (tidied !== text) writeFileSync(file, tidied);
	}
}
