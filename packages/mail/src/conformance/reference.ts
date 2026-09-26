import { MailFailure, MailRefused } from '../errors';
import { createMemoryMailer } from '../memory';
import { recipientsOf } from '../message';
import type { MailerHarness } from './types';

/**
 * The harness of the memory mailer, the transport the suite is proven
 * against. Also a working example of a harness.
 */
export function referenceMailerHarness(): MailerHarness {
	return {
		async open() {
			const mailer = createMemoryMailer();
			return {
				mailer,
				async delivered() {
					return mailer.sent.map((mail) => ({
						to: recipientsOf(mail),
						subject: mail.subject,
						html: mail.html,
						text: mail.text,
					}));
				},
				faults: {
					async failNext(kind) {
						const cause = new Error(`simulated ${kind}`);
						mailer.failNext(
							kind === 'outage'
								? new MailFailure('send: the transport could not be reached', {
										cause,
									})
								: new MailRefused('send: the transport refused the message', {
										cause,
									}),
						);
					},
					async attempts() {
						return mailer.attempts;
					},
				},
			};
		},
	};
}
