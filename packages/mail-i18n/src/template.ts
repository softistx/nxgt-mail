import type { ArgumentKind, Messages } from './catalogues';
import { placeholderMark } from './manifest';
import type { createFormatter, MessageArgs } from './translator';

const NAME = /^[a-z][a-zA-Z0-9]*$/;

const KINDS: Record<ArgumentKind, (value: unknown) => boolean> = {
	string: (value) => typeof value === 'string' || typeof value === 'number',
	number: (value) => typeof value === 'number',
	date: (value) => value instanceof Date || typeof value === 'number',
};

const kindOf = (value: unknown) =>
	value === null ? 'null' : value instanceof Date ? 'date' : typeof value;

/**
 * What one template gets in one locale: `t`, `locale` and `placeholder`.
 *
 * `t` is checked against the fallback locale's message, which declares every
 * argument: an unknown key, an argument left out, one the message does not
 * use, or one of the wrong kind **fails the build**, naming the locale, the
 * template and the key.
 */
export function templateProperties(options: {
	readonly email: string;
	readonly locale: string;
	readonly messages: Messages;
	readonly reference: Messages;
	readonly format: ReturnType<typeof createFormatter>;
}) {
	const { email, locale, messages, reference, format } = options;
	const where = `i18n: ${locale}: ${email}`;
	return {
		locale,
		t(key: string, args: MessageArgs = {}): string {
			const message = typeof key === 'string' ? messages.get(key) : undefined;
			const declared = typeof key === 'string' ? reference.get(key) : undefined;
			if (message === undefined || declared === undefined) {
				throw new Error(
					`${where} calls t('${String(key)}'), which is not a key of the catalogues`,
				);
			}
			if (typeof args !== 'object' || args === null) {
				throw new Error(
					`${where} calls t('${key}') with arguments that are not an object, as { name: placeholder('name') }`,
				);
			}
			for (const [name, kind] of declared.args) {
				if (!Object.hasOwn(args, name)) {
					throw new Error(`${where} calls t('${key}') without {${name}}`);
				}
				if (!KINDS[kind](args[name])) {
					throw new Error(
						`${where} passes {${name}} to ${key} as a ${kindOf(args[name])} — the message uses it as a ${kind}`,
					);
				}
			}
			for (const name of Object.keys(args)) {
				if (!declared.args.has(name)) {
					throw new Error(
						`${where} passes {${name}} to ${key}, which does not use it`,
					);
				}
			}
			return format(locale, key, message.text, args);
		},
		placeholder(name: string): string {
			if (typeof name !== 'string' || !NAME.test(name)) {
				throw new Error(
					`${where} calls placeholder() with a name that is not camelCase — as placeholder('firstName')`,
				);
			}
			return placeholderMark(name);
		},
	};
}
