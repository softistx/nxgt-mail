/**
 * What the components share. Shipped as source: Maizzle compiles it with the
 * components that import it.
 */
import { inject } from 'vue';

/** material-vue's colours; `default` is the foreground. */
export type Color =
	| 'primary'
	| 'secondary'
	| 'info'
	| 'success'
	| 'warning'
	| 'error'
	| 'default';

/** material-vue's tones for a status: its colours but `default`. */
export type Tone = 'info' | 'success' | 'warning' | 'error';

export interface Brand {
	readonly name: string;
	readonly url?: string;
	readonly logo?: {
		readonly src: string;
		readonly width?: number;
		readonly alt?: string;
	};
}

interface UiContext {
	readonly brand: Brand;
	readonly css: string;
}

/** The brand and theme `ui()` provides. A component used without it **throws**. */
export function useUi(component: string): UiContext {
	const context = inject<UiContext | undefined>('nxgt:mail-ui', undefined);
	if (context === undefined) {
		throw new Error(
			`${component}: ui() is not in the plugins of defineMailConfig`,
		);
	}
	return context;
}
