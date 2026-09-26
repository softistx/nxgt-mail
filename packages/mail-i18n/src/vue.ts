import type { MessageArgs } from './translator';

/**
 * Every key a template may pass to `t`, with its arguments. Empty here; the
 * plugin fills it in `.maizzle/nxgt-mail-i18n.d.ts` from the project's
 * catalogues each time the config loads, so an editor completes a key and
 * flags an unknown one. With the file but no key, `t` takes any string.
 */
// biome-ignore lint/suspicious/noEmptyInterface: augmented by the generated file.
export interface TemplateMessages {}

type Declared = keyof TemplateMessages;

/** A key of the catalogues once the types are generated; any string while none is. */
export type TemplateKey = [Declared] extends [never] ? string : Declared;

type Names<K> = K extends Declared ? keyof TemplateMessages[K] : never;

/** The keys of `K` whose argument names are not all of `All`'s. */
type Uneven<K, All = K> = K extends Declared
	? [Names<All>] extends [keyof TemplateMessages[K]]
		? never
		: K
	: never;

type Both<U> = (U extends unknown ? (u: U) => void : never) extends (
	i: infer I,
) => void
	? I
	: never;

/** Whether `K` is every declared key, when there are several. */
type Every<K> = [Declared] extends [K]
	? [Declared] extends [Both<Declared>]
		? false
		: true
	: false;

/**
 * The arguments of `key`: none, its declared ones, or any while no key is
 * declared. A key that may be one of several messages (`ok ? 'a' : 'b'`)
 * takes arguments every one of them accepts; the build refuses an argument a
 * message does not use, so they must all use the same names. A key that may
 * be any message takes any arguments: TypeScript reads an unknown key as
 * every key, and the key is then what it reports.
 */
export type TemplateArgs<K> = [K] extends [Declared]
	? Every<K> extends true
		? [args?: MessageArgs]
		: [Uneven<K>] extends [never]
			? [Names<K>] extends [never]
				? [args?: Readonly<Record<string, never>>]
				: [args: Readonly<Both<TemplateMessages[K]>>]
			: [args: never]
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
