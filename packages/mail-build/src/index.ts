/**
 * `@nxgt/mail-build` — the build side of `@nxgt/mail`. It runs at build time
 * only, as a devDependency, and is never shipped to a server.
 *
 * It compiles ICU message catalogues and Maizzle templates (Vue single-file
 * components) into one typed TypeScript module: `t(locale, key, args)`, and
 * `mails` — one render function per e-mail, whose arguments are typed from
 * the ICU. Each template is rendered once, at build time; the module joins
 * static chunks with escaped values, uses `Intl` at run time, and imports
 * nothing.
 *
 * **A build that cannot be right fails.** A catalogue that does not parse, a
 * key missing in a locale, an argument a translation invents, a template
 * calling an unknown key: a `MailBuildError` naming the template, the locale
 * and the key. Nothing falls back to the raw message.
 */

export {
	type BuildOptions,
	type BuildResult,
	build,
	compileProject,
	defineMailConfig,
	type MailConfig,
} from './build';
export { type DevOptions, type DevResult, dev } from './dev';

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
export {
	definePreset,
	type Preset,
	type ResolvedPresets,
	resolvePresets,
	type Theme,
	themeCss,
} from './presets';
export {
	type CompiledEmail,
	type CompiledMail,
	type CompileMailOptions,
	compileMail,
	type MailProp,
	type TemplateFile,
} from './templates/compile';
