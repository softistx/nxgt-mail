import type { MailAttachment, MailMessage } from '../types';

/** A message with the characters a transport most often mangles. */
export const sampleMessage: MailMessage = {
	to: 'ada@example.test',
	from: 'noreply@example.test',
	subject: 'Réinitialisez votre mot de passe — ça expire à 23 h',
	html: '<p>Bonjour Ada 👋, <a href="https://example.test/r?t=abc&amp;x=1">réinitialiser</a></p>',
	text: 'Bonjour Ada 👋,\n\nréinitialiser : https://example.test/r?t=abc&x=1\n',
};

/**
 * A small binary file, every byte from 0 to 255 once — a NUL, a CR and an LF
 * among them, and bytes that are not UTF-8 — with a name a header must encode.
 */
export const sampleAttachment: MailAttachment = {
	filename: 'reçu n° 42.pdf',
	content: Uint8Array.from({ length: 256 }, (_, byte) => byte),
	contentType: 'application/pdf',
};
