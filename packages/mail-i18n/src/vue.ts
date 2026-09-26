import type { MessageArgs } from './translator';

/**
 * What a template gets from the i18n plugin, typed for Vue's template
 * checker: `{{ t('verifyEmail.title') }}`, `:lang="locale"`,
 * `:href="placeholder('link')"`.
 */
declare module 'vue' {
	interface ComponentCustomProperties {
		/** The message `key` in the template's locale. A key or an argument that cannot be right fails the build. */
		t(key: string, args?: MessageArgs): string;
		/** The locale this build of the template is in: `'fr'`. */
		readonly locale: string;
		/** `{{ name }}` in the built file, filled at send time. `name` is camelCase. */
		placeholder(name: string): string;
	}
}
