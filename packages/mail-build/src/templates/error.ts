import { MailBuildError, type MailBuildErrorCode } from '../errors';

/** A build failure in a template: `templates: <file>: <what>`. */
export function templateError(
	code: MailBuildErrorCode,
	file: string,
	what: string,
	key?: string,
): MailBuildError {
	return new MailBuildError(code, `templates: ${file}: ${what}`, {
		template: file,
		...(key === undefined ? {} : { key }),
	});
}
