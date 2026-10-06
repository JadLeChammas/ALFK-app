import en from '../i18n/en';
import fr from '../i18n/fr';
import type { EmailLocale } from './emailTemplates';
import { urgentReason } from './urgentReasons';

/**
 * The email sent with an admin's urgent message: the same title, text and reasons as the pop-up, in the
 * member's language (French or English, like every email). `{{prenom}}` and `{{lien}}` are filled by
 * api/_email.ts.
 */
export function urgentEmail(locale: EmailLocale, msg: { title?: string; body?: string; reasons: string[] }) {
  const u = (locale === 'en' ? en : fr).urgent;
  const reasons = msg.reasons
    .map((key) => ({ def: urgentReason(key), t: u.reasons[key as keyof typeof u.reasons] }))
    .filter((r) => r.def && r.t);
  const title = msg.title?.trim() || reasons[0]?.t.title || u.popupTitle;
  const parts = [
    msg.body?.trim(),
    ...reasons.map((r) => `**${r.t.title}**\n${r.t.body}${r.def!.href ? `\n${r.t.action} : {{lien}}${r.def!.href}` : ''}`),
  ].filter(Boolean);
  return {
    subject: `${u.popupTitle} — ${title}`,
    body: `${u.emailHello}\n\n${parts.join('\n\n')}\n\n${u.emailFooter}`,
  };
}
