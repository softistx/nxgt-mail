import type { MessageArgs } from './translator';

/**
 * Every key a template may pass to `t`, with its arguments. Empty here; the
 * plugin fills it in `.maizzle/nxgt-mail-i18n.d.ts` from the project's
 * catalogues each time the config loads, so an editor completes a key and
 * flags an unknown one. Without that file, `t` takes any string.
 */
// biome-ignore lint/suspicious/noEmptyInterface: augmented by the generated file.
export interface TemplateMessages {}

type Declared = keyof TemplateMessages;

/** A key of the catalogues once the types are generated; any string before. */
export type TemplateKey = [Declared] extends [never] ? string : Declared;

/** The arguments of `key`: none, its declared ones, or any before the types are generated. */
export type TemplateArgs<K> = K extends Declared
	? keyof TemplateMessages[K] extends never
		? [args?: Readonly<Record<string, never>>]
		: [args: Readonly<TemplateMessages[K]>]
	: [args?: MessageArgs];

/**
 * What a template gets from the i18n plugin, typed for Vue's template
 * checker: `{{ t('verifyEmail.title') }}`, `:lang="locale"`,
 * `:href="placeholder('link')"`.
 */
declare module 'vue' {
	interface ComponentCustomProperties {
		/** The message `key` in the template's locale. A key or an argument that cannot be right fails the build. */
		t<K extends TemplateKey>(key: K, ...args: TemplateArgs<K>): string;
		/** The locale this build of the template is in: `'fr'`. */
		readonly locale: string;
		/** `{{ name }}` in the built file, filled at send time. `name` is camelCase. */
		placeholder(name: string): string;
	}
}
