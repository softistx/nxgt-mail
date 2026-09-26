/**
 * What `@nxgt/mail-preset` refuses at COMPILE time.
 *
 * Checked by `tsc --noEmit`, never run. Every `@ts-expect-error` here is a
 * refusal that stops holding the moment the directive goes unused — so a
 * refusal that quietly weakens fails the typecheck instead of passing
 * unnoticed. The count is in the README; a count that goes down is a
 * regression.
 *
 * The calls that **must keep compiling** are here too, unmarked: a refusal
 * that refuses the correct call is a bug.
 *
 * **Four plausible mistakes, four refused.**
 */

import { defineMailConfig } from '@nxgt/mail-build';
import { nxgtPreset } from '../../src/index';

// Must compile: no option, the brand, any token, and the preset in a config.
nxgtPreset();
nxgtPreset({ brand: { primary: '#4f46e5', logo: 'https://x.test/logo.png' } });
nxgtPreset({
	theme: { color: { canvas: '#ffffff' }, radius: { button: '0' } },
});
defineMailConfig({
	locales: ['en'],
	fallbackLocale: 'en',
	presets: [nxgtPreset()],
});

// 1. A brand option misspelled.
// @ts-expect-error — `primry` is not a brand option
nxgtPreset({ brand: { primry: '#4f46e5' } });

// 2. A token the preset does not have.
// @ts-expect-error — `brand` is not a colour token of the preset
nxgtPreset({ theme: { color: { brand: '#4f46e5' } } });

// 3. A namespace the preset does not have.
// @ts-expect-error — `colour` is not a namespace of the preset
nxgtPreset({ theme: { colour: { primary: '#4f46e5' } } });

// 4. A token that is not a string.
// @ts-expect-error — a token is a CSS value, written as a string
nxgtPreset({ theme: { radius: { card: 8 } } });
