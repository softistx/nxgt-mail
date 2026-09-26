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
	return overrides.length === 0
		? css
		: `${css}\n@theme {\n${overrides.join('\n')}\n}\n`;
}
