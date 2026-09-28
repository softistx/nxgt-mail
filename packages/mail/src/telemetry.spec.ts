import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { metrics, SpanStatusCode, trace } from '@opentelemetry/api';
import {
	InMemoryMetricExporter,
	MeterProvider,
	PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import {
	BasicTracerProvider,
	InMemorySpanExporter,
	SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { MailFailure, MailRefused } from './errors';
import { createMemoryMailer } from './memory';
import { createMailRenderer } from './renderer';
import { withMailRendererTelemetry, withMailTelemetry } from './telemetry';
import type { Mailer, MailMessage } from './types';

const built = new URL('../test/built', import.meta.url).pathname;
const link = 'https://app.example/verify?token=abc&next=%2F';

const ADDRESS = 'ada@example.com';
const SUBJECT = 'Confirm your address, Ada';
const BODY_WORD = 'Hello';

let spanExporter: InMemorySpanExporter;
let tracerProvider: BasicTracerProvider;
let metricExporter: InMemoryMetricExporter;
let meterProvider: MeterProvider;

beforeEach(() => {
	spanExporter = new InMemorySpanExporter();
	tracerProvider = new BasicTracerProvider({
		spanProcessors: [new SimpleSpanProcessor(spanExporter)],
	});
	trace.setGlobalTracerProvider(tracerProvider);

	metricExporter = new InMemoryMetricExporter(0);
	meterProvider = new MeterProvider({
		readers: [
			new PeriodicExportingMetricReader({
				exporter: metricExporter,
				exportIntervalMillis: 60_000,
			}),
		],
	});
	metrics.setGlobalMeterProvider(meterProvider);
});

afterEach(async () => {
	trace.disable();
	metrics.disable();
	await tracerProvider.shutdown();
	await meterProvider.shutdown();
});

/** Every string that never belongs in an attribute or an event: the address, the subject, a body word. */
const forbidden = [ADDRESS, SUBJECT, BODY_WORD];

function assertsNoSecret(value: unknown): void {
	if (typeof value !== 'string') return;
	for (const secret of forbidden) {
		expect(value).not.toContain(secret);
	}
}

function assertsNoPii(attributes: Record<string, unknown>): void {
	for (const value of Object.values(attributes)) assertsNoSecret(value);
}

/**
 * The whole span: its attributes, and every event's own attributes,
 * `recordException`'s `exception.message` and `exception.stacktrace`
 * included — a caught error's `message` or `stack` can carry the same value
 * an attribute must never carry.
 */
function assertsSpanHasNoPii(span: {
	attributes: Record<string, unknown>;
	events: readonly { attributes?: Record<string, unknown> }[];
}): void {
	assertsNoPii(span.attributes);
	for (const event of span.events) assertsNoPii(event.attributes ?? {});
}

function message(overrides: Partial<MailMessage> = {}): MailMessage {
	return {
		to: { name: 'Ada Lovelace', address: ADDRESS },
		from: 'noreply@example.com',
		subject: SUBJECT,
		html: `<p>${BODY_WORD} Ada,</p>`,
		text: `${BODY_WORD} Ada,`,
		...overrides,
	};
}

describe('withMailTelemetry(mailer, options) — the span', () => {
	it('records a mail.send span, ok, with the shape of the message and never its value', async () => {
		const memory = createMemoryMailer();
		const mailer = withMailTelemetry(memory, { transport: 'memory' });

		await mailer.send(
			message({ tags: { category: 'verify' }, idempotencyKey: 'order-1' }),
		);

		const [span] = spanExporter.getFinishedSpans();
		expect(span?.name).toBe('mail.send');
		expect(span?.status.code).toBe(SpanStatusCode.OK);
		const attributes = span?.attributes ?? {};
		expect(attributes['mail.transport']).toBe('memory');
		expect(attributes['mail.recipient_count']).toBe(1);
		expect(attributes['mail.tag_count']).toBe(1);
		expect(attributes['mail.tag_names']).toBe('category');
		expect(attributes['mail.idempotency_key']).toBe(true);
		expect(attributes['mail.scheduled']).toBe(false);
		expect(attributes['mail.outcome']).toBe('ok');
		assertsNoPii(attributes);
	});

	it('reports the e-mail name from emailName when given', async () => {
		const memory = createMemoryMailer();
		const mailer = withMailTelemetry(memory, {
			transport: 'memory',
			emailName: (m) => m.tags?.email,
		});

		await mailer.send(message({ tags: { email: 'verify-email' } }));

		const [span] = spanExporter.getFinishedSpans();
		expect(span?.attributes['mail.email']).toBe('verify-email');
	});

	it('marks a refusal an answer: span stays ok, outcome refused, error.type set, and rethrows', async () => {
		const memory = createMemoryMailer();
		const mailer = withMailTelemetry(memory, { transport: 'memory' });

		await mailer.send({
			...message({ idempotencyKey: 'dup' }),
		});
		await expect(
			mailer.send({
				...message({ idempotencyKey: 'dup', subject: 'A different one' }),
			}),
		).rejects.toBeInstanceOf(MailRefused);

		const spans = spanExporter.getFinishedSpans();
		const refused = spans[spans.length - 1];
		expect(refused?.status.code).toBe(SpanStatusCode.OK);
		expect(refused?.attributes['mail.outcome']).toBe('refused');
		expect(refused?.attributes['error.type']).toBe('MAIL_REFUSED');
		assertsNoPii(refused?.attributes ?? {});
	});

	it('marks a failure the span error, outcome failure, error.type set, and rethrows', async () => {
		const memory = createMemoryMailer();
		memory.failNext();
		const mailer = withMailTelemetry(memory, { transport: 'memory' });

		await expect(mailer.send(message())).rejects.toBeInstanceOf(MailFailure);

		const [span] = spanExporter.getFinishedSpans();
		expect(span?.status.code).toBe(SpanStatusCode.ERROR);
		expect(span?.attributes['mail.outcome']).toBe('failure');
		expect(span?.attributes['error.type']).toBe('MAIL_FAILED');
		assertsNoPii(span?.attributes ?? {});
	});

	it('never lets the address, subject or body reach an attribute or a recorded exception, even for a hand-rolled Mailer that echoes the message in its error', async () => {
		const failing: Mailer = {
			send() {
				return Promise.reject(
					new MailFailure(`could not send to ${ADDRESS}: ${SUBJECT}`),
				);
			},
		};
		const mailer = withMailTelemetry(failing, { transport: 'stub' });

		await expect(mailer.send(message())).rejects.toBeInstanceOf(MailFailure);

		const [span] = spanExporter.getFinishedSpans();
		expect(span).toBeDefined();
		if (span === undefined) throw new Error('unreachable');
		assertsSpanHasNoPii(span);
		// The exception is still recorded — sanitised, never the caller's own message.
		expect(span.events).toHaveLength(1);
		expect(span.events[0]?.name).toBe('exception');
	});

	it('records mail.send.duration and mail.send.count by outcome', async () => {
		const memory = createMemoryMailer();
		const mailer = withMailTelemetry(memory, { transport: 'memory' });
		await mailer.send(message());

		await meterProvider.forceFlush();
		const [resourceMetrics] = metricExporter.getMetrics();
		const scope = resourceMetrics?.scopeMetrics[0];
		const names = scope?.metrics.map((m) => m.descriptor.name) ?? [];
		expect(names).toContain('mail.send.duration');
		expect(names).toContain('mail.send.count');
		const count = scope?.metrics.find(
			(m) => m.descriptor.name === 'mail.send.count',
		);
		const point = count?.dataPoints[0];
		expect(point?.attributes).toEqual({
			'mail.outcome': 'ok',
			'mail.transport': 'memory',
		});
	});

	it('records a mail.sendBatch span, ok, with sent/refused/failed counts, when the mailer has one', async () => {
		const fake: Mailer = {
			send: () => Promise.reject(new Error('not used in this test')),
			sendBatch: () =>
				Promise.resolve([
					{ status: 'sent', sentMail: { messageId: 'a' } },
					{ status: 'refused', error: new MailRefused('refused') },
					{ status: 'failed', error: new MailFailure('failed') },
				]),
		};
		const mailer = withMailTelemetry(fake, { transport: 'stub' });

		const results = await mailer.sendBatch?.([message(), message(), message()]);

		expect(results).toHaveLength(3);
		const [span] = spanExporter.getFinishedSpans();
		expect(span?.name).toBe('mail.sendBatch');
		expect(span?.status.code).toBe(SpanStatusCode.OK);
		const attributes = span?.attributes ?? {};
		expect(attributes['mail.transport']).toBe('stub');
		expect(attributes['mail.batch.count']).toBe(3);
		expect(attributes['mail.batch.sent_count']).toBe(1);
		expect(attributes['mail.batch.refused_count']).toBe(1);
		expect(attributes['mail.batch.failed_count']).toBe(1);
		expect(attributes['mail.outcome']).toBe('ok');
		assertsNoPii(attributes);
	});

	it('marks the sendBatch span error and rethrows when the call itself fails, not one message', async () => {
		const fake: Mailer = {
			send: () => Promise.reject(new Error('not used in this test')),
			sendBatch: () => Promise.reject(new MailFailure('the batch call failed')),
		};
		const mailer = withMailTelemetry(fake, { transport: 'stub' });

		await expect(mailer.sendBatch?.([message()])).rejects.toBeInstanceOf(
			MailFailure,
		);

		const [span] = spanExporter.getFinishedSpans();
		expect(span?.name).toBe('mail.sendBatch');
		expect(span?.status.code).toBe(SpanStatusCode.ERROR);
		expect(span?.attributes['mail.outcome']).toBe('failure');
	});

	it('gives a Mailer with no sendBatch of its own none either', () => {
		const memory = createMemoryMailer();
		const mailer = withMailTelemetry(memory, { transport: 'memory' });
		expect(mailer.sendBatch).toBeUndefined();
	});

	it('records mail.send_batch.duration and mail.send_batch.count', async () => {
		const fake: Mailer = {
			send: () => Promise.reject(new Error('not used in this test')),
			sendBatch: () =>
				Promise.resolve([{ status: 'sent', sentMail: { messageId: 'a' } }]),
		};
		const mailer = withMailTelemetry(fake, { transport: 'stub' });
		await mailer.sendBatch?.([message()]);

		await meterProvider.forceFlush();
		const [resourceMetrics] = metricExporter.getMetrics();
		const scope = resourceMetrics?.scopeMetrics[0];
		const names = scope?.metrics.map((m) => m.descriptor.name) ?? [];
		expect(names).toContain('mail.send_batch.duration');
		expect(names).toContain('mail.send_batch.count');
	});
});

describe('withMailRendererTelemetry(renderer) — the span', () => {
	it('records a mail.render span with the e-mail name, always known here', () => {
		const mails = withMailRendererTelemetry(createMailRenderer({ dir: built }));

		mails.render('verify-email', { name: 'Ada', link });

		const [span] = spanExporter.getFinishedSpans();
		expect(span?.name).toBe('mail.render');
		expect(span?.attributes['mail.email']).toBe('verify-email');
		expect(span?.attributes['mail.outcome']).toBe('ok');
		expect(span?.status.code).toBe(SpanStatusCode.OK);
		assertsNoPii(span?.attributes ?? {});
	});

	it('marks a MailRefused (a bad URL variable) an answer, and rethrows', () => {
		const mails = withMailRendererTelemetry(createMailRenderer({ dir: built }));

		expect(() =>
			mails.render('verify-email', {
				name: 'Ada',
				link: 'javascript:alert(1)',
			}),
		).toThrow(MailRefused);

		const [span] = spanExporter.getFinishedSpans();
		expect(span?.status.code).toBe(SpanStatusCode.OK);
		expect(span?.attributes['mail.outcome']).toBe('refused');
		expect(span?.attributes['error.type']).toBe('MAIL_REFUSED');
	});

	it('stays synchronous: render still returns Rendered, not a Promise', () => {
		const mails = withMailRendererTelemetry(createMailRenderer({ dir: built }));
		const rendered = mails.render('verify-email', { name: 'Ada', link });
		expect(rendered).not.toBeInstanceOf(Promise);
		expect(rendered.subject).toBe('Confirm your address, Ada');
	});
});
