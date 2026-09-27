/**
 * `@nxgt/mail` — the run-time side of transactional e-mail: the `Mailer` port
 * a transport implements, the shapes it sends, the errors it throws, a memory
 * transport for tests, and locale selection. No dependency, and no Node
 * built-in: it runs anywhere. The renderer that fills a build of
 * `@nxgt/mail-i18n` is `@nxgt/mail/renderer`, which reads files.
 *
 * ## The one rule this package is built around
 *
 * **A failure throws.** A transport that could not hand a message over rejects
 * with `MailFailure`; it never answers `false` and never logs and resolves. A
 * caller that maps a failed send to "sent" has told a user to check an inbox
 * that will stay empty. `@nxgt/mail/conformance` fails a transport that breaks
 * it.
 */

export {
	MailError,
	type MailErrorCode,
	type MailErrorOptions,
	MailFailure,
	MailRefused,
} from './errors';
export { parseAcceptLanguage, pickLocale, type WantedLocales } from './locale';
export {
	createMemoryMailer,
	type MemoryMail,
	type MemoryMailer,
} from './memory';
export { addressOf, checkMessage, recipientsOf } from './message';
export type {
	Address,
	MailAttachment,
	Mailer,
	MailMessage,
	Rendered,
	SentMail,
} from './types';
export {
	type ListUnsubscribeHeaders,
	type ListUnsubscribeOptions,
	listUnsubscribe,
} from './unsubscribe';
