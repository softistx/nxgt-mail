import { describe, expect, it } from 'bun:test';
import { parseAcceptLanguage, pickLocale } from './locale';

const supported = ['en', 'fr'] as const;

describe('pickLocale', () => {
	it('answers the first wanted locale that is supported', () => {
		expect(pickLocale(['de', 'fr', 'en'], supported, 'en')).toBe('fr');
		expect(pickLocale('fr', supported, 'en')).toBe('fr');
	});

	it('matches on the language when the region is not supported', () => {
		expect(pickLocale('fr-CA', supported, 'en')).toBe('fr');
		expect(pickLocale('fr_CA', supported, 'en')).toBe('fr');
	});

	it('matches a region it supports when only the language is wanted', () => {
		expect(pickLocale('pt', ['en', 'pt-BR'], 'en')).toBe('pt-BR');
	});

	it('prefers an exact match to a language match, and keeps the order of wanted', () => {
		expect(pickLocale('fr-CA', ['fr', 'fr-CA'], 'fr')).toBe('fr-CA');
		expect(pickLocale('fr-BE', ['fr-CA', 'fr'], 'fr-CA')).toBe('fr');
		// The first wanted locale wins, even when a later one is an exact match.
		expect(pickLocale(['fr-CH', 'en'], supported, 'en')).toBe('fr');
	});

	it('ignores case, and answers the supported spelling', () => {
		expect(pickLocale('PT-br', ['en', 'pt-BR'], 'en')).toBe('pt-BR');
	});

	it('answers the fallback when nothing is wanted or nothing matches', () => {
		expect(pickLocale(null, supported, 'en')).toBe('en');
		expect(pickLocale(undefined, supported, 'fr')).toBe('fr');
		expect(pickLocale([], supported, 'en')).toBe('en');
		expect(pickLocale(['', null, 'de'], supported, 'en')).toBe('en');
	});

	it('refuses a wiring mistake with a TypeError', () => {
		expect(() => pickLocale('fr', [], 'en' as never)).toThrow(
			new TypeError('pickLocale: supported must hold at least one locale'),
		);
		expect(() => pickLocale('fr', supported, 'de' as never)).toThrow(
			new TypeError('pickLocale: fallback must be one of supported'),
		);
	});
});

describe('parseAcceptLanguage', () => {
	it('orders by weight, ties keeping the header order', () => {
		expect(parseAcceptLanguage('fr-CA,fr;q=0.9,en;q=0.8')).toEqual([
			'fr-CA',
			'fr',
			'en',
		]);
		expect(parseAcceptLanguage('en;q=0.5, de, fr;q=0.5')).toEqual([
			'de',
			'en',
			'fr',
		]);
	});

	it('drops q=0, the wildcard and empty entries', () => {
		expect(parseAcceptLanguage('fr;q=0, *, , en')).toEqual(['en']);
	});

	it('answers [] for a missing header', () => {
		expect(parseAcceptLanguage(null)).toEqual([]);
		expect(parseAcceptLanguage(undefined)).toEqual([]);
		expect(parseAcceptLanguage('')).toEqual([]);
	});

	it('feeds pickLocale', () => {
		expect(
			pickLocale(
				['de', ...parseAcceptLanguage('fr-CA,en;q=0.5')],
				supported,
				'en',
			),
		).toBe('fr');
	});
});
