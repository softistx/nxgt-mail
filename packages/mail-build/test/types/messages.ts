/**
 * What a generated message module refuses at COMPILE time.
 *
 * Checked by `tsc --noEmit`, never run. The module is `generated/messages.ts`,
 * emitted by the compiler from `test/fixtures/basic` and kept equal to its
 * output by the golden test in `src/messages/compile.spec.ts` — so these
 * refusals measure the real compiler, not a hand-written module.
 *
 * The calls that **must keep compiling** are here too, unmarked.
 *
 * **Seven plausible mistakes, seven refused.**
 */

import { type Locale, locales, t } from './generated/messages';

// ── Must compile ─────────────────────────────────────────────────────────────

t('fr', 'verifyEmail.body', { name: 'Ada' });
t('en', 'verifyEmail.expires', { hours: 24 });
t('en', 'order.placedAt', { at: new Date() }, { timeZone: 'Europe/Paris' });
t('en', 'verifyEmail.title');
t('en', 'verifyEmail.title', {}, { timeZone: 'UTC' });
const every: readonly Locale[] = locales;
void every;

// ── 1. A missing argument ────────────────────────────────────────────────────
// @ts-expect-error — `name` is required.
t('fr', 'verifyEmail.body', {});

// ── 2. No arguments at all, for a message that has some ──────────────────────
// @ts-expect-error — `verifyEmail.body` takes `{ name }`.
t('fr', 'verifyEmail.body');

// ── 3. A misspelled argument ─────────────────────────────────────────────────
// @ts-expect-error — `nom` is not an argument of verifyEmail.body.
t('fr', 'verifyEmail.body', { nom: 'Ada' });

// ── 4. A string where a plural expects a number ──────────────────────────────
// @ts-expect-error — `{hours, plural}` is a number.
t('fr', 'verifyEmail.expires', { hours: '24' });

// ── 5. A string where a date expects a Date ──────────────────────────────────
// @ts-expect-error — `{at, date}` is a Date.
t('en', 'order.placedAt', { at: '2026-09-25' });

// ── 6. A locale the build does not support ───────────────────────────────────
// @ts-expect-error — `de` is not a locale of this build.
t('de', 'verifyEmail.title');

// ── 7. A key that does not exist ─────────────────────────────────────────────
// @ts-expect-error — no such message.
t('en', 'verifyEmail.titel');
