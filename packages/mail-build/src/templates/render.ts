import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { render } from '@maizzle/framework';
import { MailBuildError } from '../errors';
import type { TemplateSource } from './sfc';

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

function unsupported(template: TemplateSource, what: string): MailBuildError {
	return new MailBuildError(
		'TEMPLATE_UNSUPPORTED',
		`templates: ${template.file}: ${what}`,
		{ template: template.file },
	);
}

/**
 * Renders a template once with Maizzle — Tailwind compiled, CSS inlined, the
 * plain text derived — every prop, every message and the language replaced by
 * a placeholder: letters and digits only, which nothing on the way escapes or
 * rewrites. A nonce makes a placeholder impossible to write by accident.
 */
export async function renderTemplate(
	template: TemplateSource,
	workspace: string,
): Promise<RenderedTemplate> {
	const nonce = randomUUID().replace(/-/g, '').slice(0, 12);
	const mark = (kind: 'P' | 'M' | 'L', index: number) =>
		`Q${nonce}${kind}${index}Q`;
	const byPlaceholder = new Map(
		template.props.map((prop, index) => [mark('P', index), prop]),
	);

	const calls: MessageCall[] = [];
	const t = (key: unknown, args?: unknown): string => {
		if (typeof key !== 'string') {
			throw unsupported(template, 't() takes a string key');
		}
		const bound = new Map<string, string>();
		for (const [name, value] of Object.entries(
			(args ?? {}) as Record<string, unknown>,
		)) {
			const prop =
				typeof value === 'string' ? byPlaceholder.get(value) : undefined;
			if (prop === undefined) {
				throw new MailBuildError(
					'TEMPLATE_ARGUMENT_MISSING',
					`templates: ${template.file}: t('${key}') passes {${name}} a value that is not a prop`,
					{ template: template.file, key },
				);
			}
			bound.set(name, prop);
		}
		calls.push({ key, args: bound });
		return mark('M', calls.length - 1);
	};

	let rendered: { readonly html: string; readonly plaintext?: string };
	try {
		// Rendered from a file, so Tailwind scans that file alone for classes.
		const path = join(workspace, template.file);
		await writeFile(path, template.source);
		rendered = await render(path, {
			props: Object.fromEntries(
				template.props.map((prop, index) => [prop, mark('P', index)]),
			),
			vue: { globalProperties: { t, lang: mark('L', 0) } },
			plaintext: true,
		} as Parameters<typeof render>[1]);
	} catch (cause) {
		if (cause instanceof MailBuildError) throw cause;
		throw new MailBuildError(
			'TEMPLATE_INVALID',
			`templates: ${template.file}: Maizzle could not render it (${cause instanceof Error ? cause.message : String(cause)})`,
			{ template: template.file, cause },
		);
	}

	const html = rendered.html;
	const text = rendered.plaintext ?? '';
	// Maizzle swallows a Tailwind failure and leaves the CSS as written.
	if (/@import\s+["']@maizzle\/tailwindcss|@apply\s/.test(html)) {
		throw new MailBuildError(
			'TEMPLATE_INVALID',
			`templates: ${template.file}: Tailwind did not compile its CSS — @import or @apply left in the output`,
			{ template: template.file },
		);
	}
	const placeholder = new RegExp(`Q${nonce}([PML])(\\d+)Q`, 'g');
	// A placeholder the pipeline cut or changed would drop a value silently.
	for (const output of [html, text]) {
		const whole = output.match(placeholder)?.length ?? 0;
		const started = output.split(`Q${nonce}`).length - 1;
		if (whole !== started) {
			throw unsupported(
				template,
				'a value was changed while rendering — a component or a transformer rewrote it',
			);
		}
	}

	return {
		html,
		text,
		calls,
		placeholder,
		token(match) {
			const index = Number(match[2]);
			if (match[1] === 'M') return { kind: 'message', call: index };
			if (match[1] === 'L') return { kind: 'lang' };
			return { kind: 'prop', prop: template.props[index] ?? '' };
		},
	};
}
