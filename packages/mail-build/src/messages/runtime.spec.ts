import { describe, expect, it } from 'bun:test';
import { t } from '../../test/types/generated/messages';

// The module the compiler emitted for test/fixtures/basic, run. The golden
// test in compile.spec.ts keeps it equal to what the compiler emits today.

describe('the emitted module', () => {
	it('substitutes a string argument', () => {
		expect(t('en', 'verifyEmail.body', { name: 'Ada' })).toBe(
			'Hello Ada, confirm this address to finish signing up.',
		);
	});

	it('writes 0 as singular in French and as plural in English', () => {
		// The plural rule of fr puts 0 in "one"; en puts it in "other".
		expect(t('fr', 'verifyEmail.expires', { hours: 0 })).toBe(
			'Ce lien expire dans 0 heure.',
		);
		expect(t('en', 'verifyEmail.expires', { hours: 0 })).toBe(
			'This link expires in 0 hours.',
		);
		expect(t('fr', 'verifyEmail.expires', { hours: 2 })).toBe(
			'Ce lien expire dans 2 heures.',
		);
		expect(t('en', 'verifyEmail.expires', { hours: 1 })).toBe(
			'This link expires in 1 hour.',
		);
	});

	it('prefers an exact =N branch, and formats # and numbers in the locale', () => {
		expect(t('en', 'order.summary', { count: 0, total: 1 })).toBe(
			'No items, €1.00.',
		);
		expect(t('fr', 'order.summary', { count: 1200, total: 1234.5 })).toBe(
			'1 200 articles, 1 234,50 €.',
		);
	});

	it('writes dates in UTC unless given the time zone', () => {
		const at = new Date('2026-09-25T21:30:00Z');
		expect(t('fr', 'order.placedAt', { at })).toBe(
			'Passée le 25 septembre 2026 à 21:30.',
		);
		// The space before PM is a regular or a narrow no-break space depending
		// on the ICU data of the runtime, so it is matched as whitespace.
		expect(
			t('en', 'order.placedAt', { at }, { timeZone: 'America/New_York' }),
		).toMatch(/^Placed on September 25, 2026 at 5:30\sPM\.$/);
	});

	it('picks an ordinal, and a select branch — other for an unknown or inherited value', () => {
		expect(t('en', 'order.rank', { position: 2 })).toBe('Your 2nd order.');
		expect(t('fr', 'order.rank', { position: 1 })).toBe('Votre 1re commande.');
		expect(t('en', 'order.shipping', { method: 'express' })).toBe(
			'Express delivery',
		);
		expect(t('en', 'order.shipping', { method: 'toString' })).toBe(
			'Standard delivery',
		);
	});

	it('subtracts the offset for the rules and #, and matches =N on the raw value', () => {
		expect(t('en', 'order.guests', { count: 0, host: 'Ada' })).toBe(
			'Nobody came',
		);
		expect(t('en', 'order.guests', { count: 1, host: 'Ada' })).toBe('Ada came');
		expect(t('en', 'order.guests', { count: 2, host: 'Ada' })).toBe(
			'Ada and 1 other came',
		);
		expect(t('en', 'order.guests', { count: 3, host: 'Ada' })).toBe(
			'Ada and 2 others came',
		);
		expect(t('fr', 'order.guests', { count: 2, host: 'Ada' })).toBe(
			'Ada et 1 autre personne sont venus',
		);
	});

	it('keeps a tag as text, and a message without arguments needs none', () => {
		expect(t('en', 'order.markup')).toBe('Keep <b>this</b> & that as text.');
		expect(t('fr', 'verifyEmail.title')).toBe("Plus qu'une étape");
	});
});
