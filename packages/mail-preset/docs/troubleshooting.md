# Troubleshooting `@nxgt/mail-preset`

Each entry is headed by the text you see. Search this page for the words of
your message; `<option>`, `<namespace>`, `<token>` and the like stand for the
names in yours.

- **A `TypeError` starting with `nxgtPreset:` is a mistake in its options**,
  thrown by the call itself, before the build reads anything. It names the
  option by its path (`brand.primary`, `theme.color.canvas`) and, for a name
  the preset does not have, lists the names it does.
- **In TypeScript, most of these are compile errors first**: an unknown
  option, namespace or token, or a token that is not a string, is refused by
  the compiler in `mail.config.ts`. You meet the `TypeError` from a config in
  JavaScript, or from options built at run time (read from JSON, spread from
  an object typed loosely).
- **A `build:` error naming `preset nxgt`, and a style that does not apply,
  come from the build**: they are on the
  [`@nxgt/mail-build` troubleshooting page](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/troubleshooting.md#presets),
  listed [below](#building-with-the-preset).

The examples call the preset in `mail.config.ts`:

```ts
import { defineMailConfig } from '@nxgt/mail-build';
import { nxgtPreset } from '@nxgt/mail-preset';

export default defineMailConfig({
  locales: ['en', 'fr'],
  fallbackLocale: 'en',
  presets: [nxgtPreset({ brand: { primary: '#4f46e5' } })],
});
```

## Index

**Calling `nxgtPreset`**
- [`nxgtPreset: options.<option> is not an option — one of brand, theme`](#nxgtpreset-optionsoption-is-not-an-option--one-of-brand-theme)
- [`nxgtPreset: brand.<option> is not a brand option — one of primary, onPrimary, logo, name`](#nxgtpreset-brandoption-is-not-a-brand-option--one-of-primary-onprimary-logo-name)
- [`nxgtPreset: theme.<namespace> is not a theme namespace of the preset — one of color, font, radius`](#nxgtpreset-themenamespace-is-not-a-theme-namespace-of-the-preset--one-of-color-font-radius)
- [`nxgtPreset: theme.<namespace>.<token> is not a token of the preset — one of <tokens>`](#nxgtpreset-themenamespacetoken-is-not-a-token-of-the-preset--one-of-tokens)
- [`nxgtPreset: brand.logo must be an http: or https: URL`](#nxgtpreset-brandlogo-must-be-an-http-or-https-url)
- [`nxgtPreset: brand.name is the logo's alternative text — give brand.logo too`](#nxgtpreset-brandname-is-the-logos-alternative-text--give-brandlogo-too)
- [`nxgtPreset: <option> must be a string`](#nxgtpreset-option-must-be-a-string)
- [`nxgtPreset: <option> must be an object`](#nxgtpreset-option-must-be-an-object)

**Building with the preset**
- [Errors and symptoms the build reports](#errors-and-symptoms-the-build-reports)

---

## Calling `nxgtPreset`

### `nxgtPreset: options.<option> is not an option — one of brand, theme`

**When:** calling `nxgtPreset()` with a top-level option it does not have:
a misspelling (`colours`), or a token written at the top instead of under
`brand` or `theme` (`nxgtPreset({ primary: '#4f46e5' })`).
**Why:** the preset takes two options, `brand` and `theme`. An option it
ignored would leave the e-mails in the default colours without a word.
**Fix:**

```ts
nxgtPreset({ brand: { primary: '#4f46e5' } });
```

### `nxgtPreset: brand.<option> is not a brand option — one of primary, onPrimary, logo, name`

**When:** calling `nxgtPreset()` with a `brand` key it does not have: a
misspelling (`primry`), or a token of the theme (`brand: { canvas: '#fff' }`).
**Why:** `brand` holds the four things a brand usually changes; every other
token is under `theme`.
**Fix:**

```ts
nxgtPreset({
  brand: { primary: '#4f46e5', onPrimary: '#ffffff' },
  theme: { color: { canvas: '#ffffff' } },
});
```

### `nxgtPreset: theme.<namespace> is not a theme namespace of the preset — one of color, font, radius`

**When:** calling `nxgtPreset()` with a `theme` namespace it does not have:
`colour`, `colors`, `borderRadius`, or a namespace of Tailwind the preset
does not set (`spacing`).
**Why:** `theme` overrides the preset's own tokens, one at a time; it does
not add new ones. To add tokens, write a preset of your own with
`definePreset` from `@nxgt/mail-build`, listed after this one.
**Fix:**

```ts
nxgtPreset({ theme: { color: { canvas: '#ffffff' }, radius: { button: '0' } } });
```

### `nxgtPreset: theme.<namespace>.<token> is not a token of the preset — one of <tokens>`

**When:** calling `nxgtPreset()` with a token its namespace does not have —
`theme.color.brand`, `theme.color.on-primary`, `theme.radius.large`. The
message lists the tokens of that namespace: `color` has `primary`,
`onPrimary`, `canvas`, `surface`, `foreground`, `muted`, `border`, `code`;
`font` has `sans`, `mono`; `radius` has `button`, `card`.
**Why:** the preset's components use these tokens and no other; a token they
do not use would change nothing.
**Fix:**

```ts
nxgtPreset({ theme: { color: { onPrimary: '#ffffff' }, radius: { card: '12px' } } });
```

### `nxgtPreset: brand.logo must be an http: or https: URL`

**When:** calling `nxgtPreset()` with a `brand.logo` that does not start
with `http://` or `https://`: a path (`/logo.png`), a URL without a scheme
(`//cdn.example.com/logo.png`, `cdn.example.com/logo.png`), a `data:` image.
**Why:** the logo is shown at the top of every e-mail, read in a mail client
far from your site: a path points nowhere there, and many clients do not
show `data:` images.
**Fix:**

```ts
nxgtPreset({
  brand: { logo: 'https://cdn.example.com/logo.png', name: 'Example' },
});
```

### `nxgtPreset: brand.name is the logo's alternative text — give brand.logo too`

**When:** calling `nxgtPreset()` with `brand.name` and no `brand.logo`:
`nxgtPreset({ brand: { name: 'Example' } })`.
**Why:** the preset shows no brand name as text; `brand.name` is only the
`alt` of the logo, so without a logo it would change nothing.
**Fix:** give the logo with it, or leave the name out:

```ts
nxgtPreset({
  brand: { logo: 'https://cdn.example.com/logo.png', name: 'Example' },
});
```

### `nxgtPreset: <option> must be a string`

**When:** calling `nxgtPreset()` with a `brand` option or a `theme` token
that is not a string: `brand: { primary: 0x4f46e5 }`,
`theme: { radius: { card: 8 } }`, `brand: { primary: null }`. `<option>` is its
path: `brand.primary`, `theme.radius.card`.
**Why:** each value is written as it is — a token into the CSS, the name into
the logo's `alt` — and a number has no unit.
**Fix:**

```ts
nxgtPreset({ brand: { primary: '#4f46e5' }, theme: { radius: { card: '8px' } } });
```

A string that is empty, or that holds what one CSS value never needs (`;`, a
brace, a backslash, `<`, `>`, `@`, a double quote, `url()`, a comment, a line
break or an unbalanced quote), passes here and is refused by the build, as
`build: preset nxgt: the theme token <namespace>.<token> …`: see
[below](#building-with-the-preset).

### `nxgtPreset: <option> must be an object`

**When:** calling `nxgtPreset()` with options that are not a plain object —
`nxgtPreset(null)`, `nxgtPreset('#4f46e5')` — or with `brand`, `theme` or a
namespace of `theme` that is not one: `brand: '#4f46e5'`, `brand: null`,
`theme: { color: '#4f46e5' }`, `theme: { color: null }`. `<option>` is `options`, `brand`, `theme` or
`theme.<namespace>`.
**Why:** every option is named, so that the preset can refuse one it does
not have. Left out, an option is the preset's default.
**Fix:**

```ts
nxgtPreset(); // every default
nxgtPreset({ brand: { primary: '#4f46e5' } });
```

---

## Building with the preset

### Errors and symptoms the build reports

These come from `@nxgt/mail-build`, and are described on its
troubleshooting page:

- **A token value the CSS cannot hold** —
  [`build: preset nxgt: the theme token <namespace>.<token> must be a CSS value, as '#2563eb'`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/troubleshooting.md#build-preset-name-the-theme-token-namespacetoken-must-be-a-css-value-as-2563eb)
  for an empty string, and
  [`… holds what one CSS value never needs — ;, a brace, a backslash, <, >, @, a double quote, url(), a comment, a line break or an unbalanced quote`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/troubleshooting.md#build-preset-name-the-theme-token-namespacetoken-holds-what-one-css-value-never-needs---a-brace-a-backslash----a-double-quote-url-a-comment-a-line-break-or-an-unbalanced-quote).
- **`nxgtPreset()` listed twice** —
  [`build: two presets are named nxgt — a preset is listed once`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/troubleshooting.md#build-two-presets-are-named-name--a-preset-is-listed-once).
  Give every option in one call.
- **`nxgtPreset` listed without being called** —
  [`build: presets[<i>] is not a preset — pass what a preset function returns, as nxgtPreset()`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/troubleshooting.md#build-presetsi-is-not-a-preset--pass-what-a-preset-function-returns-as-nxgtpreset).
- **A locale the preset does not translate** (it translates `en` and `fr`) —
  [`KEY_MISSING` for `common.footer.ignore`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/troubleshooting.md#key_missing--messages-locale-commonfooterignore-is-missing--fallback-the-fallback-locale-has-it):
  write `common.greeting`, `common.footer.why` and `common.footer.ignore` in
  your catalogue for that locale.
- **A token class with no effect in a layout of your own** —
  [`theme.css` imported in its own `<style>`](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/troubleshooting.md#a-token-class-bg-brand-has-no-effect-themecss-is-imported-in-its-own-style).
- **A class that names no token** (`bg-primry`, `text-onPrimary`) —
  [dropped by Tailwind, and nothing fails](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail-build/docs/troubleshooting.md#a-class-naming-a-token-that-does-not-exist-bg-primry-is-dropped-and-nothing-fails).
  The preset's classes are `bg-primary`, `text-on-primary`, `bg-canvas`,
  `bg-surface`, `text-foreground`, `text-muted`, `bg-border`, `text-primary`, `bg-code`,
  `font-sans`, `font-mono`, `rounded-button`, `rounded-card`.
