import ts from 'typescript';
import { compileScript, parse } from 'vue/compiler-sfc';
import { templateError } from './error';

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
	/**
	 * How many times the template writes each prop itself — `{{ name }}`,
	 * `:href="link"` — so the build can tell when a component dropped one.
	 */
	readonly written: ReadonlyMap<string, number>;
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

/** `verify-email.vue` → `verifyEmail`. */
export function emailName(file: string): string {
	return file
		.slice(0, -'.vue'.length)
		.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function parseExpression(expression: string): ts.Expression | null {
	const file = ts.createSourceFile(
		'expression.ts',
		`(${expression})`,
		ts.ScriptTarget.ES2020,
	);
	const [statement, ...rest] = file.statements;
	if (statement === undefined || rest.length > 0) return null;
	if (!ts.isExpressionStatement(statement)) return null;
	let node = statement.expression;
	while (ts.isParenthesizedExpression(node)) node = node.expression;
	return node;
}

/**
 * Whether `expression` is a `t()` call the build can follow: a string key,
 * and at most an object of props — `{ name }` or `{ name: fullName }`.
 */
function isMessageCall(
	expression: string,
	props: ReadonlySet<string>,
): boolean {
	const call = parseExpression(expression);
	if (call === null || !ts.isCallExpression(call)) return false;
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

/** Walks a template, checking each expression and counting the props written. */
class TemplateChecker {
	readonly written = new Map<string, number>();

	constructor(
		private readonly file: string,
		private readonly props: ReadonlySet<string>,
	) {}

	private expression(expression: string, where: string): void {
		const trimmed = expression.trim();
		if (IDENTIFIER.test(trimmed)) {
			if (trimmed === 'lang') return;
			if (this.props.has(trimmed)) {
				this.written.set(trimmed, (this.written.get(trimmed) ?? 0) + 1);
				return;
			}
			throw templateError(
				'TEMPLATE_UNSUPPORTED',
				this.file,
				`${where} uses ${trimmed}, which is not a prop — declare it with defineProps`,
			);
		}
		if (isMessageCall(trimmed, this.props)) return;
		throw templateError(
			'TEMPLATE_UNSUPPORTED',
			this.file,
			`${where} holds an expression — write a prop, or t('key', { prop }), and nothing else`,
		);
	}

	private element(node: AstNode): void {
		for (const prop of node.props ?? []) {
			if (prop.type !== DIRECTIVE) continue;
			if (!DIRECTIVES.has(prop.name)) {
				throw templateError(
					'TEMPLATE_UNSUPPORTED',
					this.file,
					`<${node.tag}> uses v-${prop.name} — a template renders once, at build time, so it has no condition, no loop and no event`,
				);
			}
			if (prop.name !== 'bind') continue;
			const name = prop.arg?.content;
			if (name === undefined) {
				throw templateError(
					'TEMPLATE_UNSUPPORTED',
					this.file,
					`<${node.tag}> binds an object with v-bind — bind each attribute by name`,
				);
			}
			this.expression(prop.exp?.content ?? name, `<${node.tag}> :${name}`);
		}
	}

	walk(node: AstNode): void {
		if (node.type === INTERPOLATION) {
			this.expression(node.content?.content ?? '', '{{ }}');
		}
		if (node.type === ELEMENT) this.element(node);
		for (const child of node.children ?? []) this.walk(child);
	}
}

/**
 * `<script setup>` holds one statement, `defineProps([...])`, or nothing:
 * the code of a template runs at build time, once, and its result would be
 * frozen into every e-mail.
 */
function checkScript(file: string, content: string): void {
	const source = ts.createSourceFile(
		'setup.ts',
		content,
		ts.ScriptTarget.ES2020,
	);
	const [first, ...rest] = source.statements;
	const call =
		first !== undefined &&
		rest.length === 0 &&
		ts.isExpressionStatement(first) &&
		ts.isCallExpression(first.expression)
			? first.expression
			: null;
	// `defineProps(['a', 'b'])`, or `defineProps<{ a: string }>()`: names,
	// never code — a validator or a default would run at build time.
	const onlyDefineProps =
		first === undefined ||
		(call !== null &&
			ts.isIdentifier(call.expression) &&
			call.expression.text === 'defineProps' &&
			(call.arguments.length === 0
				? call.typeArguments !== undefined
				: call.arguments.length === 1 &&
					call.arguments.every(
						(argument) =>
							ts.isArrayLiteralExpression(argument) &&
							argument.elements.every(ts.isStringLiteral),
					)));
	if (!onlyDefineProps) {
		throw templateError(
			'TEMPLATE_UNSUPPORTED',
			file,
			'holds code in <script setup> — a template declares its props with defineProps([...]) or defineProps<{...}>(), unassigned, and nothing else',
		);
	}
}

function readProps(
	file: string,
	descriptor: ReturnType<typeof parse>['descriptor'],
): string[] {
	if (descriptor.scriptSetup === null) return [];
	checkScript(file, descriptor.scriptSetup.content);
	let bindings: Readonly<Record<string, unknown>> | undefined;
	try {
		bindings = compileScript(descriptor, { id: file }).bindings;
	} catch (cause) {
		throw templateError(
			'TEMPLATE_INVALID',
			file,
			`does not declare its props in a form the build reads (${cause instanceof Error ? cause.message.split('\n')[0] : String(cause)})`,
		);
	}
	const props: string[] = [];
	for (const name of Object.keys(bindings ?? {})) {
		if (RESERVED.has(name)) {
			throw templateError(
				'TEMPLATE_INVALID',
				file,
				`declares the prop ${name}, a name the render function uses itself`,
			);
		}
		if (!PROP.test(name)) {
			throw templateError(
				'TEMPLATE_INVALID',
				file,
				`declares the prop ${name}, which is not camelCase — name it as firstName`,
			);
		}
		props.push(name);
	}
	return props;
}

/**
 * Reads a template and checks what the build can reproduce: props declared
 * with `defineProps` and nothing else in `<script setup>`; in the template,
 * each `{{ }}` and bound attribute a prop, `lang`, or a `t()` call on a
 * string key with props as arguments; no `v-if`, `v-for`, `v-html` or `v-on`.
 */
export function readTemplate(file: string, source: string): TemplateSource {
	if (!FILE.test(file)) {
		throw templateError(
			'TEMPLATE_INVALID',
			file,
			'is not a kebab-case .vue file name — name it as verify-email.vue',
		);
	}
	const { descriptor, errors } = parse(source, { filename: file });
	const [error] = errors;
	if (error !== undefined) {
		throw templateError(
			'TEMPLATE_INVALID',
			file,
			`does not parse as a single-file component (${error instanceof Error ? error.message : String(error)})`,
		);
	}
	const ast = descriptor.template?.ast;
	if (ast === undefined || ast === null) {
		throw templateError('TEMPLATE_INVALID', file, 'has no <template>');
	}
	if (descriptor.script !== null) {
		throw templateError(
			'TEMPLATE_INVALID',
			file,
			'has a <script> without setup — declare the props in <script setup>',
		);
	}

	const props = readProps(file, descriptor);
	const checker = new TemplateChecker(file, new Set(props));
	checker.walk(ast as AstNode);
	return {
		file,
		email: emailName(file),
		source,
		props,
		written: checker.written,
	};
}
