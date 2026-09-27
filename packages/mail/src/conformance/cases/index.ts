import type { MailerCase } from '../types';
import { batchCases } from './batch';
import { failureCases } from './failure';
import { sendCases } from './send';

export { batchCases } from './batch';
export { failureCases } from './failure';
export { sendCases } from './send';

/** Every case, in the order they are described. */
export const allMailerCases: readonly MailerCase[] = [
	...sendCases,
	...batchCases,
	...failureCases,
];
