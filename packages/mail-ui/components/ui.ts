/**
 * What the components share. Shipped as source: Maizzle compiles it with the
 * components that import it.
 */
import { Fragment, inject, isVNode, type VNode } from 'vue';

/** material-vue's colours; `default` is the foreground. */
export type Color =
	| 'primary'
	| 'secondary'
	| 'info'
	| 'success'
	| 'warning'
	| 'error'
	| 'default';

/** material-vue's tones for a status: its colours but `default`. */
export type Tone = 'info' | 'success' | 'warning' | 'error';

export interface Brand {
	readonly name: string;
	readonly url?: string;
	readonly logo?: {
		readonly src: string;
		readonly width?: number;
		readonly alt?: string;
		/** Shown instead of `src` under `prefers-color-scheme: dark` and for
		 * Outlook.com/Outlook's own dark mode. */
		readonly darkSrc?: string;
	};
}

export interface UiContext {
	readonly brand: Brand;
	readonly css: string;
}

/** Which part of an `NxTable` a cell is in, as its `NxTableHeader`/`Body`/`Footer` says. */
export const TABLE_PART = 'nxgt:mail-ui:table-part';
export type TablePart = 'header' | 'body' | 'footer';

export type TimelineTone =
	| 'default'
	| 'primary'
	| 'success'
	| 'info'
	| 'warning'
	| 'error';

/** An event of `NxTimeline`: material-vue's, with a written time only. */
export interface TimelineItem {
	readonly id: string;
	readonly title: string;
	readonly description?: string;
	/** The time, as written: a placeholder, or a date you format. */
	readonly timestampLabel?: string;
	readonly tone?: TimelineTone;
}

/** The pixel size of the `NxAvatar`s inside, as `NxAvatar` or `NxAvatarGroup` says. */
export const AVATAR_SIZE = 'nxgt:mail-ui:avatar-size';

/** The brand and theme `ui()` provides. A component used without it **throws**. */
export function useUi(component: string): UiContext {
	const context = inject<UiContext | undefined>('nxgt:mail-ui', undefined);
	if (context === undefined) {
		throw new Error(
			`${component}: ui() is not in the plugins of defineMailConfig`,
		);
	}
	return context;
}

/** material-vue's Button variants, which its Chip takes too. */
export type ColourVariant = 'filled' | 'tonal' | 'outlined' | 'ghost' | 'link';

/** The token of a colour: `default` is the foreground. */
const token = (color: Color) => (color === 'default' ? 'foreground' : color);

/**
 * The classes of a `variant` in a `color`, as material-vue's Button colours
 * them: `NxButton`'s and `NxChip`'s, which each add their own. `primary` is
 * the one colour with an optional dark value (`color-primary-dark`,
 * `color-primary-foreground-dark`; see theme.css and
 * docs/guide/dark-mode.md), so it is the one that carries a `nx-dark-*`
 * twin alongside its light class.
 */
export function colourVariant(variant: ColourVariant, color: Color): string {
	switch (variant) {
		case 'filled':
			if (color === 'default') return 'bg-foreground text-background';
			return color === 'primary'
				? 'bg-primary nx-dark-bg-primary text-primary-foreground nx-dark-text-primary-foreground'
				: `bg-${color} text-${color}-foreground`;
		case 'tonal':
			return color === 'primary'
				? 'bg-primary-15 nx-dark-bg-primary-15 text-primary nx-dark-text-primary'
				: `bg-${token(color)}-15 text-${token(color)}`;
		case 'outlined':
			return color === 'primary'
				? 'border border-solid border-primary-50 nx-dark-border-primary-50 text-primary nx-dark-text-primary'
				: `border border-solid border-${token(color)}-50 text-${token(color)}`;
		case 'ghost':
			return 'text-foreground';
		case 'link':
			return color === 'primary'
				? 'text-primary nx-dark-text-primary'
				: `text-${token(color)}`;
	}
}

/**
 * The components a slot holds, out of any `v-for` fragment, without its text
 * or comments: what `NxAvatarGroup` and `NxSteps` lay out one by one.
 */
export function slotComponents(nodes: readonly unknown[] | undefined): VNode[] {
	return (nodes ?? []).flatMap((node) => {
		if (!isVNode(node)) return [];
		if (node.type === Fragment) {
			return slotComponents(Array.isArray(node.children) ? node.children : []);
		}
		return typeof node.type === 'symbol' ? [] : [node];
	});
}

/**
 * `t(key, args)` when `@nxgt/mail-i18n` is listed, else `fallback`: a shared
 * message a component writes, in English without the i18n plugin.
 */
export function sharedMessage(
	globals: Record<string, unknown>,
	key: string,
	fallback: string,
	args?: Record<string, unknown>,
): string {
	return typeof globals.t === 'function'
		? (globals.t(key, args) as string)
		: fallback;
}

/** Which way a figure moved, as material-vue's StatCard tones its delta. */
export type DeltaTone = 'up' | 'down' | 'neutral';

/** A tone's arrow and colour. */
const DELTA_LOOK: Record<DeltaTone, { glyph: string; colour: string }> = {
	up: { glyph: '\u25B2', colour: 'text-success' },
	down: { glyph: '\u25BC', colour: 'text-error' },
	neutral: { glyph: '\u2013', colour: 'text-muted-foreground' },
};

/**
 * A delta as material-vue's `formatStatDelta` writes it — `+12`, `-3`, `0` —
 * with its tone, a glyph for its arrow (an e-mail has no icon font), and its
 * colour. A string is written as given, `neutral` unless `tone` says.
 */
export function deltaOf(
	delta: number | string,
	tone?: DeltaTone,
): { label: string; tone: DeltaTone; glyph: string; colour: string } {
	const resolved: { label: string; tone: DeltaTone } =
		typeof delta === 'string'
			? { label: delta, tone: tone ?? 'neutral' }
			: delta > 0
				? { label: `+${delta}`, tone: tone ?? 'up' }
				: delta < 0
					? { label: `${delta}`, tone: tone ?? 'down' }
					: { label: '0', tone: tone ?? 'neutral' };
	return { ...resolved, ...DELTA_LOOK[resolved.tone] };
}

/** material-vue's small uppercase label over a figure or a list. */
export const EYEBROW =
	'm-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground';

/** A link of `NxSeeAlso`, as material-vue's. */
export interface SeeAlsoItem {
	readonly id?: string;
	readonly title: string;
	readonly href: string;
}

/** Whether a component is inside an `NxButtonGroup`, which restyles its buttons. */
export const BUTTON_GROUP = 'nxgt:mail-ui:button-group';

/**
 * A `{{ name }}` placeholder of `@nxgt/mail-i18n`, as the renderer finds one:
 * copied from packages/mail/src/renderer.ts (PLACEHOLDER), change them together.
 */
const PLACEHOLDER = /\{\{\s*[a-z][a-zA-Z0-9]*\s*\}\}/;

/** Whether `value` holds a placeholder, filled only when the e-mail is sent. */
export const hasPlaceholder = (value: string): boolean =>
	PLACEHOLDER.test(value);

/** A part of a text, and whether it matches the query: what `NxHighlightText` marks. */
export interface MatchPart {
	readonly text: string;
	readonly match: boolean;
}

/**
 * material-vue's `splitMatch`: `text` cut around each case-insensitive match of
 * `query`. A placeholder in `text` is never cut: it is written whole, unmarked,
 * so the renderer still finds it.
 */
export function splitMatch(text: string, query: string): MatchPart[] {
	const needle = query.trim();
	if (!needle) return [{ text, match: false }];
	const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const parts: MatchPart[] = [];
	const push = (part: MatchPart) => {
		if (part.text === '') return;
		const last = parts.at(-1);
		if (last !== undefined && !last.match && !part.match) {
			parts[parts.length - 1] = { text: last.text + part.text, match: false };
		} else parts.push(part);
	};
	for (const segment of text.split(
		new RegExp(`(${PLACEHOLDER.source})`, 'g'),
	)) {
		if (PLACEHOLDER.test(segment)) {
			push({ text: segment, match: false });
			continue;
		}
		let last = 0;
		for (const hit of segment.matchAll(new RegExp(escaped, 'ig'))) {
			const index = hit.index ?? 0;
			push({ text: segment.slice(last, index), match: false });
			push({ text: hit[0], match: true });
			last = index + hit[0].length;
		}
		push({ text: segment.slice(last), match: false });
	}
	return parts.length > 0 ? parts : [{ text, match: false }];
}

/** material-vue's `formatCount`: a count, rounded, never under 0, and `99+` past `max`. */
export function formatCount(count: number, max = 99): string {
	const safe = Math.max(0, Math.round(count));
	return safe > max ? `${max}+` : String(safe);
}

/** The locale the template is built in, from `@nxgt/mail-i18n`, else `en`. */
export function localeOf(globals: Record<string, unknown>): string {
	return typeof globals.locale === 'string' ? globals.locale : 'en';
}

/**
 * The base language subtag of every locale `@nxgt/mail-i18n`'s own fallback
 * list (`packages/mail-i18n/src/direction.ts`) reads right to left — kept
 * here too, since mail-ui takes no dependency on mail-i18n and a project may
 * use `NxLayout` and the other components without it. A last resort, tried
 * only once `Intl.Locale` itself cannot answer — see {@link dirOf}.
 */
const RTL_LANGUAGES = new Set([
	'ar',
	'arc',
	'dv',
	'fa',
	'ha',
	'he',
	'khw',
	'ks',
	'ku',
	'ps',
	'sd',
	'syr',
	'ug',
	'ur',
	'yi',
]);

interface TextInfoLocale {
	/** Bun 1.4: a method. */
	getTextInfo?(): { direction: string };
	/** Node 22: a getter. */
	textInfo?: { direction: string };
}

/**
 * The direction the template is built in: `globals.dir` from
 * `@nxgt/mail-i18n`'s `i18n()` plugin when it is listed, else derived from
 * `localeOf(globals)` the same way `@nxgt/mail-i18n`'s own
 * `localeDirection` does (`packages/mail-i18n/src/direction.ts`) — asking
 * the runtime's `Intl.Locale` first (Bun's `getTextInfo()`, Node's
 * `textInfo`), and only falling back to {@link RTL_LANGUAGES} when neither
 * answers, so a runtime with accurate data always wins here too. `NxLayout`
 * writes it on `<html>` and its wrapper table; `NxAlert`, `NxCompareCard`,
 * `NxStatCard`, `NxTimeline`, `NxSeeAlso` and the other components with a
 * one-sided padding, border or alignment read it to mirror their physical
 * CSS — email clients read `padding-left`/`padding-right`/`border-left`/
 * `border-right`, never the logical `padding-inline-start` and the like.
 */
export function dirOf(globals: Record<string, unknown>): 'ltr' | 'rtl' {
	if (globals.dir === 'ltr' || globals.dir === 'rtl') return globals.dir;
	const locale = localeOf(globals);
	try {
		const info = new Intl.Locale(locale) as Intl.Locale & TextInfoLocale;
		const direction =
			info.getTextInfo?.().direction ?? info.textInfo?.direction;
		if (direction === 'rtl' || direction === 'ltr') return direction;
	} catch {
		// Not a locale `Intl` parses: fall through to the fallback list below.
	}
	const base = locale.split('-')[0]?.toLowerCase() ?? '';
	return RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr';
}

/** material-vue's `AttributeType`: what kind of value an attribute holds. */
export type AttributeType =
	| 'STRING'
	| 'TEXT'
	| 'COLOR'
	| 'NUMBER'
	| 'DATE'
	| 'DATETIME'
	| 'TIME'
	| 'SELECT'
	| 'MULTI_SELECT'
	| 'RICH_TEXT';

/** A value `NxAttributes` writes: a list is joined with commas. */
export type AttributeValue =
	| string
	| number
	| readonly (string | number)[]
	| null
	| undefined;

/**
 * material-vue's `Attribute`. `NxAttributes` reads its `name`, `label`,
 * `unit` and `defaultValue`; the other fields are accepted, so the same
 * data can be passed, and not read.
 */
export interface Attribute {
	readonly name: string;
	readonly label: string;
	readonly description?: string | null;
	readonly type?: AttributeType;
	readonly unit?: string | null;
	readonly options?: readonly string[] | null;
	readonly defaultValue?: AttributeValue;
	readonly priority?: number | null;
}

/** A file of `NxFileList`, as material-vue's `FileListItem`. */
export interface FileListItem {
	readonly id: string;
	readonly name: string;
	/** In bytes, written by locale; a string (a placeholder) is written as given. */
	readonly size?: number | string;
	readonly href?: string;
	/** The MIME type, as `application/pdf`. */
	readonly type?: string;
	readonly disabled?: boolean;
}

/** material-vue's `PostalAddressFieldValue`. */
export interface PostalAddress {
	readonly street?: string | null;
	readonly locality?: string | null;
	readonly region?: string | null;
	readonly postalCode?: string | null;
	/** An ISO 3166-1 alpha-2 code, as `FR`, named in the template's locale; anything else is written as given. */
	readonly country?: string | null;
}

/** A day of `NxOpeningHours`, as material-vue's `OpeningHour`. */
export interface OpeningHour {
	/** `0` for Sunday to `6` for Saturday. */
	readonly dayOfWeek: number;
	/** As written, as `09:00`. */
	readonly openTime?: string;
	readonly closeTime?: string;
	readonly isClosed?: boolean;
}

/** material-vue's `ContactType`, as its values. */
export type ContactType = 'EMAIL' | 'FAX' | 'MOBILE' | 'PHONE' | 'WEBSITE';

/** A contact of `NxContacts`, as material-vue's `Contact`. */
export interface Contact {
	readonly type: ContactType;
	/** The address, number or URL, as written. */
	readonly value: string;
	readonly label?: string | null;
}
