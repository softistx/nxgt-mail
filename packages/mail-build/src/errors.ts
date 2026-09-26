/**
 * Why a build failed, as a string a script can switch on.
 *
 * **A build that cannot be right fails**: nothing is caught, and nothing falls
 * back to the raw message, which would send an e-mail with `{link}` in it. A
 * mistake in how the build was *wired* — no locale, a fallback that is not one
 * of them — is a bare `TypeError` instead.
 */
export type MailBuildErrorCode =
	/** A catalogue is not JSON, or not an object of objects and strings. */
	| 'CATALOGUE_INVALID'
	/** A message does not parse as ICU. */
	| 'MESSAGE_UNPARSABLE'
	/**
	 * A message parses, and uses something the build cannot turn into a
	 * correct `Intl` call: a named style it does not know, a skeleton option
	 * `Intl` does not read (`scale/100`), or options `Intl` refuses (a currency
	 * style without a currency).
	 */
	| 'MESSAGE_UNSUPPORTED'
	/** A key is not `camelCase`: `verify_email.title`, `Verify.title`. */
	| 'KEY_NOT_CAMEL_CASE'
	/** Two catalogues disagree on whether a key is a message or a namespace. */
	| 'KEY_CONFLICT'
	/** A key of the fallback locale is missing in another locale. */
	| 'KEY_MISSING'
	/** A locale holds a key the fallback locale does not. */
	| 'KEY_UNKNOWN'
	/** A locale uses an argument the fallback locale's message does not declare. */
	| 'ARGUMENT_UNDECLARED'
	/** An argument is a number in one place and a string or a date in another. */
	| 'ARGUMENT_TYPE_MISMATCH';

/**
 * A build that failed. The message names the locale and the key — and the
 * argument when there is one — never the text of the message.
 */
export class MailBuildError extends Error {
	override name = 'MailBuildError';
	readonly code: MailBuildErrorCode;
	/** The locale the problem is in, when it is in one. */
	readonly locale: string | undefined;
	/** The dotted key the problem is at, when there is one. */
	readonly key: string | undefined;

	constructor(
		code: MailBuildErrorCode,
		message: string,
		options?: {
			readonly locale?: string;
			readonly key?: string;
			readonly cause?: unknown;
		},
	) {
		super(message, { cause: options?.cause });
		this.code = code;
		this.locale = options?.locale;
		this.key = options?.key;
	}
}
