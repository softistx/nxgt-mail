import type {
	DateElement,
	NumberElement,
	TimeElement,
} from '@formatjs/icu-messageformat-parser';
import { TYPE } from '@formatjs/icu-messageformat-parser';
import { MailBuildError } from '../errors';

/** Where a message is, for the errors. */
export interface Where {
	readonly locale: string;
	readonly key: string;
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

// The options `Intl` reads. A skeleton can produce others — `scale/100`
// gives `scale` — which `Intl` would silently ignore, formatting the wrong
// number; and the emitted `Intl.NumberFormatOptions` literal would not
// typecheck in the consumer's project.
const NUMBER_KEYS = new Set([
	'compactDisplay',
	'currency',
	'currencyDisplay',
	'currencySign',
	'maximumFractionDigits',
	'maximumSignificantDigits',
	'minimumFractionDigits',
	'minimumIntegerDigits',
	'minimumSignificantDigits',
	'notation',
	'numberingSystem',
	'roundingIncrement',
	'roundingMode',
	'roundingPriority',
	'signDisplay',
	'style',
	'trailingZeroDisplay',
	'unit',
	'unitDisplay',
	'useGrouping',
]);

const DATE_KEYS = new Set([
	'calendar',
	'day',
	'dayPeriod',
	'era',
	'fractionalSecondDigits',
	'hour',
	'hour12',
	'hourCycle',
	'minute',
	'month',
	'numberingSystem',
	'second',
	'timeZoneName',
	'weekday',
	'year',
]);

/** A message uses something the build cannot turn into a correct `Intl` call. */
export function unsupported(where: Where, what: string): MailBuildError {
	return new MailBuildError(
		'MESSAGE_UNSUPPORTED',
		`messages: ${where.locale}: ${where.key} uses ${what}, which is not supported`,
		{ locale: where.locale, key: where.key },
	);
}

function checkOptions(
	where: Where,
	what: string,
	options: object,
	keys: ReadonlySet<string>,
	construct: () => unknown,
): void {
	const unknown = Object.keys(options).filter((key) => !keys.has(key));
	if (unknown.length > 0) {
		throw unsupported(
			where,
			`a ${what} option Intl does not read (${unknown.join(', ')})`,
		);
	}
	// Built once here, so an option Intl refuses — a currency style without a
	// currency — fails the build instead of every call.
	try {
		construct();
	} catch {
		throw unsupported(where, `a ${what} Intl refuses in ${where.locale}`);
	}
}

/** The `Intl.NumberFormat` options of `{n, number, …}`, checked. */
export function numberOptions(
	element: NumberElement,
	where: Where,
): Intl.NumberFormatOptions {
	const style = element.style;
	if (style === null || style === undefined) return {};
	if (typeof style === 'string') {
		const options = NUMBER_STYLES[style];
		if (options === undefined)
			throw unsupported(where, `the number style ${style}`);
		return options;
	}
	if (
		style.tokens.length > 0 &&
		Object.keys(style.parsedOptions).length === 0
	) {
		throw unsupported(where, 'a number skeleton that sets no option');
	}
	checkOptions(
		where,
		'number skeleton',
		style.parsedOptions,
		NUMBER_KEYS,
		() => new Intl.NumberFormat(where.locale, style.parsedOptions),
	);
	return style.parsedOptions;
}

/** The `Intl.DateTimeFormat` options of `{at, date, …}` or `{at, time, …}`, checked. */
export function dateOptions(
	element: DateElement | TimeElement,
	where: Where,
): Intl.DateTimeFormatOptions {
	const kind = element.type === TYPE.date ? 'date' : 'time';
	const styles = kind === 'date' ? DATE_STYLES : TIME_STYLES;
	const style = element.style;
	if (style === null || style === undefined) return styles.medium ?? {};
	if (typeof style === 'string') {
		const options = styles[style];
		if (options === undefined)
			throw unsupported(where, `the ${kind} style ${style}`);
		return options;
	}
	checkOptions(
		where,
		`${kind} skeleton`,
		style.parsedOptions,
		DATE_KEYS,
		() => new Intl.DateTimeFormat(where.locale, style.parsedOptions),
	);
	return style.parsedOptions;
}
