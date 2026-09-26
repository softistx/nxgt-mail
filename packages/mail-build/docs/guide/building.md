# Building

This page is for running the build: the `mail.config.ts` it reads, the
`nxgt-mail build` and `nxgt-mail dev` commands, and the functions behind them
for a script or a test of your own.

```ts
// mail.config.ts
import { defineMailConfig } from '@nxgt/mail-build';

export default defineMailConfig({
	locales: ['en', 'fr'],
	fallbackLocale: 'en',
});
```

```text
emails/
  verify-email.vue      one template per e-mail — see Templates
messages/
  en.json               one catalogue per locale — see Catalogues
  fr.json
mail.config.ts
```

```sh
bunx nxgt-mail build
# nxgt-mail: wrote src/generated/mail.ts — 1 e-mail(s): verifyEmail (1204 ms)
```

```ts
import { mails } from './generated/mail';
```

Writing the templates is in [Templates](templates.md), the catalogues in
[Catalogues](catalogues.md), and what the module exports in
[The generated module](generated-module.md).

## The config — `defineMailConfig`

`defineMailConfig` only types the object: it answers it unchanged.

```ts
function defineMailConfig(config: MailConfig): MailConfig;

interface MailConfig {
	readonly locales: readonly string[];
	readonly fallbackLocale: string;
	readonly emails?: string;
	readonly messages?: string;
	readonly out?: string;
}
```

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `locales` | `readonly string[]` | required | Every locale the build supports, as BCP 47 tags (`en`, `pt-BR`), in the order of the generated `locales` |
| `fallbackLocale` | `string` | required | One of `locales`: the reference every other catalogue is checked against, and the source of every argument's type |
| `emails` | `string` | `'emails'` | The folder of the templates, one `.vue` per e-mail |
| `messages` | `string` | `'messages'` | The folder of the catalogues, one `<locale>.json` per locale |
| `out` | `string` | `'src/generated/mail.ts'` | The generated module |

The paths are relative to **the config's folder**, wherever the command runs
from. A project that keeps its e-mails under `src/mail/`:

```ts
// mail.config.ts
import { defineMailConfig } from '@nxgt/mail-build';

export default defineMailConfig({
	locales: ['en', 'fr', 'pt-BR'],
	fallbackLocale: 'en',
	emails: 'src/mail/templates',
	messages: 'src/mail/messages',
	out: 'src/mail/generated/mail.ts',
});
```

Keep the module in a folder named `generated/`, and that folder out of your
linter and your coverage. The config is loaded as TypeScript by the CLI, with
no build step of yours; it must be the **default** export — a named export
fails with `build: locales must be a list of locales, as ['en', 'fr']`.
`build`, `compileProject` and `dev` check the config before using it, since
it is data you wrote, possibly in JavaScript:

| Mistake | `TypeError` message |
| --- | --- |
| The config is not an object | `build: the config must be an object — export default defineMailConfig({ … })` |
| `locales` is not a list of strings, or the config is not the default export | `build: locales must be a list of locales, as ['en', 'fr']` |
| `fallbackLocale` is not a string | `build: fallbackLocale must be one of locales, as 'en'` |
| `emails`, `messages` or `out` is not a string | `build: out must be a path, or left out` |

## The CLI — `nxgt-mail`

```text
Usage: nxgt-mail <command> [options]

Commands:
  build   Compile the templates and catalogues into the generated module
  dev     Render every e-mail in every locale to a folder, to look at

Options:
  -c, --config <file>  The config file (default: mail.config.ts, .mts, .js or .mjs)
  -o, --out <dir>      dev: the preview folder (default: .nxgt-mail)
  -h, --help           Show this help
```

Without `--config`, it looks in the current directory for `mail.config.ts`,
then `mail.config.mts`, `mail.config.js` and `mail.config.mjs`. With it, the
file may be anywhere, and its paths are still read from its own folder:

```sh
bunx nxgt-mail build --config packages/notifications/mail.config.ts
```

In `package.json`, so the module exists before your code compiles:

```json
{
	"scripts": {
		"mail": "nxgt-mail build",
		"typecheck": "nxgt-mail build && tsc --noEmit",
		"test": "nxgt-mail build && bun test"
	}
}
```

| Outcome | Output | Exit code |
| --- | --- | --- |
| Built, module changed | `nxgt-mail: wrote src/generated/mail.ts — 2 e-mail(s): orderPlaced, verifyEmail (1856 ms)` on stdout | `0` |
| Built, module unchanged — not written again | `nxgt-mail: unchanged src/generated/mail.ts — …` | `0` |
| Previews written | `nxgt-mail: 5 file(s) in .nxgt-mail — open index.html` | `0` |
| A `MailBuildError`, or a wiring mistake | Its message alone, on stderr — `templates: verify-email.vue: t('verifyEmail.acton') is not a key of en, the fallback locale` | `1` |
| No config found | `nxgt-mail: no config — write mail.config.ts, or pass --config <file>` | `1` |
| `--config` names a file that does not exist | `nxgt-mail: missing.ts does not exist` | `1` |
| An unknown command | `nxgt-mail: unknown command <name>`, then the usage | `1` |
| An unknown option | `nxgt-mail: Unknown option '--bogus'. …`, then the usage | `1` |
| `--out` given to `build` | `nxgt-mail: --out is for dev — build writes where the config's out says`, then the usage | `1` |
| No command | The usage | `1` |
| `--help` | The usage | `0` |

A build that fails writes nothing: the module you had stays as it was. Any
other error is printed with its stack — a bug, or a file the build could not
read. `build` always writes where the config's `out` says; `--out` is only for
`dev`.

## `build(config, options)`

What `nxgt-mail build` runs, for a script of your own:

```ts
import { build } from '@nxgt/mail-build';
import config from './mail.config';

const result = await build(config, { root: import.meta.dirname });

result.out; // '/home/ada/shop/src/generated/mail.ts' — absolute
result.written; // false when the module was already up to date
result.emails.map((email) => email.name); // ['orderPlaced', 'verifyEmail']
```

```ts
function build(config: MailConfig, options?: BuildOptions): Promise<BuildResult>;

interface BuildOptions {
	/** The folder the config's paths are relative to. Default: the working directory. */
	readonly root?: string;
}

interface BuildResult {
	readonly out: string;
	readonly written: boolean;
	readonly emails: readonly CompiledEmail[];
}
```

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `root` | `string` | `process.cwd()` | The folder `emails`, `messages` and `out` are resolved against. The CLI passes the config's folder |

The module is compared with the file already at `out`, and written — with its
folder — only when it differs, so a watcher or a bundler sees no change when
there is none. It throws what the build throws: a `MailBuildError`, or a
`TypeError` for a wiring mistake (see [What fails](#what-fails)).

### `CompiledEmail` — what was built

```ts
interface CompiledEmail {
	/** As `verifyEmail`: the key of `mails`. */
	readonly name: string;
	/** As `verify-email.vue`. */
	readonly file: string;
	/** Its props, by name, sorted. */
	readonly props: ReadonlyMap<string, MailProp>;
}

interface MailProp {
	readonly kind: ArgumentKind; // 'string' | 'number' | 'date'
	/** Checked as a URL at call time: 'link' (href) also allows mailto:, 'resource' (src) does not. */
	readonly url: 'link' | 'resource' | null;
}
```

```ts
import { build } from '@nxgt/mail-build';
import config from './mail.config';

const { emails } = await build(config, { root: import.meta.dirname });
const verifyEmail = emails.find((email) => email.name === 'verifyEmail');

Object.fromEntries(verifyEmail?.props ?? []);
// { hours: { kind: 'number', url: null }, link: { kind: 'string', url: 'link' }, name: { kind: 'string', url: null } }
```

### A check in CI — the committed module is up to date

When the module is committed, `written` tells a CI job that someone changed a
template or a catalogue and did not build:

```ts
// scripts/check-mail.ts — bun run scripts/check-mail.ts
import { build } from '@nxgt/mail-build';
import config from '../mail.config';

const { out, written } = await build(config, { root: `${import.meta.dirname}/..` });
if (written) {
	console.error(`${out} was out of date — run nxgt-mail build and commit it`);
	process.exit(1);
}
```

## `compileProject(config, options)`

Reads and compiles like `build`, and writes nothing: it answers the module as
a string, with the e-mails.

```ts
import { compileProject } from '@nxgt/mail-build';
import config from './mail.config';

const { module, emails } = await compileProject(config, { root: import.meta.dirname });
```

```ts
function compileProject(config: MailConfig, options?: BuildOptions): Promise<CompiledMail>;

interface CompiledMail {
	/** The TypeScript module: the messages, `t`, and `mails`. */
	readonly module: string;
	/** The e-mails it renders, sorted by name. */
	readonly emails: readonly CompiledEmail[];
}
```

A spec that compiles the project fails CI on a broken template or catalogue
before anything else runs, with the file and the key in the report:

```ts
import { expect, it } from 'bun:test';
import { compileProject } from '@nxgt/mail-build';
import config from '../mail.config';

it('compiles every template and catalogue', async () => {
	const { emails } = await compileProject(config, { root: `${import.meta.dirname}/..` });

	expect(emails.map((email) => email.name)).toContain('verifyEmail');
}, 30_000);
```

Each template renders with Maizzle, half a second to a second each: give the
spec a timeout to match.

## `compileMail(options)` — without files

The compiler under `compileProject`: catalogues and templates as values, from
wherever you keep them. `sources` is a list of catalogues by locale, earliest
first — a preset's, then yours — merged as described in
[Catalogues](catalogues.md#merging-sources--presets-then-the-application).

```ts
import { compileMail } from '@nxgt/mail-build';

const { module, emails } = await compileMail({
	locales: ['en'],
	fallbackLocale: 'en',
	sources: [
		{ name: 'shared', catalogues: { en: { common: { signOff: 'The team' } } } },
		{
			name: 'messages/',
			catalogues: { en: { welcome: { subject: 'Welcome, {name}', body: 'Hello {name}.' } } },
		},
	],
	templates: [
		{
			file: 'welcome.vue',
			source: `<script setup>
defineProps(['name']);
</script>
<template>
  <Layout :lang="lang">
    <Text>{{ t('welcome.body', { name }) }}</Text>
    <Text>{{ t('common.signOff') }}</Text>
  </Layout>
</template>
`,
		},
	],
});
```

```ts
function compileMail(options: CompileMailOptions): Promise<CompiledMail>;

interface CompileMailOptions extends CompileMessagesOptions {
	/** One single-file component per e-mail. */
	readonly templates: readonly TemplateFile[];
}

/** A template file: its name, as `verify-email.vue`, and its source. */
interface TemplateFile {
	readonly file: string;
	readonly source: string;
}
```

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `locales` | `readonly string[]` | required | As in the config |
| `fallbackLocale` | `string` | required | As in the config |
| `sources` | `readonly MessageSource[]` | required | Catalogues by locale, earliest first; `name` appears in the errors |
| `templates` | `readonly TemplateFile[]` | required | The templates; `file` names the e-mail and appears in the errors |

The module is deterministic: the same catalogues and templates give the same
string.

## Previews — `nxgt-mail dev`

Renders every e-mail in every locale, with a sample value for each prop, so
you can look at them in a browser:

```sh
bunx nxgt-mail dev
# nxgt-mail: 9 file(s) in .nxgt-mail — open index.html
```

```text
.nxgt-mail/
  index.html              a table: e-mail, locale, subject, links to both parts
  order-placed.en.html
  order-placed.en.txt     "Subject: Order [reference] confirmed", a blank line, then the text
  order-placed.fr.html
  …
```

| A prop that is | Previewed with |
| --- | --- |
| a URL (`href`, `src`) | `https://example.com/<prop>` |
| a `number` | `3` |
| a `Date` | `2026-01-15T09:30:00Z`, written in UTC |
| a `string` | `[<prop>]`, as `[name]` |

It compiles exactly as `build` does, and fails the same way, but it **does not
write `out`**. `--out <dir>` (`-o`) writes the previews elsewhere, relative to
the config's folder. Add the folder to `.gitignore`.

```ts
function dev(config: MailConfig, options?: DevOptions): Promise<DevResult>;

interface DevOptions extends BuildOptions {
	/** Where the previews go, relative to `root`. Default `.nxgt-mail`. */
	readonly outDir?: string;
}

interface DevResult {
	/** The absolute path of the preview folder; `index.html` lists every file. */
	readonly outDir: string;
	/** Every file written, relative to `outDir`. */
	readonly files: readonly string[];
}
```

```ts
import { dev } from '@nxgt/mail-build';
import config from './mail.config';

const { outDir, files } = await dev(config, { root: import.meta.dirname, outDir: 'previews' });
// files: ['order-placed.en.html', 'order-placed.en.txt', …, 'index.html']
```

## What fails

A build that cannot be right throws a `MailBuildError` and writes nothing. Its
`message` names the file, the locale and the key; its fields hold them:

```ts
class MailBuildError extends Error {
	name: string; // 'MailBuildError'
	readonly code: MailBuildErrorCode;
	/** The template, as `verify-email.vue`, when the problem is in one. */
	readonly template: string | undefined;
	/** The locale, when the problem is in one. */
	readonly locale: string | undefined;
	/** The dotted key, when there is one. */
	readonly key: string | undefined;
}
```

```ts
import { build, MailBuildError } from '@nxgt/mail-build';
import config from './mail.config';

try {
	await build(config, { root: import.meta.dirname });
} catch (error) {
	if (!(error instanceof MailBuildError)) throw error;
	console.error(error.code, error.template, error.key);
	// TEMPLATE_KEY_UNKNOWN verify-email.vue verifyEmail.acton
	process.exit(1);
}
```

The codes of the catalogues are listed in
[Catalogues](catalogues.md#what-fails-the-build), those of the templates in
[Templates](templates.md). A mistake in how the build is **wired** is a bare
`TypeError`:

| Mistake | `TypeError` message |
| --- | --- |
| The config is malformed | `build: the config must be an object …`, `build: locales must be …`, `build: fallbackLocale must be …`, `build: <name> must be a path, or left out` — see [The config](#the-config--definemailconfig) |
| The templates folder does not exist | `build: /home/ada/shop/emails does not exist — put one .vue template per e-mail there, or set emails in the config` |
| The templates folder holds no `.vue` file | `build: /home/ada/shop/emails holds no .vue template — put one per e-mail there` |
| The messages folder holds no `<locale>.json` for any locale, or does not exist | `build: /home/ada/shop/messages holds no catalogue — write one <locale>.json per locale there, or set messages in the config` |
| No config file found (CLI) | `nxgt-mail: no config — write mail.config.ts, or pass --config <file>` |
| `--config` names a missing file (CLI) | `nxgt-mail: missing.ts does not exist` |
| `locales: []` | `compileMessages: locales must hold at least one locale` |
| `locales: ['en', 'en']` | `compileMessages: locales holds the same locale twice` |
| `fallbackLocale` not in `locales` | `compileMessages: fallbackLocale must be one of locales` |
| `locales: ['en_US']` | `compileMessages: en_US is not a locale — write it as a BCP 47 tag, as en or pt-BR` |

A messages folder that holds the fallback locale's catalogue but not another
locale's is not a wiring mistake: that locale is read as empty, and the build
fails with `KEY_MISSING` for its first key.

Every message, with its cause and its fix, is in
[Troubleshooting](../troubleshooting.md).
