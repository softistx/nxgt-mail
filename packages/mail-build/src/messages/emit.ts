import {
	type DateElement,
	type MessageFormatElement,
	type NumberElement,
	type TimeElement,
	TYPE,
} from '@formatjs/icu-messageformat-parser';
import { MailBuildError } from '../errors';
import type { ArgumentKind } from './analyse';

/** One message of one locale, ready to emit. */
export interface EmittableMessage {
	readonly key: string;
	readonly ast: readonly MessageFormatElement[];
}

const DATE_STYLES: Readonly<Record<string, Intl.DateTimeFormatOptions>> = {
	short: { month: 'numeric', day: 'numeric', year: '2-digit' },
	medium: { month: 'short', day: 'numeric', year: 'numeric' },
	long: { month: 'long', day: 'numeric', year: 'numeric' },
	full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
};

const TIME_STYLES: Readonly<Record<string, Intl.DateTimeFormatOptions>> = {
	short: { hour: 'numeric', minute: 'numeric' },
	medium: { hour: 'numeric', minute: 'numeric', second: 'numeric' },
	long: {
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		timeZoneName: 'short',
	},
	full: {
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		timeZoneName: 'short',
	},
};

const NUMBER_STYLES: Readonly<Record<string, Intl.NumberFormatOptions>> = {
	integer: { maximumFractionDigits: 0 },
	percent: { style: 'percent' },
};

const literal = (value: unknown) => JSON.stringify(value);

function numberOptions(
	element: NumberElement,
	where: Where,
): Intl.NumberFormatOptions {
	const style = element.style;
	if (style === null || style === undefined) return {};
	if (typeof style === 'string') {
		const options = NUMBER_STYLES[style];
		if (options === undefined)
			throw unsupported(where, `number style ${style}`);
		return options;
	}
	return style.parsedOptions;
}

function dateOptions(
	element: DateElement | TimeElement,
	where: Where,
): Intl.DateTimeFormatOptions {
	const styles = element.type === TYPE.date ? DATE_STYLES : TIME_STYLES;
	const style = element.style;
	if (style === null || style === undefined) return styles.medium ?? {};
	if (typeof style === 'string') {
		const options = styles[style];
		if (options === undefined) {
			throw unsupported(
				where,
				`${element.type === TYPE.date ? 'date' : 'time'} style ${style}`,
			);
		}
		return options;
	}
	return style.parsedOptions;
}

interface Where {
	readonly locale: string;
	readonly key: string;
}

function unsupported(where: Where, what: string): MailBuildError {
	return new MailBuildError(
		'MESSAGE_UNPARSABLE',
		`messages: ${where.locale}: ${where.key} uses a ${what}, which is not supported`,
		{ locale: where.locale, key: where.key },
	);
}

/** The JavaScript expression of a message: a concatenation of strings. */
function expression(
	elements: readonly MessageFormatElement[],
	where: Where,
	pound: string | null,
): string {
	const locale = literal(where.locale);
	const parts: string[] = [];
	for (const element of elements) {
		switch (element.type) {
			case TYPE.literal:
				parts.push(literal(element.value));
				break;
			case TYPE.argument:
				parts.push(`String(a.${element.value})`);
				break;
			case TYPE.number:
				parts.push(
					`formatNumber(${locale}, a.${element.value}, ${literal(numberOptions(element, where))})`,
				);
				break;
			case TYPE.date:
			case TYPE.time:
				parts.push(
					`formatDate(${locale}, a.${element.value}, ${literal(dateOptions(element, where))}, o)`,
				);
				break;
			case TYPE.pound:
				if (pound === null) throw unsupported(where, '# outside a plural');
				parts.push(`formatNumber(${locale}, ${pound}, {})`);
				break;
			case TYPE.select: {
				const options = Object.entries(element.options).map(
					([name, option]) =>
						`${literal(name)}: () => ${expression(option.value, where, pound)}`,
				);
				parts.push(`select(a.${element.value}, { ${options.join(', ')} })`);
				break;
			}
			case TYPE.plural: {
				const value =
					element.offset === 0
						? `a.${element.value}`
						: `(a.${element.value} - ${element.offset})`;
				const options = Object.entries(element.options).map(
					([name, option]) =>
						`${literal(name)}: () => ${expression(option.value, where, value)}`,
				);
				parts.push(
					`plural(${locale}, a.${element.value}, ${element.offset}, ${literal(element.pluralType)}, { ${options.join(', ')} })`,
				);
				break;
			}
			case TYPE.tag:
				// Parsed with ignoreTag, so a tag is text and never reaches here.
				throw unsupported(where, 'tag');
		}
	}
	return parts.length === 0 ? '""' : parts.join(' + ');
}

const TS_TYPE: Readonly<Record<ArgumentKind, string>> = {
	string: 'string',
	number: 'number',
	date: 'Date',
};

/** The helpers the emitted functions call: `Intl`, and nothing else. */
const RUNTIME = `const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();
const pluralRules = new Map<string, Intl.PluralRules>();

function formatNumber(locale: string, value: number, options: Intl.NumberFormatOptions): string {
	const id = locale + JSON.stringify(options);
	let format = numberFormats.get(id);
	if (format === undefined) {
		format = new Intl.NumberFormat(locale, options);
		numberFormats.set(id, format);
	}
	return format.format(value);
}

function formatDate(
	locale: string,
	value: Date,
	options: Intl.DateTimeFormatOptions,
	o: FormatOptions,
): string {
	const all = { ...options, timeZone: o.timeZone ?? 'UTC' };
	const id = locale + JSON.stringify(all);
	let format = dateFormats.get(id);
	if (format === undefined) {
		format = new Intl.DateTimeFormat(locale, all);
		dateFormats.set(id, format);
	}
	return format.format(value);
}

function plural(
	locale: string,
	value: number,
	offset: number,
	type: Intl.PluralRuleType,
	options: Readonly<Record<string, () => string>>,
): string {
	const exact = options[\`=\${value}\`];
	if (exact !== undefined) return exact();
	const id = locale + type;
	let rules = pluralRules.get(id);
	if (rules === undefined) {
		rules = new Intl.PluralRules(locale, { type });
		pluralRules.set(id, rules);
	}
	return (options[rules.select(value - offset)] ?? options.other ?? (() => ''))();
}

function select(value: string, options: Readonly<Record<string, () => string>>): string {
	const chosen = Object.hasOwn(options, value) ? options[value] : options.other;
	return (chosen ?? (() => ''))();
}`;

/**
 * Emits the TypeScript module of a set of catalogues: the locales, one typed
 * function per message and locale, and `t(locale, key, args)`.
 *
 * `args` holds the arguments of each key, typed from the fallback locale;
 * `messages` holds, per locale, every key in `args`.
 */
export function emitMessagesModule(options: {
	readonly locales: readonly string[];
	readonly fallbackLocale: string;
	readonly args: ReadonlyMap<string, ReadonlyMap<string, ArgumentKind>>;
	readonly messages: ReadonlyMap<string, readonly EmittableMessage[]>;
}): string {
	const keys = [...options.args.keys()].sort();
	const lines: string[] = [];
	lines.push(
		'// Generated by @nxgt/mail-build. Do not edit: change the catalogues and build again.',
		'',
		`export const locales = ${literal(options.locales)} as const;`,
		'export type Locale = (typeof locales)[number];',
		`export const fallbackLocale: Locale = ${literal(options.fallbackLocale)};`,
		'',
		'/** Options every message accepts. */',
		'export interface FormatOptions {',
		"\t/** The time zone dates are written in, usually the recipient's. Defaults to UTC. */",
		'\treadonly timeZone?: string;',
		'}',
		'',
		'/** The arguments of each message, typed from its ICU. */',
		'export interface MessageArgs {',
	);
	for (const key of keys) {
		const args = [
			...(options.args.get(key) ?? new Map<string, ArgumentKind>()),
		].sort(([a], [b]) => a.localeCompare(b));
		const shape =
			args.length === 0
				? 'Record<never, never>'
				: `{ ${args.map(([name, kind]) => `readonly ${name}: ${TS_TYPE[kind]};`).join(' ')} }`;
		lines.push(`\t${literal(key)}: ${shape};`);
	}
	lines.push(
		'}',
		'',
		'export type MessageKey = keyof MessageArgs;',
		'',
		'type Format<K extends MessageKey> = (a: MessageArgs[K], o: FormatOptions) => string;',
		'',
		'const catalogues: { readonly [L in Locale]: { readonly [K in MessageKey]: Format<K> } } = {',
	);
	for (const locale of options.locales) {
		lines.push(`\t${literal(locale)}: {`);
		const byKey = new Map(
			(options.messages.get(locale) ?? []).map((m) => [m.key, m]),
		);
		for (const key of keys) {
			const message = byKey.get(key);
			if (message === undefined) continue;
			lines.push(
				`\t\t${literal(key)}: (a, o) => ${expression(message.ast, { locale, key }, null)},`,
			);
		}
		lines.push('\t},');
	}
	lines.push(
		'};',
		'',
		'type Rest<K extends MessageKey> = keyof MessageArgs[K] extends never',
		'\t? [args?: MessageArgs[K], options?: FormatOptions]',
		'\t: [args: MessageArgs[K], options?: FormatOptions];',
		'',
		'/** The message `key` in `locale`, with its arguments. */',
		'export function t<K extends MessageKey>(locale: Locale, key: K, ...rest: Rest<K>): string {',
		'\tconst [args, options] = rest;',
		'\treturn catalogues[locale][key]((args ?? {}) as MessageArgs[K], options ?? {});',
		'}',
		'',
		RUNTIME,
		'',
	);
	return lines.join('\n');
}
