import type { Brand } from './plugin';

/** What a template gets from the ui plugin: `{{ brand.name }}`. */
declare module 'vue' {
	interface ComponentCustomProperties {
		/** The `brand` given to `ui()`. */
		readonly brand: Brand;
	}
}
