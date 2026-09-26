import { MailBuildError } from '../errors';
import {
	type AnalysedMessage,
	type ArgumentKind,
	analyseMessage,
} from './analyse';
import {
	type Catalogue,
	type FlatCatalogue,
	mergeCatalogues,
} from './catalogue';
import { type EmittableMessage, emitMessagesModule } from './emit';

/** One source of catalogues: a preset's, or the application's. */
export interface MessageSource {
	/** Named in the errors: `"preset nxgt"`, `"messages/"`. */
	readonly name: string;
	/** A catalogue per locale; a locale this source does not translate is absent or `null`. */
	readonly catalogues: Readonly<Record<string, Catalogue | null | undefined>>;
}

export interface CompileMessagesOptions {
	/** Every locale the build supports, in order. */
	readonly locales: readonly string[];
	/** The reference: every other locale must hold exactly its keys. */
	readonly fallbackLocale: string;
	/** Earliest first: presets, then the application. A later source overrides a message. */
	readonly sources: readonly MessageSource[];
}

export interface CompiledMessages {
	/** The TypeScript module: `locales`, `MessageArgs`, `t`. */
	readonly module: string;
	/** Every key, with the arguments its fallback message declares. */
	readonly args: ReadonlyMap<string, ReadonlyMap<string, ArgumentKind>>;
}

const LOCALE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
const ARGUMENT = /^[a-z][a-zA-Z0-9]*$/;

function checkWiring(options: CompileMessagesOptions): void {
	if (options.locales.length === 0) {
		throw new TypeError(
			'compileMessages: locales must hold at least one locale',
		);
	}
	for (const locale of options.locales) {
		if (!LOCALE.test(locale)) {
			throw new TypeError(
				`compileMessages: ${locale} is not a locale — write it as a BCP 47 tag, as en or pt-BR`,
			);
		}
	}
	if (new Set(options.locales).size !== options.locales.length) {
		throw new TypeError('compileMessages: locales holds the same locale twice');
	}
	if (!options.locales.includes(options.fallbackLocale)) {
		throw new TypeError(
			'compileMessages: fallbackLocale must be one of locales',
		);
	}
}

function analyseAll(
	locale: string,
	flat: FlatCatalogue,
): Map<string, AnalysedMessage> {
	const out = new Map<string, AnalysedMessage>();
	for (const [key, text] of flat) {
		const analysed = analyseMessage(text, locale, key);
		for (const name of analysed.args.keys()) {
			if (!ARGUMENT.test(name)) {
				throw new MailBuildError(
					'KEY_NOT_CAMEL_CASE',
					`messages: ${locale}: ${key} uses {${name}}, which is not camelCase — an argument is a camelCase name, as {firstName}`,
					{ locale, key },
				);
			}
		}
		out.set(key, analysed);
	}
	return out;
}

function checkAgainstReference(
	locale: string,
	reference: {
		readonly locale: string;
		readonly messages: ReadonlyMap<string, AnalysedMessage>;
	},
	messages: ReadonlyMap<string, AnalysedMessage>,
): void {
	for (const key of [...reference.messages.keys()].sort()) {
		if (!messages.has(key)) {
			throw new MailBuildError(
				'KEY_MISSING',
				`messages: ${locale}: ${key} is missing — ${reference.locale}, the fallback locale, has it`,
				{ locale, key },
			);
		}
	}
	for (const [key, message] of [...messages].sort(([a], [b]) =>
		a.localeCompare(b),
	)) {
		const declared = reference.messages.get(key);
		if (declared === undefined) {
			throw new MailBuildError(
				'KEY_UNKNOWN',
				`messages: ${locale}: ${key} is not a key of ${reference.locale}, the fallback locale`,
				{ locale, key },
			);
		}
		for (const [name, kind] of message.args) {
			const expected = declared.args.get(name);
			if (expected === undefined) {
				throw new MailBuildError(
					'ARGUMENT_UNDECLARED',
					`messages: ${locale}: ${key} uses {${name}}, which ${reference.locale} does not declare`,
					{ locale, key },
				);
			}
			if (expected !== kind) {
				throw new MailBuildError(
					'ARGUMENT_TYPE_MISMATCH',
					`messages: ${locale}: ${key} uses {${name}} as ${kind}, and ${reference.locale} declares it as ${expected}`,
					{ locale, key },
				);
			}
		}
	}
}

/**
 * Compiles the catalogues of every source into one typed module.
 *
 * Fails the build — with a {@link MailBuildError} naming the locale and the
 * key — on a catalogue that does not parse, a key that is not camelCase, a
 * key missing in a locale or unknown to the fallback locale, and an argument
 * a locale uses that the fallback locale does not declare, or declares as
 * another kind.
 */
export function compileMessages(
	options: CompileMessagesOptions,
): CompiledMessages {
	checkWiring(options);

	const analysed = new Map<string, Map<string, AnalysedMessage>>();
	for (const locale of options.locales) {
		const flat = mergeCatalogues(
			locale,
			options.sources.flatMap(({ name, catalogues }) => {
				const catalogue = catalogues[locale];
				return catalogue === null || catalogue === undefined
					? []
					: [{ name, catalogue }];
			}),
		);
		analysed.set(locale, analyseAll(locale, flat));
	}

	const referenceMessages = analysed.get(options.fallbackLocale) ?? new Map();
	const reference = {
		locale: options.fallbackLocale,
		messages: referenceMessages,
	};
	for (const locale of options.locales) {
		if (locale === options.fallbackLocale) continue;
		checkAgainstReference(locale, reference, analysed.get(locale) ?? new Map());
	}

	const args = new Map<string, ReadonlyMap<string, ArgumentKind>>(
		[...referenceMessages].map(([key, message]) => [key, message.args]),
	);
	const messages = new Map<string, EmittableMessage[]>(
		[...analysed].map(([locale, byKey]) => [
			locale,
			[...byKey].map(([key, message]) => ({ key, ast: message.ast })),
		]),
	);

	return {
		module: emitMessagesModule({
			locales: options.locales,
			fallbackLocale: options.fallbackLocale,
			args,
			messages,
		}),
		args,
	};
}
