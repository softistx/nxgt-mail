import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** `theme.css`, beside `src/` and `dist/` in the package. */
export const THEME_FILE = fileURLToPath(
	new URL('../theme.css', import.meta.url),
);

/** A token as `theme` names it: `color-primary`, `radius-lg`. */
const TOKEN = /^[a-z][a-z0-9-]*$/;

/**
 * A value that stays inside its declaration: no `;`, brace, angle bracket,
 * quote, backslash, comment or line break.
 */
const VALUE = /^(?!.*(?:\/\*|\*\/))[^;{}<>"'\\\r\n]+$/;

/**
 * The primary tints that carry a chip's or a button's text, or its border, at
 * partial strength: `theme.css` aliases each `-dark` twin to its own light
 * tint by default. A project that sets `color-primary-dark` wants these to
 * follow it instead — the same percentages, now mixed over the dark
 * background rather than the light one — so a tonal chip's near-white text
 * is not painted over a tint still mixed from the *light* primary.
 */
const PRIMARY_TINTS = [15, 20, 40, 50] as const;

/** The tokens `css` declares, without their `--`: `color-primary`, … */
export function declaredTokens(css: string): ReadonlySet<string> {
	return new Set(
		Array.from(
			css.matchAll(/^\s*--([a-z][a-z0-9-]*)\s*:/gm),
			(m) => m[1] as string,
		),
	);
}

/**
 * The CSS a layout puts under `@import "@maizzle/tailwindcss"`: the theme,
 * then an `@theme` block of the project's overrides, which wins. A token the
 * theme does not declare, or a value that is not one, **throws**.
 */
export function themeCss(theme: Readonly<Record<string, string>>): string {
	const css = readFileSync(THEME_FILE, 'utf8');
	const tokens = declaredTokens(css);
	const overrides: string[] = [];
	for (const [token, value] of Object.entries(theme)) {
		if (!TOKEN.test(token) || !tokens.has(token)) {
			throw new TypeError(
				`ui: theme.${token} is not a token of the theme — name one of theme.css without its --, as color-primary`,
			);
		}
		if (typeof value !== 'string' || !VALUE.test(value.trim())) {
			throw new TypeError(
				`ui: theme.${token} must be a CSS value, as #0f766e or 8px`,
			);
		}
		overrides.push(`\t--${token}: ${value.trim()};`);
	}
	// Only here do we know `color-primary-dark` was set, not merely defaulted
	// to `color-primary` by theme.css: recompute its tints against the dark
	// background instead of leaving them aliased to the light ones. Skip a
	// percentage the project already overrode itself, above — its own value
	// is already in `overrides` and must win, not be shadowed by this one
	// appended after it (CSS resolves a duplicate custom property by source
	// order, so whichever is pushed last would otherwise take over).
	if (Object.hasOwn(theme, 'color-primary-dark')) {
		for (const pct of PRIMARY_TINTS) {
			const token = `color-primary-${pct}-dark`;
			if (Object.hasOwn(theme, token)) continue;
			overrides.push(
				`\t--${token}: color-mix(in srgb, var(--color-primary-dark) ${pct}%, var(--color-background-dark));`,
			);
		}
	}
	return overrides.length === 0
		? css
		: `${css}\n@theme {\n${overrides.join('\n')}\n}\n`;
}
