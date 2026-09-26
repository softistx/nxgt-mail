import type { MailMessage } from '../types';

/** A message with the characters a transport most often mangles. */
export const sampleMessage: MailMessage = {
	to: 'ada@example.test',
	from: 'noreply@example.test',
	subject: 'Réinitialisez votre mot de passe — ça expire à 23 h',
	html: '<p>Bonjour Ada 👋, <a href="https://example.test/r?t=abc&amp;x=1">réinitialiser</a></p>',
	text: 'Bonjour Ada 👋,\n\nréinitialiser : https://example.test/r?t=abc&x=1\n',
};
