/**
 * What a config refuses of a preset at COMPILE time.
 *
 * Checked by `tsc --noEmit`, never run. The calls that **must keep
 * compiling** are here too, unmarked.
 *
 * **Three plausible mistakes, three refused.**
 */

import { defineMailConfig, definePreset } from '../../src/index';

const acme = definePreset({
	name: 'acme',
	theme: { color: { primary: '#e11d48' } },
	components: { 'Brand.vue': '<template><p>Acme</p></template>' },
	messages: { en: { common: { hello: 'Hello' } } },
});
const acmePreset = () => acme;

// ── Must compile ─────────────────────────────────────────────────────────────

defineMailConfig({
	locales: ['en'],
	fallbackLocale: 'en',
	presets: [acme, acmePreset()],
	components: 'parts',
});

// ── Refused ──────────────────────────────────────────────────────────────────

// 1. A preset function passed uncalled: a function has a `name` too.
defineMailConfig({
	locales: ['en'],
	fallbackLocale: 'en',
	// @ts-expect-error — `acmePreset` is the function; the preset is `acmePreset()`
	presets: [acmePreset],
});

// 2. A preset without a name.
// @ts-expect-error — a preset is named, for the errors
definePreset({ theme: { color: { primary: '#e11d48' } } });

// 3. A token that is not a string.
// @ts-expect-error — a token is a CSS value, written as a string
definePreset({ name: 'acme', theme: { radius: { card: 8 } } });
