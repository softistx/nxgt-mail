import { describe, expect, test } from 'bun:test';
import type { Direction } from './direction';
import { localeDirection } from './direction';

describe('localeDirection', () => {
	test.each<[string, Direction]>([
		['en', 'ltr'],
		['fr', 'ltr'],
		['pt-BR', 'ltr'],
		['zh-Hans', 'ltr'],
		['ar', 'rtl'],
		['ar-EG', 'rtl'],
		['he', 'rtl'],
		['fa', 'rtl'],
		['ur', 'rtl'],
	])('%s is %s', (locale, direction) => {
		expect(localeDirection(locale)).toBe(direction);
	});

	test('falls back to the RTL script list for a locale the runtime cannot parse', () => {
		expect(localeDirection('not a locale')).toBe('ltr');
		expect(localeDirection('ar-not-a-region')).toBe('rtl');
	});
});
