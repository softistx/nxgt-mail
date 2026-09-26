import { compileScript, parse } from '@vue/compiler-sfc';
import ts from 'typescript';
import { MailBuildError } from '../errors';

/** A template, read and checked: its e-mail name and its props. */
export interface TemplateSource {
	/** The file name, as `verify-email.vue`: named in the errors. */
	readonly file: string;
	/** The e-mail, as `verifyEmail`: the camelCase of the file name. */
	readonly email: string;
	/** The single-file component's source. */
	readonly source: string;
	/** The props it declares, in order. */
	readonly props: readonly string[];
}

// The raw template AST's node types (`@vue/compiler-core`'s `NodeTypes`).
const ELEMENT = 1;
const INTERPOLATION = 5;
const DIRECTIVE = 7;

const FILE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.vue$/;
const PROP = /^[a-z][a-zA-Z0-9]*$/;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** Names a template may not declare as props: the render function's own. */
const RESERVED = new Set(['t', 'lang', 'locale', 'timeZone']);
/** The directives a render function reproduces: a bound attribute, a slot. */
const DIRECTIVES = new Set(['bind', 'slot']);

function invalid(file: string, what: string): MailBuildError {
	return new MailBuildError('TEMPLATE_INVALID', `templates: ${file}: ${what}`, {
		template: file,
	});
}

function unsupported(file: string, what: string): MailBuildError {
	return new MailBuildError(
		'TEMPLATE_UNSUPPORTED',
		`templates: ${file}: ${what}`,
		{ template: file },
	);
}

/** `verify-email.vue` → `verifyEmail`. */
export function emailName(file: string): string {
	return file
		.slice(0, -'.vue'.length)
		.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Whether `expression` is a `t()` call the build can follow: a string key,
 * and at most an object of props — `{ name }` or `{ name: fullName }`.
 */
function isMessageCall(
	expression: string,
	props: ReadonlySet<string>,
): boolean {
	const file = ts.createSourceFile(
		'expression.ts',
		`(${expression})`,
		ts.ScriptTarget.ES2020,
	);
	const statement = file.statements[0];
	if (file.statements.length !== 1 || statement === undefined) return false;
	if (!ts.isExpressionStatement(statement)) return false;
	let call = statement.expression;
	while (ts.isParenthesizedExpression(call)) call = call.expression;
	if (!ts.isCallExpression(call)) return false;
	if (!ts.isIdentifier(call.expression) || call.expression.text !== 't')
		return false;
	const [key, args, ...rest] = call.arguments;
	if (key === undefined || rest.length > 0) return false;
	if (!ts.isStringLiteral(key)) return false;
	if (args === undefined) return true;
	if (!ts.isObjectLiteralExpression(args)) return false;
	return args.properties.every((property) => {
		if (ts.isShorthandPropertyAssignment(property)) {
			return props.has(property.name.text);
		}
		return (
			ts.isPropertyAssignment(property) &&
			ts.isIdentifier(property.name) &&
			ts.isIdentifier(property.initializer) &&
			props.has(property.initializer.text)
		);
	});
}

function checkExpression(
	file: string,
	expression: string,
	props: ReadonlySet<string>,
	where: string,
): void {
	const trimmed = expression.trim();
	if (IDENTIFIER.test(trimmed)) {
		if (props.has(trimmed) || trimmed === 'lang') return;
		throw unsupported(
			file,
			`${where} uses ${trimmed}, which is not a prop — declare it with defineProps`,
		);
	}
	if (isMessageCall(trimmed, props)) return;
	throw unsupported(
		file,
		`${where} holds an expression — write a prop, or t('key', { prop }), and nothing else`,
	);
}

interface AstNode {
	readonly type: number;
	readonly tag?: string;
	readonly content?: { readonly content?: string };
	readonly props?: readonly {
		readonly type: number;
		readonly name: string;
		readonly arg?: { readonly content?: string };
		readonly exp?: { readonly content?: string };
	}[];
	readonly children?: readonly AstNode[];
}

function checkNode(
	file: string,
	node: AstNode,
	props: ReadonlySet<string>,
): void {
	if (node.type === INTERPOLATION) {
		checkExpression(file, node.content?.content ?? '', props, '{{ }}');
	}
	if (node.type === ELEMENT) {
		for (const prop of node.props ?? []) {
			if (prop.type !== DIRECTIVE) continue;
			if (!DIRECTIVES.has(prop.name)) {
				throw unsupported(
					file,
					`<${node.tag}> uses v-${prop.name} — a template renders once, at build time, so it has no condition, no loop and no event`,
				);
			}
			if (prop.name !== 'bind') continue;
			const name = prop.arg?.content;
			if (name === undefined) {
				throw unsupported(
					file,
					`<${node.tag}> binds an object with v-bind — bind each attribute by name`,
				);
			}
			checkExpression(
				file,
				prop.exp?.content ?? name,
				props,
				`<${node.tag}> :${name}`,
			);
		}
	}
	for (const child of node.children ?? []) checkNode(file, child, props);
}

/**
 * Reads a template and checks what the build can reproduce: props declared
 * with `defineProps` and nothing else in `<script setup>`; in the template,
 * each `{{ }}` and bound attribute a prop, `lang`, or a `t()` call on a
 * string key with props as arguments; no `v-if`, `v-for`, `v-html` or `v-on`.
 */
export function readTemplate(file: string, source: string): TemplateSource {
	if (!FILE.test(file)) {
		throw invalid(
			file,
			'is not a kebab-case .vue file name — name it as verify-email.vue',
		);
	}
	const { descriptor, errors } = parse(source, { filename: file });
	const [error] = errors;
	if (error !== undefined) {
		throw invalid(
			file,
			`does not parse as a single-file component (${error instanceof Error ? error.message : String(error)})`,
		);
	}
	const ast = descriptor.template?.ast;
	if (ast === undefined || ast === null) {
		throw invalid(file, 'has no <template>');
	}
	if (descriptor.script !== null) {
		throw invalid(
			file,
			'has a <script> without setup — declare the props in <script setup>',
		);
	}

	const props: string[] = [];
	if (descriptor.scriptSetup !== null) {
		const { bindings } = compileScript(descriptor, { id: file });
		for (const [name, binding] of Object.entries(bindings ?? {})) {
			if (binding !== 'props') {
				throw unsupported(
					file,
					`declares ${name} in <script setup> — a template declares its props, and nothing else`,
				);
			}
			if (RESERVED.has(name)) {
				throw invalid(
					file,
					`declares the prop ${name}, a name the render function uses itself`,
				);
			}
			if (!PROP.test(name)) {
				throw invalid(
					file,
					`declares the prop ${name}, which is not camelCase — name it as firstName`,
				);
			}
			props.push(name);
		}
	}

	checkNode(file, ast as AstNode, new Set(props));
	return { file, email: emailName(file), source, props };
}
