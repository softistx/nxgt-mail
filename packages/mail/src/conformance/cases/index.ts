import type { MailerCase } from '../types';
import { failureCases } from './failure';
import { sendCases } from './send';

export { failureCases } from './failure';
export { sendCases } from './send';

/** Every case, in the order they are described. */
export const allMailerCases: readonly MailerCase[] = [
	...sendCases,
	...failureCases,
];
