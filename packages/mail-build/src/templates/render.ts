import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { render } from '@maizzle/framework';
import type { App } from 'vue';
import { MailBuildError } from '../errors';
import { templateError } from './error';
import type { TemplateSource } from './sfc';
import type { RenderWorkspace } from './workspace';

/** A `t()` call of a template: its key, and the prop behind each argument. */
export interface MessageCall {
	readonly key: string;
	/** Argument name → the prop passed to it. */
	readonly args: ReadonlyMap<string, string>;
}

/** What a placeholder stands for. */
export type Token =
	| { readonly kind: 'prop'; readonly prop: string }
	| { readonly kind: 'message'; readonly call: number }
	| { readonly kind: 'lang' };

/** A template rendered once, every value a placeholder. */
export interface RenderedTemplate {
	readonly html: string;
	readonly text: string;
	readonly calls: readonly MessageCall[];
	/** Matches every placeholder; group 1 is `P`, `M` or `L`, group 2 its index. */
	readonly placeholder: RegExp;
	/** The placeholder `match` stands for. */
	token(match: RegExpExecArray): Token;
}

/** Placeholders of one render: letters and digits, with a nonce. */
class Placeholders {
	private readonly nonce = randomUUID().replace(/-/g, '').slice(0, 12);
	readonly pattern = new RegExp(`Q${this.nonce}([PML])(\\d+)Q`, 'g');

	mark(kind: 'P' | 'M' | 'L', index: number): string {
		return `Q${this.nonce}${kind}${index}Q`;
	}

	/** How many placeholders `output` holds whole, and how many were started. */
	integrity(output: string): {
		readonly whole: number;
		readonly started: number;
	} {
		return {
			whole: output.match(this.pattern)?.length ?? 0,
			started: output.split(`Q${this.nonce}`).length - 1,
		};
	}
}

/**
 * Records each `t()` call a render makes, and answers a placeholder for it.
 * An argument must be a prop's placeholder: anything else is a value the
 * build would freeze into every e-mail.
 */
function messageRecorder(template: TemplateSource, marks: Placeholders) {
	const byPlaceholder = new Map(
		template.props.map((prop, index) => [marks.mark('P', index), prop]),
	);
	const calls: MessageCall[] = [];
	const t = (key: unknown, args?: unknown): string => {
		if (typeof key !== 'string') {
			throw templateError(
				'TEMPLATE_UNSUPPORTED',
				template.file,
				't() takes a string key',
			);
		}
		const bound = new Map<string, string>();
		for (const [name, value] of Object.entries(
			(args ?? {}) as Record<string, unknown>,
		)) {
			const prop =
				typeof value === 'string' ? byPlaceholder.get(value) : undefined;
			if (prop === undefined) {
				throw templateError(
					'TEMPLATE_ARGUMENT_MISSING',
					template.file,
					`t('${key}') passes {${name}} a value that is not a prop`,
					key,
				);
			}
			bound.set(name, prop);
		}
		calls.push({ key, args: bound });
		return marks.mark('M', calls.length - 1);
	};
	return { t, calls };
}

// Vue warns, and renders on, where the build must stop: an element the
// template names that no component answers disappears from the e-mail.
const UNRESOLVED = /Failed to resolve component: (\S+)/;

/** Runs Maizzle on the template file, from the render workspace. */
async function runMaizzle(
	template: TemplateSource,
	workspace: RenderWorkspace,
	props: Record<string, string>,
	globals: Record<string, unknown>,
): Promise<{ readonly html: string; readonly text: string }> {
	const warnings: string[] = [];
	const capture = {
		install(app: App) {
			app.config.warnHandler = (message) => {
				warnings.push(message);
			};
		},
	};
	let rendered: { readonly html: string; readonly plaintext?: string };
	try {
		// Rendered from a file, so Tailwind scans that file alone for classes;
		// `root` is the workspace, and the presets' components its only
		// source, so a `components/` folder in the working directory never
		// replaces Maizzle's components.
		const path = join(workspace.dir, template.file);
		await writeFile(path, template.source);
		rendered = await render(path, {
			root: workspace.dir,
			components: { source: [workspace.components] },
			props,
			vue: { globalProperties: globals, plugins: [capture] },
			plaintext: true,
		});
	} catch (cause) {
		if (cause instanceof MailBuildError) throw cause;
		throw new MailBuildError(
			'TEMPLATE_INVALID',
			`templates: ${template.file}: Maizzle could not render it (${cause instanceof Error ? cause.message : String(cause)})`,
			{ template: template.file, cause },
		);
	}
	for (const warning of warnings) {
		const component = UNRESOLVED.exec(warning);
		if (component !== null) {
			throw templateError(
				'TEMPLATE_INVALID',
				template.file,
				`uses <${component[1]}>, which is not a component — check its name`,
			);
		}
	}
	return { html: rendered.html, text: rendered.plaintext ?? '' };
}

/** Checks that Maizzle kept every value, whole, and compiled the CSS. */
function checkOutput(
	template: TemplateSource,
	marks: Placeholders,
	calls: readonly MessageCall[],
	output: { readonly html: string; readonly text: string },
): void {
	const fail = (what: string) =>
		templateError('TEMPLATE_UNSUPPORTED', template.file, what);
	// Maizzle swallows a Tailwind failure and leaves the CSS as written.
	if (/@import\s+["']@maizzle\/tailwindcss|@apply\s/.test(output.html)) {
		throw templateError(
			'TEMPLATE_INVALID',
			template.file,
			'Tailwind did not compile its CSS — @import or @apply left in the output',
		);
	}
	for (const part of [output.html, output.text]) {
		const { whole, started } = marks.integrity(part);
		if (whole !== started) {
			throw fail(
				'a value was changed while rendering — a component or a transformer rewrote it',
			);
		}
	}
	calls.forEach((call, index) => {
		if (!output.html.includes(marks.mark('M', index))) {
			throw fail(
				`t('${call.key}') is not in the output — a component dropped it, or used it at build time`,
			);
		}
	});
	template.props.forEach((prop, index) => {
		const written = template.written.get(prop) ?? 0;
		if (output.html.split(marks.mark('P', index)).length - 1 < written) {
			throw fail(
				`the prop ${prop} is not in the output — a component dropped it, or used it at build time (as a QR code does)`,
			);
		}
	});
}

/**
 * Renders a template once with Maizzle — Tailwind compiled, CSS inlined, the
 * plain text derived — every prop, every message and the language replaced by
 * a placeholder: letters and digits only, which nothing on the way escapes or
 * rewrites. A nonce makes a placeholder impossible to write by accident.
 */
export async function renderTemplate(
	template: TemplateSource,
	workspace: RenderWorkspace,
): Promise<RenderedTemplate> {
	const marks = new Placeholders();
	const { t, calls } = messageRecorder(template, marks);
	const output = await runMaizzle(
		template,
		workspace,
		Object.fromEntries(
			template.props.map((prop, index) => [prop, marks.mark('P', index)]),
		),
		{ t, lang: marks.mark('L', 0) },
	);
	checkOutput(template, marks, calls, output);

	return {
		...output,
		calls,
		placeholder: marks.pattern,
		token(match) {
			const index = Number(match[2]);
			if (match[1] === 'M') return { kind: 'message', call: index };
			if (match[1] === 'L') return { kind: 'lang' };
			return { kind: 'prop', prop: template.props[index] ?? '' };
		},
	};
}
