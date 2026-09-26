import {
	type MessageFormatElement,
	TYPE,
} from '@formatjs/icu-messageformat-parser';
import type { ArgumentKind } from './analyse';
import { type Helper, runtimeSource } from './runtime';
import { dateOptions, numberOptions, unsupported, type Where } from './styles';

/** One message of one locale, ready to emit. */
export interface EmittableMessage {
	readonly key: string;
	readonly ast: readonly MessageFormatElement[];
}

const literal = (value: unknown) => JSON.stringify(value);

/** What emitting one message needed: helpers, arguments, format options. */
interface Needs {
	readonly helpers: Set<Helper>;
	args: boolean;
	options: boolean;
}

/**
 * The branches of a select or plural as an object literal. The keys are
 * computed — `["__proto__"]` — because a plain `"__proto__":` key sets the
 * prototype instead of adding a branch.
 */
function branches(
	options: Readonly<
		Record<string, { readonly value: readonly MessageFormatElement[] }>
	>,
	where: Where,
	pound: string | null,
	needs: Needs,
): string {
	return Object.entries(options)
		.map(
			([name, option]) =>
				`[${literal(name)}]: () => ${expression(option.value, where, pound, needs)}`,
		)
		.join(', ');
}

/** The JavaScript expression of a message: a concatenation of strings. */
function expression(
	elements: readonly MessageFormatElement[],
	where: Where,
	pound: string | null,
	needs: Needs,
): string {
	const locale = literal(where.locale);
	const parts: string[] = [];
	for (const element of elements) {
		switch (element.type) {
			case TYPE.literal:
				parts.push(literal(element.value));
				break;
			case TYPE.argument:
				needs.args = true;
				parts.push(`String(a.${element.value})`);
				break;
			case TYPE.number:
				needs.args = true;
				needs.helpers.add('formatNumber');
				parts.push(
					`formatNumber(${locale}, a.${element.value}, ${literal(numberOptions(element, where))})`,
				);
				break;
			case TYPE.date:
			case TYPE.time:
				needs.args = true;
				needs.options = true;
				needs.helpers.add('formatDate');
				parts.push(
					`formatDate(${locale}, a.${element.value}, ${literal(dateOptions(element, where))}, o)`,
				);
				break;
			case TYPE.pound:
				if (pound === null) throw unsupported(where, 'a # outside a plural');
				needs.helpers.add('formatNumber');
				parts.push(`formatNumber(${locale}, ${pound}, {})`);
				break;
			case TYPE.select:
				needs.args = true;
				needs.helpers.add('select');
				parts.push(
					`select(a.${element.value}, { ${branches(element.options, where, pound, needs)} })`,
				);
				break;
			case TYPE.plural: {
				needs.args = true;
				needs.helpers.add('plural');
				const value =
					element.offset === 0
						? `a.${element.value}`
						: `(a.${element.value} - ${element.offset})`;
				parts.push(
					`plural(${locale}, a.${element.value}, ${element.offset}, ${literal(element.pluralType)}, { ${branches(element.options, where, value, needs)} })`,
				);
				break;
			}
			case TYPE.tag:
				// Parsed with ignoreTag, so a tag is text and never reaches here.
				throw unsupported(where, 'a tag');
		}
	}
	return parts.length === 0 ? '""' : parts.join(' + ');
}

const TS_TYPE: Readonly<Record<ArgumentKind, string>> = {
	string: 'string',
	number: 'number',
	date: 'Date',
};

// A message with no argument takes an object with no property. `{}` —
// `Record<never, never>` — would accept `{ name: 'x' }` without a word.
const NO_ARGUMENTS = '{ readonly [argument: string]: never }';

function argsShape(args: ReadonlyMap<string, ArgumentKind>): string {
	const entries = [...args].sort(([a], [b]) => a.localeCompare(b));
	if (entries.length === 0) return NO_ARGUMENTS;
	return `{ ${entries.map(([name, kind]) => `readonly ${name}: ${TS_TYPE[kind]};`).join(' ')} }`;
}

/**
 * Emits the TypeScript module of a set of catalogues: the locales, one typed
 * function per message and locale, `t(locale, key, args)`, and the `Intl`
 * helpers those functions call — only those.
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
	const helpers = new Set<Helper>();

	const tables: string[] = [];
	for (const locale of options.locales) {
		tables.push(`\t${literal(locale)}: {`);
		const byKey = new Map(
			(options.messages.get(locale) ?? []).map((m) => [m.key, m]),
		);
		for (const key of keys) {
			const message = byKey.get(key);
			if (message === undefined) continue;
			const needs: Needs = { helpers, args: false, options: false };
			const body = expression(message.ast, { locale, key }, null, needs);
			const params = `${needs.args ? 'a' : '_a'}, ${needs.options ? 'o' : '_o'}`;
			tables.push(`\t\t${literal(key)}: (${params}) => ${body},`);
		}
		tables.push('\t},');
	}

	return [
		'// Generated by @nxgt/mail-build. Do not edit: change the catalogues and build again.',
		'',
		`export const locales = ${literal(options.locales)} as const;`,
		'export type Locale = (typeof locales)[number];',
		`export const fallbackLocale: Locale = ${literal(options.fallbackLocale)};`,
		'',
		'/** Options every message accepts. */',
		'export interface FormatOptions {',
		"\t/** The time zone dates are written in, usually the recipient's. Defaults to UTC; an unknown zone throws a RangeError. */",
		'\treadonly timeZone?: string;',
		'}',
		'',
		'/** The arguments of each message, typed from its ICU. */',
		'export interface MessageArgs {',
		...keys.map(
			(key) =>
				`\t${literal(key)}: ${argsShape(options.args.get(key) ?? new Map<string, ArgumentKind>())};`,
		),
		'}',
		'',
		'export type MessageKey = keyof MessageArgs;',
		'',
		'type Format<K extends MessageKey> = (a: MessageArgs[K], o: FormatOptions) => string;',
		'',
		'const catalogues: { readonly [L in Locale]: { readonly [K in MessageKey]: Format<K> } } = {',
		...tables,
		'};',
		'',
		// Distributive, so an unknown key widens `K` to every key — some taking
		// no argument — and tsc names the key instead of counting arguments.
		'type Rest<K extends MessageKey> = K extends MessageKey',
		`\t? MessageArgs[K] extends ${NO_ARGUMENTS}`,
		'\t\t? [args?: MessageArgs[K], options?: FormatOptions]',
		'\t\t: [args: MessageArgs[K], options?: FormatOptions]',
		'\t: never;',
		'',
		'/** The message `key` in `locale`, with its arguments. */',
		'export function t<K extends MessageKey>(locale: Locale, key: K, ...rest: Rest<K>): string {',
		'\tconst [args, options] = rest;',
		'\treturn catalogues[locale][key]((args ?? {}) as MessageArgs[K], options ?? {});',
		'}',
		...(helpers.size > 0 ? ['', runtimeSource(helpers)] : []),
		'',
	].join('\n');
}
