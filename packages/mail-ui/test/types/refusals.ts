/**
 * What `@nxgt/mail-ui` refuses at COMPILE time.
 *
 * Checked by `tsc --noEmit`, never run. Every `@ts-expect-error` here is a
 * refusal that stops holding the moment the directive goes unused. The
 * calls that **must keep compiling** are here too, unmarked.
 *
 * A theme token is a `string`: whether `theme.css` declares it is checked
 * when `ui()` is called, not by the compiler.
 *
 * **Eight plausible mistakes, eight refused.**
 */

import type { MailPlugin } from '@nxgt/mail-config';
import type { Catalogues } from '@nxgt/mail-i18n';
import type { ComponentCustomProperties } from 'vue';
import type {
	Brand as ComponentsBrand,
	UiContext as ComponentsContext,
} from '../../components/ui';
import { type Brand, type UiContext, ui, uiCatalogues } from '../../src/index';

// Must keep compiling.
const plugin: MailPlugin = ui({
	brand: {
		name: 'Acme',
		url: 'https://acme.example',
		logo: { src: 'https://acme.example/logo.png', width: 96, alt: 'Acme' },
	},
	theme: { 'color-primary': '#0f766e' },
});
const catalogues: Catalogues = uiCatalogues;
declare const template: ComponentCustomProperties;
const name: string = template.brand.name;
// The components keep their own copy of Brand and UiContext (they ship as
// source): each must stay exactly the plugin's, optional keys and readonly
// included.
type Equal<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
		? true
		: false;
const sameBrand: Equal<Brand, ComponentsBrand> = true;
const sameContext: Equal<UiContext, ComponentsContext> = true;

// @ts-expect-error — a brand is required: the layout shows it.
ui({});

// @ts-expect-error — a brand is an object with a name, not the name alone.
ui({ brand: 'Acme' });

// @ts-expect-error — a logo is { src }, not the URL alone.
ui({ brand: { name: 'Acme', logo: 'https://acme.example/logo.png' } });

const src = 'https://acme.example/logo.png';
// @ts-expect-error — a logo's width is a number of pixels.
ui({ brand: { name: 'Acme', logo: { src, width: '96px' } } });

// @ts-expect-error — a theme value is a CSS string.
ui({ brand: { name: 'Acme' }, theme: { 'radius-lg': 4 } });

// @ts-expect-error — the brand a template reads is read-only.
template.brand = { name: 'Other' } satisfies Brand;

// @ts-expect-error — a logo needs its src.
ui({ brand: { name: 'Acme', logo: { width: 96 } } });

// @ts-expect-error — a URL is a string.
ui({ brand: { name: 'Acme', url: 1 } });

export { catalogues, name, plugin, sameBrand, sameContext };
