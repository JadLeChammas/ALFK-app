/**
 * Emails sent by the platform (through Brevo, see api/email.ts). Shared by the server and the
 * admin page (Admin → Emails), where admins edit these texts; what they save goes to app_settings
 * (`emailTemplates`), and these defaults fill whatever they left empty. No React here.
 *
 * Variables, written {{name}} in a subject or a message:
 *   {{prenom}} {{nom}} — the recipient · {{membre}} — the member waiting for approval (admin alert)
 *   {{role}} — that member's role · {{lien}} — the address of the site
 */

export type EmailLocale = 'fr' | 'en';
export type EmailEvent = 'adminPending' | 'signupReceived' | 'accountApproved' | 'accountCreated';
export const EMAIL_EVENTS: EmailEvent[] = ['signupReceived', 'adminPending', 'accountApproved', 'accountCreated'];

export type EmailText = { subject: string; body: string };
export type EmailTemplates = Partial<Record<EmailEvent, Partial<Record<EmailLocale, Partial<EmailText>>>>>;

export const DEFAULT_TEMPLATES: Record<EmailEvent, Record<EmailLocale, EmailText>> = {
  signupReceived: {
    fr: {
      subject: 'Votre inscription à l’Amicale LFK est bien reçue',
      body: 'Bonjour {{prenom}},\n\nMerci pour votre inscription sur la plateforme de l’Amicale des anciens élèves du Lycée Français du Koweït.\n\nUn administrateur va vérifier vos informations et votre justificatif. Vous recevrez un email dès que votre compte sera validé.\n\nÀ très bientôt !',
    },
    en: {
      subject: 'Your Amicale LFK sign-up has been received',
      body: 'Hello {{prenom}},\n\nThank you for signing up to the platform of the Amicale of former students of the Lycée Français du Koweït.\n\nAn administrator will review your details and your proof of schooling. You will receive an email as soon as your account is approved.\n\nSee you soon!',
    },
  },
  adminPending: {
    fr: {
      subject: 'Nouveau compte à vérifier : {{membre}}',
      body: 'Bonjour {{prenom}},\n\n{{membre}} ({{role}}) vient de s’inscrire et attend votre vérification.\n\nOuvrez les approbations pour consulter son justificatif et valider son compte : {{lien}}/admin/approbations',
    },
    en: {
      subject: 'New account to review: {{membre}}',
      body: 'Hello {{prenom}},\n\n{{membre}} ({{role}}) has just signed up and is waiting for your review.\n\nOpen the approvals to check their proof and approve the account: {{lien}}/admin/approbations',
    },
  },
  accountApproved: {
    fr: {
      subject: 'Bienvenue dans l’Amicale LFK : votre compte est validé',
      body: 'Bonjour {{prenom}},\n\nBonne nouvelle : votre compte a été validé par un administrateur. Vous avez maintenant accès à toute la plateforme : annuaire, Repère, messagerie, événements…\n\nConnectez-vous ici : {{lien}}\n\nBienvenue parmi nous !',
    },
    en: {
      subject: 'Welcome to the Amicale LFK: your account is approved',
      body: 'Hello {{prenom}},\n\nGood news: an administrator has approved your account. You now have access to the whole platform: directory, Repère, messages, events…\n\nSign in here: {{lien}}\n\nWelcome aboard!',
    },
  },
  accountCreated: {
    fr: {
      subject: 'Votre compte sur la plateforme de l’Amicale LFK',
      body: 'Bonjour {{prenom}},\n\nUn administrateur de l’Amicale vous a créé un compte sur la plateforme. Connectez-vous avec cette adresse email et le mot de passe qui vous a été communiqué, puis complétez votre profil : {{lien}}\n\nMot de passe perdu ? Utilisez « Mot de passe oublié » sur la page de connexion.',
    },
    en: {
      subject: 'Your account on the Amicale LFK platform',
      body: 'Hello {{prenom}},\n\nAn administrator of the Amicale has created an account for you on the platform. Sign in with this email address and the password you were given, then complete your profile: {{lien}}\n\nLost your password? Use « Forgot password » on the sign-in page.',
    },
  },
};

/** The text to send: what the admins saved, or the default, field by field. */
export function emailText(saved: EmailTemplates | null | undefined, event: EmailEvent, locale: EmailLocale): EmailText {
  const own = saved?.[event]?.[locale];
  const def = DEFAULT_TEMPLATES[event][locale];
  return { subject: own?.subject?.trim() || def.subject, body: own?.body?.trim() || def.body };
}

export const fillVars = (text: string, vars: Record<string, string | undefined>) =>
  text.replace(/\{\{\s*(\w+)\s*\}\}/g, (all, k: string) => (vars[k] !== undefined ? vars[k]! : all));

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Plain text written by an admin → safe HTML: paragraphs, line breaks, **bold** and clickable links. */
export function textToHtml(text: string) {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((para) => {
      const html = esc(para)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" style="color:#B8323A">$1</a>')
        .replace(/\n/g, '<br>');
      return `<p style="margin:0 0 16px">${html}</p>`;
    })
    .join('');
}

/** The plain-text version of an email (same message, signature and unsubscribe link). */
export function emailPlainText({ body, signature, unsubscribe, locale }: { body: string; signature?: string; unsubscribe?: string; locale: EmailLocale }) {
  const strip = (t: string) => t.trim().replace(/\*\*(.+?)\*\*/g, '$1');
  const footer = 'Amicale des anciens élèves du Lycée Français du Koweït';
  const unsub = unsubscribe ? `\n${locale === 'fr' ? 'Ne plus recevoir les actualités' : 'Unsubscribe'} : ${unsubscribe}` : '';
  return `${strip(body)}${signature?.trim() ? `\n\n--\n${strip(signature)}` : ''}\n\n${footer}${unsub}`;
}

/**
 * The email around a message: the Amicale's logo, the message, the signature, and — for news sent to
 * members — the unsubscribe link. Simple tables and inline styles, for every mail client.
 */
export function emailHtml({ body, signature, logoUrl, siteUrl, unsubscribeUrl, locale }: { body: string; signature?: string; logoUrl: string; siteUrl: string; unsubscribeUrl?: string; locale: EmailLocale }) {
  const unsub = locale === 'fr' ? 'Ne plus recevoir les actualités de l’Amicale' : 'Stop receiving news from the Amicale';
  return `<!doctype html><html><body style="margin:0;padding:0;background:#EEF2F7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F7;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#1C2B3A;font-size:15px;line-height:1.6">
<tr><td style="background:#102A4C;padding:20px 28px" align="left"><a href="${esc(siteUrl)}"><img src="${esc(logoUrl)}" alt="Amicale LFK" height="44" style="display:block;height:44px;border:0"></a></td></tr>
<tr><td style="padding:28px">${textToHtml(body)}${signature?.trim() ? `<div style="margin-top:8px;padding-top:16px;border-top:1px solid #E3E8EF;color:#4A5B6E;font-size:14px">${textToHtml(signature)}</div>` : ''}</td></tr>
<tr><td style="padding:16px 28px;background:#F6F8FB;color:#7A8899;font-size:12px" align="center">Amicale des anciens élèves du Lycée Français du Koweït · <a href="${esc(siteUrl)}" style="color:#7A8899">${esc(siteUrl.replace(/^https?:\/\//, ''))}</a>${unsubscribeUrl ? `<br><a href="${esc(unsubscribeUrl)}" style="color:#7A8899">${unsub}</a>` : ''}</td></tr>
</table></td></tr></table></body></html>`;
}
