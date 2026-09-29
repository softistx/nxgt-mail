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
const CELLS = new Set(['td', 'th']);

// A `<pre>` keeps the source's line breaks: a code sample, not prose Maizzle
// wrapped. `breakBlocks` brackets it so `tidyPlaintext` can tell the two
// apart and leave the ones inside alone.
const VERBATIM = new Set(['pre']);

/**
 * What `breakBlocks` inserts instead of a real line break, so `tidyPlaintext`
 * can tell one from a source line Maizzle wrapped: a private-use character
 * for a blank line, another for a line break. Neither ever reaches a text
 * part: `tidyPlaintext` replaces both. U+2028 and U+2029 read as the
 * obvious choice, but `string-strip-html` treats both as whitespace and
 * folds them into an ordinary space before the `cb`'s caller ever sees them
 * \u2014 a private-use pair does not.
 */
const PARAGRAPH_MARK = '\uE002';
const LINE_MARK = '\uE003';
// The end of a table cell: a space in the text part, whatever whitespace a
// minifier left before it (see `unwrapSourceLines`).
const CELL_MARK = '\uE004';

// The start and the end of a `<pre>`'s content, a private-use pair no source
// ever contains. `tidyPlaintext` strips them once it has protected what they
// bracket.
const VERBATIM_START = '\uE000';
const VERBATIM_END = '\uE001';

type StripOptions = NonNullable<
	Extract<MaizzleConfig['plaintext'], object>['options']
>;
/** What `string-strip-html` hands its `cb`. */
type StripTag = Parameters<NonNullable<StripOptions['cb']>>[0];

/**
 * The `cb` of Maizzle's `plaintext.options`: a paragraph, a heading, a list
 * or a table ends with a blank line, a `<br>`, a `<div>`, a row or a list item
 * with a line break, a `<pre>`'s content is kept verbatim between a blank
 * line on either side, and every other tag is stripped as
 * `string-strip-html` proposes — a link's address still written after it.
 * A blank line and a line break are markers, not `\n\n` and `\n`:
 * `tidyPlaintext` turns them into real line breaks once it has told apart the
 * ones a source line's wrapping left from these.
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
	if (VERBATIM.has(name)) {
		rangesArr.push(
			deleteFrom,
			deleteTo,
			closes
				? `${VERBATIM_END}${PARAGRAPH_MARK}`
				: `${PARAGRAPH_MARK}${VERBATIM_START}`,
		);
	} else if (PARAGRAPHS.has(name)) {
		rangesArr.push(deleteFrom, deleteTo, PARAGRAPH_MARK);
	} else if (CELLS.has(name) && closes) {
		rangesArr.push(deleteFrom, deleteTo, CELL_MARK);
	} else if (name === 'br' || name === 'hr' || (LINES.has(name) && closes)) {
		rangesArr.push(deleteFrom, deleteTo, LINE_MARK);
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

// A `<pre>`'s content, still bracketed by `breakBlocks`'s pair.
const VERBATIM_BLOCK = new RegExp(
	`${VERBATIM_START}([\\s\\S]*?)${VERBATIM_END}`,
	'g',
);

// Either mark `breakBlocks` writes, built from the same constants: one
// pattern to keep them in step, however many places read one.
const MARK_CLASS = `[${PARAGRAPH_MARK}${LINE_MARK}${CELL_MARK}]`;

/**
 * A real line break `breakBlocks` never wrote: a source line Maizzle
 * wrapped, unless it only pushes a `<pre>`'s content off, or leaves a link's
 * address on its own line — `dumpLinkHrefsNearby`'s doing, kept nearby.
 */
const HAS_MARK = new RegExp(MARK_CLASS);

// A cell's end and the space around it: one space between two cells.
const CELLS_BREAK = new RegExp(`[ \\t]*${CELL_MARK}[ \\t]*`, 'g');

/** The line a marker-bounded chunk ends with (or starts with), trimmed. */
function edgeLine(chunk: string, edge: 'start' | 'end'): string {
	if (edge === 'start') {
		const at = chunk.search(MARK_CLASS);
		return (at === -1 ? chunk : chunk.slice(0, at)).trim();
	}
	const at = Math.max(
		chunk.lastIndexOf(PARAGRAPH_MARK),
		chunk.lastIndexOf(LINE_MARK),
		chunk.lastIndexOf(CELL_MARK),
	);
	return chunk.slice(at + 1).trim();
}

/**
 * A run of `\r?\n`, with the horizontal space around it: replaced by one
 * space when it merely wraps a source line, kept when the line it borders —
 * before or after — is empty (`dumpLinkHrefsNearby` sets a link's address
 * off with a blank line on either side; a source line's wrap never leaves a
 * line blank) or is a link's address on its own line.
 */
function unwrapSourceLines(text: string): string {
	const segments = text.split(/([ \t]*\r?\n[ \t]*)/);
	let result = segments[0] ?? '';
	for (let i = 1; i < segments.length; i += 2) {
		const before = segments[i - 1] ?? '';
		const after = segments[i + 1] ?? '';
		const prevLine = edgeLine(before, 'end');
		const nextLine = edgeLine(after, 'start');
		// A cell ends here: the wrap is only the whitespace a minifier leaves
		// before `</td>`, and the cell mark stands for the break between cells.
		if (before.endsWith(CELL_MARK) || after.startsWith(CELL_MARK)) {
			result = `${result}${after}`;
			continue;
		}
		const keep =
			prevLine === '' ||
			nextLine === '' ||
			ADDRESS.test(prevLine) ||
			ADDRESS.test(nextLine);
		result = keep ? `${result}\n${after}` : `${result} ${after}`;
	}
	return result;
}

/**
 * The text part tidied: no invisible characters, no trailing spaces, at most
 * one blank line in a row, and no address repeated on its own line when the
 * line before already ends with it — a link whose text is its address.
 *
 * When `breakBlocks` ran, its markers are still there: every other line
 * break is a source line Maizzle wrapped, joined into the sentence it broke
 * — except a `<pre>`'s, kept, and a link's address, left on its own line.
 * The markers themselves then become the line break they stand for. Without
 * a marker, `plaintext: true` dropped `breakBlocks`: nothing is joined.
 */
export function tidyPlaintext(text: string): string {
	const unwrapped = HAS_MARK.test(text)
		? text
				.split(VERBATIM_BLOCK)
				.map((part, i) => (i % 2 === 1 ? part : unwrapSourceLines(part)))
				.join('')
				.replaceAll(PARAGRAPH_MARK, '\n\n')
				.replaceAll(LINE_MARK, '\n')
				.replace(CELLS_BREAK, ' ')
		: text;
	const lines: string[] = [];
	for (const raw of unwrapped.replace(INVISIBLE, '').split(/\r?\n/)) {
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
