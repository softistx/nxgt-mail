/**
 * `@nxgt/mail/telemetry` — observability for a `Mailer` and a `MailRenderer`,
 * on `@opentelemetry/api`. Its own entry, so the root stays dependency-free:
 * nothing here is imported by `.`, `./renderer` or `./conformance`.
 *
 * `@opentelemetry/api` is an **optional peer**. With none installed, the API
 * answers no-op tracer and meter — every call here still runs, and produces
 * nothing.
 *
 * ## What is recorded, and what never is
 *
 * A span or a metric attribute is **a shape, never a value**: a transport's
 * name, a recipient **count**, a tag's **name** (never its value — a tag's
 * value can be a plan or a customer id), whether an idempotency key or a
 * schedule was set, the e-mail's name where it is known, and the outcome.
 * **Never** an address, a subject, a body, an attachment's name or bytes, or a
 * placeholder's value — the invariant `@nxgt/mail`'s own errors hold
 * (`MailError`: "a message reports a shape, never a value") applies here
 * too, and `telemetry.spec.ts` asserts it: the address, the subject and the
 * body used in its fixtures never occur in any attribute or event this
 * module writes — the exception a failure records is a name and a
 * `MailErrorCode`, never the thrown error's own `message` or `stack`, which
 * a hand-rolled `Mailer` or a third-party transport may have built from the
 * message.
 *
 * ## Outcome
 *
 * As in the rest of this package, a **refusal is an answer**: `MailRefused`
 * ends the span `ok`, with `mail.outcome: 'refused'` and `error.type` set to
 * its code — the caller's mistake, not this send's. `MailFailure` (or
 * anything else thrown) ends the span `error`, with `mail.outcome: 'failure'`
 * and the exception recorded, because nothing is known to have been sent.
 *
 * ## Composing with a retry
 *
 * **`withMailTelemetry` goes outside a retry decorator**: `withMailTelemetry(withRetry(mailer), …)`.
 * One call from your code is one send from its caller's point of view, so it
 * gets one span — its duration the whole retried attempt, its outcome the
 * final one. Putting `withMailTelemetry` inside (`withRetry(withMailTelemetry(mailer, …))`)
 * gives one span per attempt instead: useful if the retry itself is not
 * traced and each attempt's own failure is worth seeing on its own, but then
 * a caller's single `send()` produces several `mail.send` spans with no span
 * of their own to sit under, and the histogram counts attempts, not sends.
 */

import {
	type Attributes,
	type Meter,
	metrics,
	SpanKind,
	SpanStatusCode,
	type Tracer,
	trace,
} from '@opentelemetry/api';
import { MailFailure, MailRefused } from './errors';
import { recipientsOf } from './message';
import type { AnyMailEmails, MailEmailsOf, MailRenderer } from './renderer';
import type { MailBatchResult, Mailer, MailMessage, SentMail } from './types';

const INSTRUMENTATION = '@nxgt/mail';

function tracerOf(): Tracer {
	return trace.getTracer(INSTRUMENTATION);
}

function meterOf(): Meter {
	return metrics.getMeter(INSTRUMENTATION);
}

/** The outcome an `Error` from `send` or `render` ends the span with. */
type Outcome = 'ok' | 'refused' | 'failure';

/** `outcome` and, when it is not `'ok'`, the code `error.type` carries. */
function outcomeOf(error: unknown): { outcome: Outcome; code?: string } {
	if (error instanceof MailRefused)
		return { outcome: 'refused', code: error.code };
	if (error instanceof MailFailure)
		return { outcome: 'failure', code: error.code };
	return { outcome: 'failure' };
}

/**
 * Marks the span with `outcome` and, for a failure, records the exception.
 * A refusal is an answer: the span stays `ok`. Always rethrows.
 *
 * **Never the error's own `message` or `stack`**: a hand-rolled `Mailer` or a
 * third-party transport may put the address or the subject in there — the
 * fixture in `telemetry.spec.ts` does, on purpose. `recordException` is given
 * a name and the `MailErrorCode` instead of the `Error` itself, so a value
 * never reaches the span's `events` the way it never reaches its attributes.
 */
function fail(
	span: {
		setAttribute(name: string, value: unknown): unknown;
		setStatus(status: { code: SpanStatusCode; message?: string }): unknown;
		recordException(exception: { name: string; message: string }): unknown;
	},
	error: unknown,
): never {
	const { outcome, code } = outcomeOf(error);
	span.setAttribute('mail.outcome', outcome);
	if (code !== undefined) span.setAttribute('error.type', code);
	if (outcome === 'refused') {
		span.setStatus({ code: SpanStatusCode.OK });
	} else {
		span.recordException({
			name: error instanceof Error ? error.name : 'Error',
			message: code ?? 'unknown error',
		});
		span.setStatus(
			code === undefined
				? { code: SpanStatusCode.ERROR }
				: { code: SpanStatusCode.ERROR, message: code },
		);
	}
	throw error;
}

/** What `withMailTelemetry` needs beyond the message, to attribute the span. */
export interface MailTelemetryOptions {
	/**
	 * The transport's name, as `'resend'` or `'smtp'`: `mail.transport` on
	 * every span, and on the metrics — the one attribute low enough in
	 * cardinality to belong on both.
	 */
	readonly transport: string;
	/**
	 * The e-mail's name, when the caller knows it — `render`'s first argument
	 * is not carried on `MailMessage`, so this is the only way `mail.send`'s
	 * span gets `mail.email`. A common choice: `(message) => message.tags?.email`,
	 * paired with `mails.render('verify-email', …)` and
	 * `tags: { email: 'verify-email' }` on the message you build from it.
	 */
	readonly emailName?: (message: MailMessage) => string | undefined;
}

/** Attributes known before `send` is even called: never a value, only a shape. */
function sendAttributes(
	message: MailMessage,
	options: MailTelemetryOptions,
): Attributes {
	const tagNames = Object.keys(message.tags ?? {});
	const attributes: Record<string, string | number | boolean> = {
		'mail.transport': options.transport,
		'mail.recipient_count': recipientsOf(message).length,
		'mail.tag_count': tagNames.length,
		'mail.tag_names': tagNames.join(','),
		'mail.idempotency_key': message.idempotencyKey !== undefined,
		'mail.scheduled': message.scheduledAt !== undefined,
	};
	const emailName = options.emailName?.(message);
	if (emailName !== undefined) attributes['mail.email'] = emailName;
	return attributes;
}

/**
 * `mailer`, wrapped so every `send` opens a span `mail.send` (kind `CLIENT`)
 * and records its outcome and duration. Works with no OpenTelemetry SDK
 * installed — every call still reaches `mailer.send` unchanged; nothing is
 * observed.
 *
 * ```ts
 * import { withMailTelemetry } from '@nxgt/mail/telemetry';
 *
 * const mailer = withMailTelemetry(resendMailer, { transport: 'resend' });
 * await mailer.send(message); // a span, unchanged behaviour
 * ```
 *
 * When `mailer` has a `sendBatch`, it gets its own span, `mail.sendBatch`:
 * `mail.outcome` there is `'ok'` whenever the call itself resolved — a
 * `MailBatchResult` per message is the answer, not a throw — with
 * `mail.batch.sent_count`, `mail.batch.refused_count` and
 * `mail.batch.failed_count` alongside it. A `Mailer` with no `sendBatch`
 * still gets one from `withMailTelemetry` — it simply carries none of its own.
 */
export function withMailTelemetry(
	mailer: Mailer,
	options: MailTelemetryOptions,
): Mailer {
	const meter = meterOf();
	const duration = meter.createHistogram('mail.send.duration', {
		description: 'Duration of a Mailer.send call, by outcome',
		unit: 'ms',
	});
	const count = meter.createCounter('mail.send.count', {
		description: 'Number of Mailer.send calls, by outcome',
	});
	const batchDuration = meter.createHistogram('mail.send_batch.duration', {
		description: 'Duration of a Mailer.sendBatch call',
		unit: 'ms',
	});
	const batchCount = meter.createCounter('mail.send_batch.count', {
		description: 'Number of Mailer.sendBatch calls, by outcome',
	});
	return {
		// Instrumented, not a bare pass-through, and only when `mailer` has one:
		// one span for the whole call — its own `mail.outcome` is `'ok'`
		// whenever the call itself resolved, whatever the messages inside it
		// answered — plus how many of them came back `sent`, `refused` or
		// `failed`. Never a value: no address, no subject, the same shape `send`
		// holds to.
		...(typeof mailer.sendBatch === 'function'
			? {
					sendBatch(
						messages: readonly MailMessage[],
					): Promise<readonly MailBatchResult[]> {
						return tracerOf().startActiveSpan(
							'mail.sendBatch',
							{
								attributes: {
									'mail.transport': options.transport,
									'mail.batch.count': messages.length,
								},
								kind: SpanKind.CLIENT,
							},
							async (span) => {
								const startedAt = performance.now();
								let outcome: Outcome = 'ok';
								try {
									const results = await (
										mailer.sendBatch as NonNullable<Mailer['sendBatch']>
									)(messages);
									const counts = { sent: 0, refused: 0, failed: 0 };
									for (const result of results) counts[result.status] += 1;
									span.setAttribute('mail.batch.sent_count', counts.sent);
									span.setAttribute('mail.batch.refused_count', counts.refused);
									span.setAttribute('mail.batch.failed_count', counts.failed);
									span.setAttribute('mail.outcome', 'ok');
									span.setStatus({ code: SpanStatusCode.OK });
									return results;
								} catch (error) {
									outcome = outcomeOf(error).outcome;
									fail(span, error);
								} finally {
									const metricAttributes = {
										'mail.outcome': outcome,
										'mail.transport': options.transport,
									};
									batchDuration.record(
										performance.now() - startedAt,
										metricAttributes,
									);
									batchCount.add(1, metricAttributes);
									span.end();
								}
							},
						);
					},
				}
			: {}),
		send(message: MailMessage): Promise<SentMail> {
			return tracerOf().startActiveSpan(
				'mail.send',
				{ attributes: sendAttributes(message, options), kind: SpanKind.CLIENT },
				async (span) => {
					const startedAt = performance.now();
					let outcome: Outcome = 'ok';
					try {
						const sent = await mailer.send(message);
						span.setAttribute('mail.outcome', 'ok');
						span.setStatus({ code: SpanStatusCode.OK });
						return sent;
					} catch (error) {
						outcome = outcomeOf(error).outcome;
						fail(span, error);
					} finally {
						const metricAttributes = {
							'mail.outcome': outcome,
							'mail.transport': options.transport,
						};
						duration.record(performance.now() - startedAt, metricAttributes);
						count.add(1, metricAttributes);
						span.end();
					}
				},
			);
		},
	};
}

/** What `withMailRendererTelemetry` needs — nothing yet, kept for a future option. */
export type MailRendererTelemetryOptions = Record<string, never>;

/**
 * `renderer`, wrapped so every `render` opens a span `mail.render` with the
 * e-mail's name — always known here, unlike at `send` — and its outcome.
 * `render` is synchronous, and stays so: the span opens and closes within
 * the same call, never turning it into an `async` method.
 *
 * ```ts
 * import { withMailRendererTelemetry } from '@nxgt/mail/telemetry';
 *
 * const mails = withMailRendererTelemetry(createMailRenderer({ dir: 'dist' }));
 * mails.render('verify-email', { name, link }); // a span, unchanged behaviour
 * ```
 */
export function withMailRendererTelemetry<
	E extends MailEmailsOf<E> = AnyMailEmails,
>(
	renderer: MailRenderer<E>,
	_options: MailRendererTelemetryOptions = {},
): MailRenderer<E> {
	const meter = meterOf();
	const duration = meter.createHistogram('mail.render.duration', {
		description: 'Duration of a MailRenderer.render call, by outcome',
		unit: 'ms',
	});
	const count = meter.createCounter('mail.render.count', {
		description: 'Number of MailRenderer.render calls, by outcome',
	});
	const render: MailRenderer<E>['render'] = (email, ...rest) =>
		tracerOf().startActiveSpan(
			'mail.render',
			{ attributes: { 'mail.email': email }, kind: SpanKind.INTERNAL },
			(span) => {
				const startedAt = performance.now();
				let outcome: Outcome = 'ok';
				try {
					const rendered = renderer.render(email, ...rest);
					span.setAttribute('mail.outcome', 'ok');
					span.setStatus({ code: SpanStatusCode.OK });
					return rendered;
				} catch (error) {
					outcome = outcomeOf(error).outcome;
					fail(span, error);
				} finally {
					const metricAttributes = { 'mail.outcome': outcome };
					duration.record(performance.now() - startedAt, metricAttributes);
					count.add(1, metricAttributes);
					span.end();
				}
			},
		);
	return { emails: renderer.emails, locales: renderer.locales, render };
}

/**
 * @deprecated Use {@link withMailTelemetry} instead. `withTelemetry` collides
 * with `@nxgt/telemetry`'s own export of the same name — removed in 1.0.
 */
export const withTelemetry = withMailTelemetry;

/**
 * @deprecated Use {@link withMailRendererTelemetry} instead — removed in 1.0.
 */
export const withRendererTelemetry = withMailRendererTelemetry;
