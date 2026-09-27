import { describe, expect, test } from 'bun:test';
import { tidyPlaintext } from './plaintext';

describe('tidyPlaintext', () => {
	test('keeps one blank line between paragraphs, and none at either end', () => {
		expect(tidyPlaintext('\n\nHello,\n\n\n\nBye.\n\n')).toBe(
			'Hello,\n\nBye.\n',
		);
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

	test('answers an empty text for an empty part', () => {
		expect(tidyPlaintext('\n ‍ \n')).toBe('');
	});
});
