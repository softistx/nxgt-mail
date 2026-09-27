import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPlaintext } from '@maizzle/framework';
import { breakBlocks, tidyPlaintext, tidyPlaintextFiles } from './plaintext';

const strip = (html: string) =>
	createPlaintext(html, {
		cb: breakBlocks,
		dumpLinkHrefsNearby: { enabled: true, putOnNewLine: true },
	});

describe('breakBlocks', () => {
	test('a blank line after a paragraph or a heading', () => {
		expect(tidyPlaintext(strip('<h1>Title</h1><p>One.</p><p>Two.</p>'))).toBe(
			'Title\n\nOne.\n\nTwo.\n',
		);
	});

	test('a line break after a list item, a row, a div or a <br>', () => {
		expect(tidyPlaintext(strip('<ul><li>one</li><li>two</li></ul>'))).toBe(
			'one\ntwo\n',
		);
		expect(
			tidyPlaintext(
				strip('<table><tr><td>a</td></tr><tr><td>b</td></tr></table>'),
			),
		).toBe('a\nb\n');
		expect(tidyPlaintext(strip('<div>x</div><div>y</div>'))).toBe('x\ny\n');
		expect(tidyPlaintext(strip('<p>line one<br>line two</p>'))).toBe(
			'line one\nline two\n',
		);
	});

	test("still writes a link's address after it, in a list item too", () => {
		expect(
			tidyPlaintext(
				strip('<ul><li><a href="https://a.test/x">Docs</a></li></ul>'),
			),
		).toBe('Docs\n\nhttps://a.test/x\n');
	});

	test('joins a source line Maizzle wrapped back into the sentence it broke', () => {
		expect(
			tidyPlaintext(
				strip(
					'<p>If you did not ask for this, you can\nignore this e-mail.</p>',
				),
			),
		).toBe('If you did not ask for this, you can ignore this e-mail.\n');
	});

	test("keeps a link's address on its own line, even where the wrap lands", () => {
		expect(
			tidyPlaintext(
				strip(
					'<p>Or paste this link into your browser:\n<a href="https://a.test/x">https://a.test/x</a></p>',
				),
			),
		).toBe('Or paste this link into your browser:\nhttps://a.test/x\n');
	});

	test("keeps a <pre>'s lines, wrapped or not, between blank lines", () => {
		expect(
			tidyPlaintext(
				strip(
					'<p>Run:</p><pre>line one\nline two\nline three</pre><p>Done.</p>',
				),
			),
		).toBe('Run:\n\nline one\nline two\nline three\n\nDone.\n');
	});
});

describe('tidyPlaintext', () => {
	test('keeps one blank line between paragraphs, and none at either end', () => {
		expect(tidyPlaintext('\n\nHello,\n\n\n\nBye.\n\n')).toBe(
			'Hello,\n\nBye.\n',
		);
	});

	test('does not join lines when breakBlocks left no marker — plaintext: true lost the cb', () => {
		expect(
			tidyPlaintext('If you did not ask for this, you can\nignore it.'),
		).toBe('If you did not ask for this, you can\nignore it.\n');
	});

	test('drops the invisible characters a spacer or a divider holds, and the lines they leave', () => {
		expect(tidyPlaintext('One.\n\n‍\n\nTwo.﻿͏ ')).toBe('One.\n\nTwo.\n');
	});

	test('trims each line', () => {
		expect(tidyPlaintext('  One.  \n\tTwo.\t')).toBe('One.\nTwo.\n');
	});

	test('writes a link once when its text is its address', () => {
		expect(
			tidyPlaintext(
				'Or paste this link: https://example.test/v?t=1\n\nhttps://example.test/v?t=1\n\nBye.',
			),
		).toBe('Or paste this link: https://example.test/v?t=1\n\nBye.\n');
	});

	test('keeps an address after a button, whose text is not the address', () => {
		expect(tidyPlaintext('Confirm my address\n\n{{ link }}')).toBe(
			'Confirm my address\n\n{{ link }}\n',
		);
	});

	test('keeps a sentence that repeats the end of the one before', () => {
		expect(tidyPlaintext('Thank you.\n\nThank you.')).toBe(
			'Thank you.\n\nThank you.\n',
		);
	});

	test.each([
		['a number ending like the one before', 'Seats: 12\n\n2'],
		['a total ending like the one before', 'Total due: 100\n\n0'],
		['a word ending like the one before', 'Acme\n\nme'],
		['the end of an address', 'See https://a.test/x\n\nx'],
		['a line said twice', 'Hello\n\nHello'],
	])('keeps %s', (_, text) => {
		expect(tidyPlaintext(text)).toBe(`${text}\n`);
	});

	test('answers an empty text for an empty part', () => {
		expect(tidyPlaintext('\n ‍ \n')).toBe('');
	});
});

describe('tidyPlaintextFiles', () => {
	const folder = () => mkdtempSync(join(tmpdir(), 'nxgt-mail-config-'));
	const messy = 'One.\n\n\n\u200DTwo.';

	test('tidies the text parts, with the extension plaintext sets', () => {
		const dir = folder();
		const [txt, text] = [join(dir, 'a.txt'), join(dir, 'a.text')];
		writeFileSync(txt, messy);
		writeFileSync(text, messy);
		tidyPlaintextFiles([txt, text], { extension: 'text' });
		expect(readFileSync(text, 'utf8')).toBe('One.\n\nTwo.\n');
		expect(readFileSync(txt, 'utf8')).toBe(messy);
	});

	test('tidies nothing when plaintext is off', () => {
		const file = join(folder(), 'a.txt');
		writeFileSync(file, messy);
		tidyPlaintextFiles([file], false);
		expect(readFileSync(file, 'utf8')).toBe(messy);
	});

	test('never rewrites HTML a template wrote under a text extension', () => {
		const file = join(folder(), 'a.txt');
		const html = '<!DOCTYPE html>\n<html>\n\n\n<p>\u200D</p></html>';
		writeFileSync(file, html);
		tidyPlaintextFiles([file], true);
		expect(readFileSync(file, 'utf8')).toBe(html);
	});
});
