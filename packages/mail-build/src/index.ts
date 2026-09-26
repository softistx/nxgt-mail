/**
 * `@nxgt/mail-build` — the build side of `@nxgt/mail`. It runs at build time
 * only, as a devDependency, and is never shipped to a server.
 *
 * This part compiles ICU message catalogues into a typed TypeScript module:
 * one function per message and locale, and `t(locale, key, args)`, whose
 * arguments are typed from the ICU. The module uses `Intl` at run time and
 * imports nothing.
 *
 * **A build that cannot be right fails.** A catalogue that does not parse, a
 * key missing in a locale, an argument a translation invents: a
 * `MailBuildError` naming the locale and the key. Nothing falls back to the
 * raw message.
 */

export { MailBuildError, type MailBuildErrorCode } from './errors';
export type { ArgumentKind } from './messages/analyse';
export {
	type Catalogue,
	type Catalogues,
	readCatalogues,
} from './messages/catalogue';
export {
	type CompiledMessages,
	type CompileMessagesOptions,
	compileMessages,
	type MessageSource,
} from './messages/compile';
