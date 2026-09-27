import type { ArgsOf, KeyOf } from '@nxgt/i18n-vue/core';

/**
 * Every key a template may pass to `t`, with its arguments. Empty here; the
 * plugin fills it in `.maizzle/nxgt-mail-i18n.d.ts` from the project's
 * catalogues each time the config loads, so an editor completes a key and
 * flags an unknown one. With the file but no key, `t` takes any string.
 */
// biome-ignore lint/suspicious/noEmptyInterface: augmented by the generated file.
export interface TemplateMessages {}

/** A key of the catalogues once the types are generated; any string while none is. */
export type TemplateKey = KeyOf<TemplateMessages>;

/**
 * The arguments of `key`: none, its declared ones, or any while no key is
 * declared. A key that may be one of several messages (`ok ? 'a' : 'b'`)
 * takes arguments every one of them accepts; the build refuses an argument a
 * message does not use, so they must all use the same names. A key that may
 * be any message takes any arguments: TypeScript reads an unknown key as
 * every key, and the key is then what it reports.
 *
 * `@nxgt/i18n-vue/core`'s `ArgsOf`, generic over the same shape of
 * declaration `@nxgt/i18n-vue`'s own `I18nMessages` uses, parametrised over
 * `TemplateMessages` instead.
 */
export type TemplateArgs<K> = ArgsOf<TemplateMessages, K>;

/**
 * What a template gets from the i18n plugin, typed for Vue's template
 * checker: `{{ t('verify-email.title') }}`, `:lang="locale"`,
 * `:href="placeholder('link')"`.
 */
declare module 'vue' {
	interface ComponentCustomProperties {
		/** The message `key` in the template's locale. A key or an argument that cannot be right fails the build. */
		t<K extends TemplateKey>(key: K, ...args: TemplateArgs<K>): string;
		/** The locale this build of the template is in: `'fr'`. */
		readonly locale: string;
		/** `'rtl'` for a right-to-left locale (`ar`, `he`, `fa`, `ur`, …), else `'ltr'`. */
		readonly dir: 'ltr' | 'rtl';
		/** `{{ name }}` in the built file, filled at send time. `name` is camelCase. */
		placeholder(name: string): string;
	}
}
