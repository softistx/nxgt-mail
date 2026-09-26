import {
	type CompileMessagesOptions,
	compileMessages,
} from '../messages/compile';
import { emitMails } from './emit';
import { type EmailPlan, type MailProp, planEmail } from './plan';

export type { MailProp } from './plan';

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

	const plans: EmailPlan[] = [];
	const workspace = await openWorkspace();
	try {
		// One at a time: each render starts and stops a Vite server of its own.
		for (const template of templates) {
			const rendered = await renderTemplate(template, workspace.dir);
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
