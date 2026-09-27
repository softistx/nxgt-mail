/**
 * What the components share. Shipped as source: Maizzle compiles it with the
 * components that import it.
 */
import { Fragment, inject, isVNode, type VNode } from 'vue';

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

export interface UiContext {
	readonly brand: Brand;
	readonly css: string;
}

/** Which part of an `NxTable` a cell is in, as its `NxTableHeader`/`Body`/`Footer` says. */
export const TABLE_PART = 'nxgt:mail-ui:table-part';
export type TablePart = 'header' | 'body' | 'footer';

/** The pixel size of the `NxAvatar`s inside, as `NxAvatar` or `NxAvatarGroup` says. */
export const AVATAR_SIZE = 'nxgt:mail-ui:avatar-size';

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

/** material-vue's Button variants, which its Chip takes too. */
export type ColourVariant = 'filled' | 'tonal' | 'outlined' | 'ghost' | 'link';

/** The token of a colour: `default` is the foreground. */
const token = (color: Color) => (color === 'default' ? 'foreground' : color);

/**
 * The classes of a `variant` in a `color`, as material-vue's Button colours
 * them: `NxButton`'s and `NxChip`'s, which each add their own.
 */
export function colourVariant(variant: ColourVariant, color: Color): string {
	switch (variant) {
		case 'filled':
			return color === 'default'
				? 'bg-foreground text-background'
				: `bg-${color} text-${color}-foreground`;
		case 'tonal':
			return `bg-${token(color)}-15 text-${token(color)}`;
		case 'outlined':
			return `border border-solid border-${token(color)}-50 text-${token(color)}`;
		case 'ghost':
			return 'text-foreground';
		case 'link':
			return `text-${token(color)}`;
	}
}

/**
 * The components a slot holds, out of any `v-for` fragment, without its text
 * or comments: what `NxAvatarGroup` lays out one by one.
 */
export function slotComponents(nodes: readonly unknown[] | undefined): VNode[] {
	return (nodes ?? []).flatMap((node) => {
		if (!isVNode(node)) return [];
		if (node.type === Fragment) {
			return slotComponents(Array.isArray(node.children) ? node.children : []);
		}
		return typeof node.type === 'symbol' ? [] : [node];
	});
}
