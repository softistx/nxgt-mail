import {
	type CompileMessagesOptions,
	compileMessages,
} from '../messages/compile';
import type { Theme } from '../presets';
import { emitMails } from './emit';
import { type EmailPlan, type MailProp, planEmail } from './plan';

export type { MailProp } from './plan';

import { templateError } from './error';
import { renderTemplate } from './render';
import { readTemplate } from './sfc';
import { openWorkspace } from './workspace';

/** A template file: its name, as `verify-email.vue`, and its source. */
export interface TemplateFile {
	readonly file: string;
	readonly source: string;
}

export interface CompileMailOptions extends CompileMessagesOptions {
	/** One single-file component per e-mail. */
	readonly templates: readonly TemplateFile[];
	/**
	 * The components the templates may use beside Maizzle's, by file name:
	 * `{ 'Transactional.vue': source }`. Presets merged, as `resolvePresets`
	 * answers them.
	 */
	readonly components?: Readonly<Record<string, string>>;
	/** The Tailwind tokens written to `theme.css`, which a layout imports. */
	readonly theme?: Theme;
}

/** One e-mail of a compiled module. */
export interface CompiledEmail {
	/** As `verifyEmail`: the key of `mails`. */
	readonly name: string;
	/** As `verify-email.vue`. */
	readonly file: string;
	/** Its props, by name, sorted. */
	readonly props: ReadonlyMap<string, MailProp>;
}

export interface CompiledMail {
	/** The TypeScript module: the messages, `t`, and `mails`. */
	readonly module: string;
	/** The e-mails it renders, sorted by name. */
	readonly emails: readonly CompiledEmail[];
}

/**
 * Compiles catalogues and templates into one TypeScript module: `t` and the
 * typed messages, and `mails` — one render function per template, which
 * imports nothing and renders with no engine.
 *
 * Each template is rendered once by Maizzle, every value a placeholder, and
 * split at the placeholders; the render function joins the chunks with the
 * escaped values. A template the build cannot reproduce safely, a key or an
 * argument the catalogues do not hold, or an e-mail with no subject fails the
 * build with a {@link MailBuildError}.
 */
export async function compileMail(
	options: CompileMailOptions,
): Promise<CompiledMail> {
	const messages = compileMessages(options);
	const templates = [...options.templates]
		.sort((a, b) => a.file.localeCompare(b.file))
		.map(({ file, source }) => readTemplate(file, source));
	const byEmail = new Map<string, string>();
	for (const template of templates) {
		const other = byEmail.get(template.email);
		if (other !== undefined) {
			throw templateError(
				'TEMPLATE_INVALID',
				template.file,
				`is the e-mail ${template.email}, as ${other} is — rename one of them`,
			);
		}
		byEmail.set(template.email, template.file);
	}

	const plans: EmailPlan[] = [];
	const workspace = await openWorkspace({
		...(options.theme === undefined ? {} : { theme: options.theme }),
		...(options.components === undefined
			? {}
			: { components: options.components }),
	});
	try {
		// One at a time: each render starts and stops a Vite server of its own.
		for (const template of templates) {
			const rendered = await renderTemplate(template, workspace);
			plans.push(
				planEmail({
					template,
					rendered,
					args: messages.args,
					fallbackLocale: options.fallbackLocale,
				}),
			);
		}
	} finally {
		await workspace.close();
	}

	return {
		module: `${messages.module}\n${emitMails(plans)}`,
		emails: plans
			.map((plan) => ({ name: plan.email, file: plan.file, props: plan.props }))
			.sort((a, b) => a.name.localeCompare(b.name)),
	};
}
