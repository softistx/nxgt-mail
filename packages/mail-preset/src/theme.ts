/**
 * The tokens of `nxgtPreset`, by Tailwind namespace. Neutral on purpose: grey
 * and one accent, so an application that changes nothing sends something
 * plain rather than something branded as someone else's.
 *
 * Each token is a Tailwind class once written: `color.primary` is
 * `bg-primary` and `text-primary`, `color.onPrimary` is `text-on-primary`,
 * `radius.button` is `rounded-button`, `font.mono` is `font-mono`.
 */
export interface NxgtTheme {
	readonly color: {
		/** The accent: the button, the links. */
		readonly primary: string;
		/** Text written on the accent. */
		readonly onPrimary: string;
		/** Behind the card. */
		readonly canvas: string;
		/** The card. */
		readonly surface: string;
		/** Body text and headings. */
		readonly foreground: string;
		/** The footer, secondary text. */
		readonly muted: string;
		/** The divider. */
		readonly border: string;
		/** Behind a one-time code. */
		readonly code: string;
	};
	readonly font: {
		/** Fonts every client has, so nothing is downloaded. */
		readonly sans: string;
		/** For a one-time code: `0` and `O` apart. */
		readonly mono: string;
	};
	readonly radius: {
		readonly button: string;
		readonly card: string;
	};
}

export const defaultTheme: NxgtTheme = {
	color: {
		primary: '#2563eb',
		onPrimary: '#ffffff',
		canvas: '#f4f4f5',
		surface: '#ffffff',
		foreground: '#18181b',
		muted: '#71717a',
		border: '#e4e4e7',
		code: '#f4f4f5',
	},
	font: {
		sans: "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
		mono: "ui-monospace, Menlo, Consolas, 'Courier New', monospace",
	},
	radius: {
		button: '6px',
		card: '8px',
	},
};
