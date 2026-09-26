# The manifest

This page is for reading `dist/mail-manifest.json`, the file `maizzle build`
writes for the code that sends: which e-mails were built, in which locales,
with which placeholders, under which subject.

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
interface Manifest {
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

### `variables`

Collected from the built files, not from the template's source: every
`{{ name }}` the build left in the HTML of each locale, in its text part, and
in each subject. A placeholder only in the text part, inside a Maizzle
`<Plaintext>` block, is listed. So is a placeholder that only one locale
writes. A value the
template formatted at build time (`t('verifyEmail.expires', { minutes: 15 })`)
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
turned into a placeholder. `verifyEmail.subject` is
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
| `i18n: fr/welcome.html is empty — a tag of its template resolved to no component; list the plugin that brings it, as ui()` | The file holds nothing but its doctype: a tag of the template matched no component, which Vue renders as nothing. See [Templates from a package](templates.md#templates-from-a-package) |
| `i18n: ../text/welcome.en.txt was written outside the output folder — the i18n plugin lays out every e-mail; set no plaintext.destination and no output path in a template` | A `plaintext.destination`, or an output path set in a template, put a file outside `output.path` |
| `i18n: custom/welcome.html is not where the i18n plugin puts an e-mail — set no output path in a template` | A file in the output folder that is not `<locale>/<email>` (or `<email>.<locale>` with the flat layout), usually from an output path set in a template |

## Checking your application against it

The manifest says what each e-mail needs. A test in the application that
sends can hold the two sides together, so renaming a placeholder in a
template fails a test rather than an e-mail:

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

## See also

- [Rendering](https://github.com/softistx/nxgt-mail/blob/develop/packages/mail/docs/guide/rendering.md) in `@nxgt/mail` — the renderer that reads the manifest at send time.
- [Templates](templates.md) — where placeholders come from.
- [Catalogues](catalogues.md#the-subject) — the subject of each e-mail.
