import type { ArgumentKind } from '../messages/analyse';
import { templateError } from './error';
import type { MessageCall, RenderedTemplate } from './render';
import type { TemplateSource } from './sfc';
import { type Segment, splitHtml, splitText } from './split';

/** A prop of an e-mail, typed: an argument of its render function. */
export interface MailProp {
	readonly kind: ArgumentKind;
	/** Checked as a URL at call time: `link` also allows `mailto:`. */
	readonly url: 'link' | 'resource' | null;
}

/** Everything the emitter needs to write one render function. */
export interface EmailPlan {
	readonly email: string;
	readonly file: string;
	/** Every prop, sorted by name. */
	readonly props: ReadonlyMap<string, MailProp>;
	readonly calls: readonly MessageCall[];
	readonly subject: MessageCall;
	readonly html: readonly Segment[];
	readonly text: readonly Segment[];
}

interface Use {
	readonly kind: ArgumentKind | 'direct' | 'link' | 'resource';
	/** How the use reads in an error: `in t('verifyEmail.body')`. */
	readonly where: string;
}

const KIND_NAME: Readonly<Record<Use['kind'], string>> = {
	string: 'a string',
	number: 'a number',
	date: 'a date',
	direct: 'written as is',
	link: 'a link',
	resource: 'a resource URL',
};

function checkCall(
	template: TemplateSource,
	call: MessageCall,
	declared: ReadonlyMap<string, ArgumentKind> | undefined,
	fallbackLocale: string,
	uses: Map<string, Use[]>,
): void {
	if (declared === undefined) {
		throw templateError(
			'TEMPLATE_KEY_UNKNOWN',
			template.file,
			`t('${call.key}') is not a key of ${fallbackLocale}, the fallback locale`,
			call.key,
		);
	}
	for (const name of [...declared.keys()].sort()) {
		if (!call.args.has(name)) {
			throw templateError(
				'TEMPLATE_ARGUMENT_MISSING',
				template.file,
				`t('${call.key}') leaves out {${name}}, which ${fallbackLocale} declares — pass it a prop`,
				call.key,
			);
		}
	}
	for (const [name, prop] of call.args) {
		const kind = declared.get(name);
		if (kind === undefined) {
			throw templateError(
				'TEMPLATE_ARGUMENT_UNKNOWN',
				template.file,
				`t('${call.key}') passes {${name}}, which ${fallbackLocale} does not declare`,
				call.key,
			);
		}
		const list = uses.get(prop) ?? [];
		list.push({ kind, where: `in t('${call.key}')` });
		uses.set(prop, list);
	}
}

function useSegments(segments: readonly Segment[], uses: Map<string, Use[]>) {
	for (const segment of segments) {
		if (segment.kind !== 'prop') continue;
		const kind =
			segment.context === 'link' || segment.context === 'resource'
				? segment.context
				: 'direct';
		const list = uses.get(segment.prop) ?? [];
		list.push({ kind, where: 'in the template' });
		uses.set(segment.prop, list);
	}
}

const kindOf = (use: Use): ArgumentKind | null =>
	use.kind === 'direct'
		? null
		: use.kind === 'link' || use.kind === 'resource'
			? 'string'
			: use.kind;

/**
 * The type of a prop from all its uses. Two typed uses must agree; a prop
 * written as is may be a string or a number, never a date.
 */
function planProp(
	template: TemplateSource,
	prop: string,
	uses: readonly Use[],
): MailProp {
	const mismatch = (a: Use, b: Use) =>
		templateError(
			'ARGUMENT_TYPE_MISMATCH',
			template.file,
			`the prop ${prop} is ${KIND_NAME[a.kind]} ${a.where}, and ${KIND_NAME[b.kind]} ${b.where}`,
		);
	const typed = uses.filter((use) => kindOf(use) !== null);
	const first = typed[0];
	const kind = first === undefined ? 'string' : (kindOf(first) ?? 'string');
	for (const use of typed) {
		if (first !== undefined && kindOf(use) !== kind) throw mismatch(first, use);
	}
	const direct = uses.find((use) => use.kind === 'direct');
	if (kind === 'date' && first !== undefined && direct !== undefined) {
		throw mismatch(first, direct);
	}
	// A prop in both a `src` and an `href` is held to the stricter check.
	const url = uses.some((use) => use.kind === 'resource')
		? 'resource'
		: uses.some((use) => use.kind === 'link')
			? 'link'
			: null;
	return { kind, url };
}

/**
 * Checks a rendered template against the catalogues — every key known, every
 * argument passed, no argument invented, the subject present — and types
 * each prop from the ways it is used.
 */
export function planEmail(options: {
	readonly template: TemplateSource;
	readonly rendered: RenderedTemplate;
	readonly args: ReadonlyMap<string, ReadonlyMap<string, ArgumentKind>>;
	readonly fallbackLocale: string;
}): EmailPlan {
	const { template, rendered, args, fallbackLocale } = options;
	const uses = new Map<string, Use[]>();

	for (const call of rendered.calls) {
		checkCall(template, call, args.get(call.key), fallbackLocale, uses);
	}

	const subjectKey = `${template.email}.subject`;
	const subjectArgs = args.get(subjectKey);
	if (subjectArgs === undefined) {
		throw templateError(
			'SUBJECT_MISSING',
			template.file,
			`the e-mail ${template.email} has no subject — add ${subjectKey} to ${fallbackLocale}, the fallback locale`,
			subjectKey,
		);
	}
	for (const name of subjectArgs.keys()) {
		if (!template.props.includes(name)) {
			throw templateError(
				'TEMPLATE_ARGUMENT_MISSING',
				template.file,
				`${subjectKey} uses {${name}}, which is not a prop of the template — declare it with defineProps`,
				subjectKey,
			);
		}
	}
	const subject: MessageCall = {
		key: subjectKey,
		args: new Map([...subjectArgs.keys()].map((name) => [name, name])),
	};
	checkCall(template, subject, subjectArgs, fallbackLocale, uses);

	const html = splitHtml(template.file, rendered);
	const text = splitText(rendered);
	useSegments(html, uses);
	useSegments(text, uses);

	const props = new Map<string, MailProp>();
	for (const prop of [...template.props].sort()) {
		const list = uses.get(prop);
		if (list === undefined) {
			throw templateError(
				'TEMPLATE_UNSUPPORTED',
				template.file,
				`declares the prop ${prop} and never uses it — remove it, or write it in the template`,
			);
		}
		props.set(prop, planProp(template, prop, list));
	}

	return {
		email: template.email,
		file: template.file,
		props,
		calls: rendered.calls,
		subject,
		html,
		text,
	};
}
