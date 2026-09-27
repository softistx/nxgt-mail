# The manifest

This page is for reading `dist/mail-manifest.json`, the file `maizzle build`
writes for the code that sends: which e-mails were built, in which locales,
with which placeholders, under which subject — and `generated/mail.ts`, the
same e-mails as a type for the renderer.

```ts
import { readFileSync } from 'node:fs';
import { MANIFEST_FILE, type Manifest } from '@nxgt/mail-i18n';

const manifest: Manifest = JSON.parse(readFileSync(`dist/${MANIFEST_FILE}`, 'utf8'));

manifest.emails['verify-email']?.variables; // ['link', 'name']
manifest.emails['verify-email']?.subject.fr; // 'Confirmez votre adresse e-mail, {{ name }}'
```

`createMailRenderer` from `@nxgt/mail/renderer` reads this file, and every file it
lists, so that sending takes one call:

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';

const mails = createMailRenderer({ dir: 'dist' }); // reads dist/mail-manifest.json
mails.render('verify-email', { name: 'Ada', link: 'https://app.example.com/verify?token=abc' });
```

It requires every variable in `variables`, refuses a value of a URL variable
that is not an `http:`, `https:` or `mailto:` URL, and refuses a build whose
`text` is `null`. See [Rendering](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/rendering.md) in `@nxgt/mail`. For checks of your
own, the file is plain JSON, typed by `Manifest`.

## An example

The project of [Templates](templates.md): `emails/verify-email.vue` and
`emails/auth/reset-password.vue`, built in `en` and `fr`, with the default
`nested` layout. This is the golden file the package's own build is tested
against:

```json
{
	"formatVersion": 1,
	"locales": ["en", "fr"],
	"fallbackLocale": "en",
	"emails": {
		"auth/reset-password": {
			"variables": ["email", "resetLink"],
			"urlVariables": ["resetLink"],
			"subject": {
				"en": "Reset your password",
				"fr": "Réinitialisez votre mot de passe"
			},
			"files": {
				"en": {
					"html": "en/auth/reset-password.html",
					"text": "en/auth/reset-password.txt"
				},
				"fr": {
					"html": "fr/auth/reset-password.html",
					"text": "fr/auth/reset-password.txt"
				}
			}
		},
		"verify-email": {
			"variables": ["link", "name"],
			"urlVariables": ["link"],
			"subject": {
				"en": "Confirm your e-mail address, {{ name }}",
				"fr": "Confirmez votre adresse e-mail, {{ name }}"
			},
			"files": {
				"en": {
					"html": "en/verify-email.html",
					"text": "en/verify-email.txt"
				},
				"fr": {
					"html": "fr/verify-email.html",
					"text": "fr/verify-email.txt"
				}
			}
		}
	}
}
```

## The shape

```ts
const MANIFEST_FORMAT = 1;

interface Manifest {
	readonly formatVersion: number;
	readonly locales: readonly string[];
	readonly fallbackLocale: string;
	readonly emails: Readonly<Record<string, ManifestEmail>>;
}

interface ManifestEmail {
	readonly variables: readonly string[];
	readonly urlVariables: readonly string[];
	readonly subject: Readonly<Record<string, string>>;
	readonly files: Readonly<Record<string, { readonly html: string; readonly text: string | null }>>;
}
```

| Field | Holds |
| --- | --- |
| `formatVersion` | The manifest's format, `MANIFEST_FORMAT` of the `@nxgt/mail-i18n` that built it: `1`. Written first |
| `locales` | The plugin's `locales`, in the order given |
| `fallbackLocale` | The plugin's `fallbackLocale`, or the first locale |
| `emails` | One entry per e-mail, keyed by its template's path under `emails/` without `.vue` (`auth/reset-password`), sorted |

Each e-mail:

| Field | Holds |
| --- | --- |
| `variables` | Every placeholder of the e-mail, in the HTML or the text part of any locale, or in any subject, sorted, each once. The values the sending side must pass |
| `urlVariables` | The placeholders a URL attribute (`href`, `src`, `background`, `poster`, `action`) starts with, sorted. The values that must be URLs |
| `subject` | The subject per locale, formatted from `<emailKey>.subject`, each argument kept as `{{ name }}` |
| `files` | The built files per locale, relative to the output folder: `html`, and `text` or `null` when there is no plain-text part |

### `formatVersion`

The format of the manifest's shape, so the renderer knows what it reads:

```ts
import { MANIFEST_FORMAT } from '@nxgt/mail-i18n';

MANIFEST_FORMAT; // 1 — what this version writes as formatVersion
```

- **It changes only when the manifest's shape does.** A new
  `@nxgt/mail-i18n` that writes the same fields writes the same format.
- **`@nxgt/mail`'s renderer reads every format up to its own**, its
  `MANIFEST_FORMAT` from `@nxgt/mail/renderer`, within 0.x. A build from any
  earlier `@nxgt/mail-i18n` 0.x keeps working with a newer `@nxgt/mail`; a
  newer format fails at start-up with `… is manifest format 2, newer than this
  @nxgt/mail reads (1) — upgrade @nxgt/mail`.
- **A manifest without it is format 1**, as `@nxgt/mail-i18n` 0.1 and 0.2
  wrote it.

See
[Rendering — which builds it reads](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/rendering.md#which-builds-it-reads--manifest_format)
in `@nxgt/mail`.

### `variables`

Collected from the built files, not from the template's source: every
`{{ name }}` the build left in the HTML of each locale, in its text part, and
in each subject. A placeholder only in the text part, inside a Maizzle
`<Plaintext>` block, is listed. So is a placeholder that only one locale
writes. A value the
template formatted at build time (`t('verify-email.expires', { minutes: 15 })`)
is not a variable.

### `urlVariables`

A placeholder that **starts** the value of a URL attribute: `href`, `src`,
`background`, `poster` or `action`, in either kind of quotes, leading spaces
ignored. `:href="placeholder('link')"` writes one. Such a placeholder decides
the scheme of the URL, so the sending side must fill it with a URL and refuse
anything else: a `javascript:` value in a link is an injection.

A placeholder later in the value is a variable, but not a URL variable. The
URL's scheme is already written, and the value only fills a part of it:

```html
<!-- in the built file -->
<a href="{{ link }}">…</a>                                        <!-- link: a URL variable -->
<img src='{{ logo }}'>                                            <!-- logo: a URL variable -->
<a href="https://app.example.com/verify?token={{ token }}">…</a>  <!-- token: a variable only -->
<p title="{{ label }}">…</p>                                      <!-- label: a variable only -->
```

A placeholder in the text, or in another attribute (`title`, `alt`), is
listed in `variables` only.

### `subject`

The message `<emailKey>.subject` of each locale, formatted, each argument
turned into a placeholder. `verify-email.subject` is
`"Confirm your e-mail address, {name}"`, so the manifest holds
`"Confirm your e-mail address, {{ name }}"`, and `name` is in `variables`.
See [the subject](catalogues.md#the-subject).

### `files`

Paths relative to the output folder, with `/` as separator on every system.
They follow `layout` and Maizzle's `output.extension`:

```json
{
	"files": {
		"fr": { "html": "auth/reset-password.fr.html", "text": "auth/reset-password.fr.txt" }
	}
}
```

That is the `flat` layout. `text` is `null` when the project turned
Maizzle's `plaintext` off. Every e-mail has an entry for each locale of
`locales`, in that order: an e-mail missing in one locale fails the build.

## Where it is written

`<output.path>/mail-manifest.json`: `dist/mail-manifest.json` by default, next
to the built files. `MANIFEST_FILE` is the name, and `output.path` is
Maizzle's.

```ts
import { MANIFEST_FILE } from '@nxgt/mail-i18n'; // 'mail-manifest.json'
```

It is written at the end of `maizzle build`, after every template. It is
rewritten whole on each build, with tabs and a final newline, so a diff of
two builds is readable. `maizzle serve` does not write it.

A parallel build writes the same manifest: when Maizzle builds in workers,
each worker loads the config again, and only the main thread writes the
generated files and the manifest. The package's own specs build the fixture
in parallel and compare its manifest with the golden file above.

These fail here, since they need the built files. Like every build failure,
each is a plain `Error`, a mistake to fix in the templates or the
catalogues, not a condition to catch:

| Build failure | Cause |
| --- | --- |
| `i18n: welcome has no subject — add welcome.subject to the catalogues` | An e-mail without a subject message |
| `i18n: en: welcome.subject uses {count} as a number — a subject's arguments are placeholders, filled at send time as strings` | A subject with a `number`, `plural` or `date` argument |
| `i18n: en: welcome.subject chooses on {kind} with a select — a subject's arguments are placeholders, which always choose other` | A subject with a `select` argument |
| `i18n: welcome was not built in fr` | No HTML file (with `output.extension`) was written for that e-mail in that locale |
| `i18n: fr/welcome.html is empty — a tag of its template resolved to no component; list the plugin that brings it, as ui()` | The file holds nothing but its doctype: a tag of the template matched no component, which Vue renders as nothing. With `ui()` listed, the build fails earlier on `ui: <Tag> in <file> is no component`. See [Templates from a package](templates.md#templates-from-a-package) |
| `i18n: ../text/welcome.en.txt was written outside the output folder — the i18n plugin lays out every e-mail; set no plaintext.destination and no output path in a template` | A `plaintext.destination`, or an output path set in a template, put a file outside `output.path` |
| `i18n: custom/welcome.html is not where the i18n plugin puts an e-mail — set no output path in a template` | A file in the output folder that is not `<locale>/<email>` (or `<email>.<locale>` with the flat layout), usually from an output path set in a template |

## The renderer's types — `generated/mail.ts`

After writing the manifest, the build writes the same e-mails and variables
as a TypeScript module, `MailEmails`, for the code that sends:

```ts
import { createMailRenderer } from '@nxgt/mail/renderer';
import type { MailEmails } from './generated/mail';

const mails = createMailRenderer<MailEmails>({ dir: 'dist' });

mails.render('verify-email', { name: 'Ada', link: 'https://app.example.com/verify?token=abc' });
```

For the manifest above, the file holds exactly this:

```ts
// Generated by @nxgt/mail-i18n from the build, after each maizzle build.
// Never edited, never committed: git-ignore it, and build before type-checking.

/** The e-mails of the build, each with the variables it takes when it is sent. */
export interface MailEmails {
	"auth/reset-password": { readonly email: string | number; readonly resetLink: string };
	"verify-email": { readonly link: string; readonly name: string | number };
}
```

| From the manifest | In `MailEmails` |
| --- | --- |
| each key of `emails` | a property, quoted, sorted |
| each name of `variables` | a `readonly` property of that e-mail, in the manifest's order |
| a name also in `urlVariables` | `string`: a URL decides a link's scheme, and `render` checks it as a string |
| any other variable | `string \| number`, as `render` writes it |
| an e-mail with no variable | `Readonly<Record<string, never>>`: `render('welcome')`, with no variables argument |

With it, `render` refuses at compile time an e-mail the build does not have,
a variable the e-mail does not take, a missing one, and a number for a URL —
for a name written as a literal and variables written at the call.
What each refusal looks like, and the untyped default, are in `@nxgt/mail`'s
[Rendering — typing the renderer](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/rendering.md#typing-the-renderer).

### When it is written

- At the end of `maizzle build`, right after `mail-manifest.json`, once per
  build, a parallel one included. `maizzle serve` and `maizzle prepare` do
  not write it.
- **Only over a file it wrote**: one that does not start with its header line,
  `// Generated by @nxgt/mail-i18n from the build`, fails the build and is
  kept — see
  [`i18n: src/index.ts was not written by i18n()`](../troubleshooting.md#i18n-srcindexts-was-not-written-by-i18n--point-renderertypes-at-a-file-of-its-own).
- **Only when its content changed**: a build that changes no e-mail name and
  no variable leaves the file untouched, so an editor or a watcher sees no
  change, and `git status` shows it only when the sending code has something
  to check.
- Its folder is created when missing.

### Git-ignore it, and build before type-checking

The file is output of the build, as `dist/` is, so it is git-ignored, never
committed: a copy in git goes stale the moment a template changes, and each
build rewrites it anyway. Build before type-checking — locally and in CI:

```gitignore
dist
generated
```

```json
{
  "scripts": {
    "typecheck": "maizzle build && tsc --noEmit"
  }
}
```

A fresh clone that type-checks before its first build reports
`Cannot find module './generated/mail'` — see
[troubleshooting](../troubleshooting.md#cannot-find-module-generatedmail-or-its-corresponding-type-declarations).

The `generated/` folder holds generated code, never edited by hand: leave it
out of your formatter and linter, as Biome's `"includes": ["**",
"!**/generated"]` does.

### `rendererTypes` — where, or none

| Value | Effect |
| --- | --- |
| left out | `generated/mail.ts`, resolved against the folder `maizzle` runs in, like `dir` and `emails` |
| `'src/generated/mail.ts'` | That path instead, from the same folder. It must end in `.ts` |
| `'../api/src/generated/mail.ts'` | Outside the project: into the package that sends, in a monorepo where it is not the Maizzle project |
| `false` | No file is written |

```ts
// maizzle.config.ts — next to the code that imports it
import { defineMailConfig } from '@nxgt/mail-config';
import { i18n } from '@nxgt/mail-i18n';

export default defineMailConfig({
	plugins: [i18n({ locales: ['en', 'fr'], rendererTypes: 'src/generated/mail.ts' })],
});
```

Anything else — `true`, an empty string, a path that is not a `.ts` file —
is refused when the config loads with a `TypeError`:
[`i18n: rendererTypes must be the path of a .ts file, as generated/mail.ts, or false`](../troubleshooting.md#i18n-renderertypes-must-be-the-path-of-a-ts-file-as-generatedmailts-or-false).

Use `false` when nothing in TypeScript sends these e-mails, or when two
configs build the same project and one of them already writes the file.

## Checking your application against it

The manifest says what each e-mail needs. The typed renderer above holds the
two sides together at compile time. Without it — the built project in a
package the application only installs, or an application not written in
TypeScript — a test in the application that sends can do the same, so
renaming a placeholder in a template fails a test rather than an e-mail:

```ts
// test/mail-manifest.spec.ts, in the application that sends
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import type { Manifest } from '@nxgt/mail-i18n';

const manifest: Manifest = JSON.parse(
	readFileSync('node_modules/acme-mails/dist/mail-manifest.json', 'utf8'),
);

/** What the application passes for each e-mail it sends. */
const sent: Record<string, readonly string[]> = {
	'verify-email': ['name', 'link'],
	'auth/reset-password': ['email', 'resetLink'],
};

describe('the built e-mails', () => {
	test.each(Object.entries(sent))('%s takes what the application passes', (email, variables) => {
		expect(manifest.emails[email]?.variables).toEqual([...variables].sort());
	});

	test('are built in every locale the application offers', () => {
		expect(manifest.locales).toEqual(expect.arrayContaining(['en', 'fr']));
	});
});
```

`acme-mails` stands for wherever your built project lives: a package of its
own, a folder of the repository, a build artefact.

## Shipping a build in a package

A package can publish its e-mails already built — `mails/`, with its manifest
— so the application that installs it only creates a renderer. The build
decides which `@nxgt/mail` can read it, so the package peers the range whose
renderers read its format, and checks it when it builds:

```json
{
	"name": "acme-mails",
	"files": ["mails"],
	"scripts": {
		"build": "maizzle build && bun run scripts/check-manifest-format.ts"
	},
	"peerDependencies": {
		"@nxgt/mail": ">=0.1.0 <1"
	},
	"devDependencies": {
		"@nxgt/mail": "0.5.1",
		"@nxgt/mail-i18n": "^0.3.0"
	}
}
```

`maizzle.config.ts` writes the build there, with Maizzle's `output.path`:
`defineMailConfig({ output: { path: 'mails' }, plugins: [i18n({ locales:
['en', 'fr'] })] })`. The check reads the format the build wrote, and compares
it with what the oldest `@nxgt/mail` you support reads:

```ts
// scripts/check-manifest-format.ts — after maizzle build, before publishing
import { readFileSync } from 'node:fs';
import { MANIFEST_FILE, MANIFEST_FORMAT, type Manifest } from '@nxgt/mail-i18n';
import { MANIFEST_FORMAT as READABLE } from '@nxgt/mail/renderer'; // the devDependency: the oldest @nxgt/mail supported

const manifest: Manifest = JSON.parse(readFileSync(`mails/${MANIFEST_FILE}`, 'utf8'));

if (manifest.formatVersion !== MANIFEST_FORMAT) {
	throw new Error(`mails/ is manifest format ${manifest.formatVersion}, not ${MANIFEST_FORMAT} — run maizzle build again`);
}
if (manifest.formatVersion > READABLE) {
	throw new Error(
		`mails/ is manifest format ${manifest.formatVersion}; the oldest @nxgt/mail supported reads up to ${READABLE} — raise the @nxgt/mail peer and devDependency`,
	);
}
```

- **The devDependency is the peer's lower bound**, so `MANIFEST_FORMAT` from
  `@nxgt/mail/renderer` is what the oldest renderer an application may install
  reads. `@nxgt/mail` 0.5.0 and earlier do not export it; they read format 1,
  as 0.5.1 does, so a format-1 build pins 0.5.1 and still peers
  `>=0.1.0 <1`.
- **When `@nxgt/mail-i18n` writes a new format**, the second check fails the
  build: raise the peer's lower bound, and the devDependency with it, to the
  first `@nxgt/mail` that reads it.
- **The first check** catches a `mails/` folder left from another build, made
  before `@nxgt/mail-i18n` was upgraded.

## See also

- [Rendering](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/rendering.md) in `@nxgt/mail` — the renderer that reads the manifest at send time, and the formats it reads.
- [Templates](templates.md) — where placeholders come from.
- [Catalogues](catalogues.md#the-subject) — the subject of each e-mail.
