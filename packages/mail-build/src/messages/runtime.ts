/**
 * The helpers an emitted module calls, as source text: `Intl`, and nothing
 * else. Only the helpers a module uses are emitted, so a consumer compiling
 * it with `noUnusedLocals` sees no unused function.
 *
 * Written for the strictest consumer: no unused parameter, bracket access on
 * index signatures (`noPropertyAccessFromIndexSignature`), and nothing newer
 * than ES2020 (`Object.hasOwn` is ES2022).
 */

export type Helper = 'formatNumber' | 'formatDate' | 'plural' | 'select';

const SOURCES: Readonly<Record<Helper, string>> = {
	formatNumber: `const numberFormats = new Map<string, Intl.NumberFormat>();

function formatNumber(locale: string, value: number, options: Intl.NumberFormatOptions): string {
	const id = locale + JSON.stringify(options);
	let format = numberFormats.get(id);
	if (format === undefined) {
		format = new Intl.NumberFormat(locale, options);
		numberFormats.set(id, format);
	}
	return format.format(value);
}`,
	formatDate: `const dateFormats = new Map<string, Intl.DateTimeFormat>();

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
}`,
	plural: `const pluralRules = new Map<string, Intl.PluralRules>();

function plural(
	locale: string,
	value: number,
	offset: number,
	type: Intl.PluralRuleType,
	options: { readonly [branch: string]: () => string },
): string {
	const exact = options[\`=\${value}\`];
	if (exact !== undefined) return exact();
	const id = locale + type;
	let rules = pluralRules.get(id);
	if (rules === undefined) {
		rules = new Intl.PluralRules(locale, { type });
		pluralRules.set(id, rules);
	}
	const chosen = options[rules.select(value - offset)] ?? options['other'];
	return chosen === undefined ? '' : chosen();
}`,
	select: `function select(value: string, options: { readonly [branch: string]: () => string }): string {
	const chosen = Object.prototype.hasOwnProperty.call(options, value)
		? options[value]
		: options['other'];
	return chosen === undefined ? '' : chosen();
}`,
};

const ORDER: readonly Helper[] = [
	'formatNumber',
	'formatDate',
	'plural',
	'select',
];

/** The source of the helpers in `used`, in a stable order. */
export function runtimeSource(used: ReadonlySet<Helper>): string {
	return ORDER.filter((helper) => used.has(helper))
		.map((helper) => SOURCES[helper])
		.join('\n\n');
}
