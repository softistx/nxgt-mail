import type { EmailPlan, MailProp } from './plan';
import type { MessageCall } from './render';
import type { Segment } from './split';

const literal = (value: unknown) => JSON.stringify(value);

const TS_TYPE: Readonly<Record<MailProp['kind'], string>> = {
	string: 'string',
	number: 'number',
	date: 'Date',
};

const HELPERS = {
	escapeHtml: `function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}`,
	checkUrl: `// Anchored at the first character: a leading space or control character is
// refused rather than trimmed, as some clients would trim it.
const LINK = /^(https?:\\/\\/|mailto:)/i;
const RESOURCE = /^https?:\\/\\//i;

function checkUrl(mail: string, prop: string, value: string, link: boolean): void {
	if (!(link ? LINK : RESOURCE).test(value)) {
		throw new TypeError(
			\`mails.\${mail}: \${prop} must be an \${link ? 'http:, https: or mailto:' : 'http: or https:'} URL\`,
		);
	}
}`,
	oneLine: `// A line break in a subject is a header injection.
function oneLine(value: string): string {
	return value.replace(/[\\r\\n\\u0085\\u2028\\u2029]+/g, ' ');
}`,
};

function argsShape(plan: EmailPlan): string {
	const fields = [
		'readonly locale: Locale;',
		'readonly timeZone?: string;',
		...[...plan.props].map(
			([name, prop]) => `readonly ${name}: ${TS_TYPE[prop.kind]};`,
		),
	];
	return `{ ${fields.join(' ')} }`;
}

function callSource(call: MessageCall): string {
	const args = [...call.args]
		.map(([name, prop]) => `${name}: a.${prop}`)
		.join(', ');
	return `t(a.locale, ${literal(call.key)}, {${args === '' ? '' : ` ${args} `}}, o)`;
}

function join(
	segments: readonly Segment[],
	plan: EmailPlan,
	html: boolean,
	needs: Set<keyof typeof HELPERS>,
): string {
	const parts = segments.map((segment) => {
		if (segment.kind === 'static') return literal(segment.text);
		const value =
			segment.kind === 'lang'
				? 'a.locale'
				: segment.kind === 'message'
					? `m${segment.call}`
					: plan.props.get(segment.prop)?.kind === 'string'
						? `a.${segment.prop}`
						: `String(a.${segment.prop})`;
		if (!html) return value;
		needs.add('escapeHtml');
		return `escapeHtml(${value})`;
	});
	return parts.length === 0 ? '""' : parts.join(' + ');
}

function renderFunction(
	plan: EmailPlan,
	needs: Set<keyof typeof HELPERS>,
): string {
	const lines = [`\t${literal(plan.email)}: (a) => {`];
	lines.push(
		'\t\tconst o: FormatOptions = a.timeZone === undefined ? {} : { timeZone: a.timeZone };',
	);
	for (const [name, prop] of plan.props) {
		if (prop.url === null) continue;
		needs.add('checkUrl');
		lines.push(
			`\t\tcheckUrl(${literal(plan.email)}, ${literal(name)}, a.${name}, ${prop.url === 'link'});`,
		);
	}
	plan.calls.forEach((call, index) => {
		lines.push(`\t\tconst m${index} = ${callSource(call)};`);
	});
	needs.add('oneLine');
	lines.push(
		'\t\treturn {',
		`\t\t\tsubject: oneLine(${callSource(plan.subject)}),`,
		`\t\t\thtml: ${join(plan.html, plan, true, needs)},`,
		`\t\t\ttext: ${join(plan.text, plan, false, needs)},`,
		'\t\t};',
		'\t},',
	);
	return lines.join('\n');
}

/**
 * Emits the `mails` part of the generated module, to follow the messages
 * part: one render function per e-mail, which joins the static chunks with
 * the escaped values, checks each URL prop, and strips the subject of line
 * breaks. It calls `t` and `Intl`, and imports nothing.
 */
export function emitMails(plans: readonly EmailPlan[]): string {
	const needs = new Set<keyof typeof HELPERS>();
	const functions = plans.map((plan) => renderFunction(plan, needs));
	const helpers = (Object.keys(HELPERS) as (keyof typeof HELPERS)[])
		.filter((name) => needs.has(name))
		.map((name) => HELPERS[name]);

	return [
		'/** A rendered e-mail: `Rendered` in `@nxgt/mail`. */',
		'export interface RenderedMail {',
		'\treadonly subject: string;',
		'\treadonly html: string;',
		'\treadonly text: string;',
		'}',
		'',
		'/** The arguments of each e-mail: its locale, a time zone for its dates, and its props, typed. */',
		'export interface MailArgs {',
		...plans.map((plan) => `\t${literal(plan.email)}: ${argsShape(plan)};`),
		'}',
		'',
		'export type MailName = keyof MailArgs;',
		'',
		...helpers.flatMap((helper) => [helper, '']),
		'/** One render function per e-mail: `mails.verifyEmail({ locale, … })`. */',
		'export const mails: { readonly [M in MailName]: (args: MailArgs[M]) => RenderedMail } = {',
		...functions,
		'};',
		'',
	].join('\n');
}
