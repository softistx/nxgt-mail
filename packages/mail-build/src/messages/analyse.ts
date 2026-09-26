import {
	type MessageFormatElement,
	parse,
	TYPE,
} from '@formatjs/icu-messageformat-parser';
import { MailBuildError } from '../errors';

/**
 * What an argument is, from the way a message uses it:
 *
 * - `{name}` and `{g, select, …}` are a `string`;
 * - `{n, number}`, `{n, plural, …}` and `{n, selectordinal, …}` are a `number`;
 * - `{at, date}` and `{at, time}` are a `Date`.
 *
 * A plain `{n}` in a message that also uses `n` as a number is that number.
 */
export type ArgumentKind = 'string' | 'number' | 'date';

/** One message, parsed, with the kind of each argument it uses. */
export interface AnalysedMessage {
	readonly ast: readonly MessageFormatElement[];
	readonly args: ReadonlyMap<string, ArgumentKind>;
}

/** Parses an ICU message. Tags are text: `<b>` in a message is escaped like the rest. */
export function parseMessage(
	text: string,
	locale: string,
	key: string,
): MessageFormatElement[] {
	try {
		return parse(text, { ignoreTag: true, shouldParseSkeletons: true });
	} catch (cause) {
		const reason =
			cause instanceof Error ? cause.message : 'the parser refused it';
		// Not passed as `cause`: the parser's error carries the whole text of
		// the message, and a build failure names a key, never a text.
		throw new MailBuildError(
			'MESSAGE_UNPARSABLE',
			`messages: ${locale}: ${key} is not a valid ICU message (${reason})`,
			{ locale, key },
		);
	}
}

function collect(
	elements: readonly MessageFormatElement[],
	uses: Map<string, Set<ArgumentKind | 'plain'>>,
): void {
	const use = (name: string, kind: ArgumentKind | 'plain') => {
		const set = uses.get(name) ?? new Set();
		set.add(kind);
		uses.set(name, set);
	};
	for (const element of elements) {
		switch (element.type) {
			case TYPE.argument:
				use(element.value, 'plain');
				break;
			case TYPE.number:
				use(element.value, 'number');
				break;
			case TYPE.date:
			case TYPE.time:
				use(element.value, 'date');
				break;
			case TYPE.select:
				use(element.value, 'string');
				for (const option of Object.values(element.options)) {
					collect(option.value, uses);
				}
				break;
			case TYPE.plural:
				use(element.value, 'number');
				for (const option of Object.values(element.options)) {
					collect(option.value, uses);
				}
				break;
			case TYPE.tag:
				collect(element.children, uses);
				break;
			default:
				break;
		}
	}
}

/**
 * Parses a message and types its arguments. An argument used as two
 * different kinds in one message — a number here, a date there — fails the
 * build.
 */
export function analyseMessage(
	text: string,
	locale: string,
	key: string,
): AnalysedMessage {
	const ast = parseMessage(text, locale, key);
	const uses = new Map<string, Set<ArgumentKind | 'plain'>>();
	collect(ast, uses);

	const args = new Map<string, ArgumentKind>();
	for (const [name, kinds] of uses) {
		const typed = [...kinds].filter(
			(kind): kind is ArgumentKind => kind !== 'plain',
		);
		const distinct = [...new Set(typed)];
		if (distinct.length > 1) {
			throw new MailBuildError(
				'ARGUMENT_TYPE_MISMATCH',
				`messages: ${locale}: ${key} uses {${name}} as ${distinct.join(' and as ')}`,
				{ locale, key },
			);
		}
		args.set(name, distinct[0] ?? 'string');
	}
	return { ast, args };
}
