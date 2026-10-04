import type { SupabaseClient } from '@supabase/supabase-js';

import { emailHtml, emailPlainText as emailText_, emailText, fillVars, type EmailEvent, type EmailLocale, type EmailTemplates } from '../src/data/emailTemplates';

/**
 * Sending emails through Brevo (server only — the « _ » prefix keeps this file from being a route).
 * Vercel env: BREVO_API_KEY, BREVO_SENDER_EMAIL (an address verified in Brevo → Senders),
 * optionally BREVO_SENDER_NAME, BREVO_REPLY_TO, BREVO_LIST_ALUMNI and BREVO_LIST_ELEVES (Brevo list ids for the
 * members who accept the news), SITE_URL and EMAIL_LINK_SECRET.
 */

export const SITE = (process.env.SITE_URL ?? 'https://www.alfk.org').replace(/\/$/, '');
const API_KEY = process.env.BREVO_API_KEY;
const SENDER = { email: process.env.BREVO_SENDER_EMAIL ?? '', name: process.env.BREVO_SENDER_NAME ?? 'Amicale LFK' };
/** Where replies go (e.g. the Amicale's Gmail inbox when sending from contact@alfk.org). */
const REPLY_TO = process.env.BREVO_REPLY_TO;
const LIST_ALUMNI = Number(process.env.BREVO_LIST_ALUMNI) || null;
const LIST_ELEVES = Number(process.env.BREVO_LIST_ELEVES) || null;
const LINK_SECRET = process.env.EMAIL_LINK_SECRET ?? process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const LOGO = `${SITE}/email-logo.png`;

export const emailStatus = () => ({ configured: !!API_KEY && !!SENDER.email, sender: SENDER.email, lists: !!(LIST_ALUMNI || LIST_ELEVES) });

export type Recipient = { id: string; email: string; first_name: string | null; last_name: string | null; locale?: string | null; role?: string };
export type Attachment = { name: string; content: string };

async function brevo(path: string, body: unknown) {
  if (!API_KEY) throw new Error('email_not_configured');
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    method: 'POST',
    headers: { 'api-key': API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`brevo_${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.status === 204 ? null : res.json().catch(() => null);
}

/** The admins' texts (Admin → Emails) and signature. */
export async function emailSettings(admin: SupabaseClient) {
  const { data } = await admin.from('app_settings').select('key, value').in('key', ['emailTemplates', 'emailSignature']);
  const get = (k: string) => data?.find((r) => r.key === k)?.value as string | undefined;
  let templates: EmailTemplates | null = null;
  try {
    templates = JSON.parse(get('emailTemplates') ?? 'null');
  } catch {}
  return { templates, signature: get('emailSignature') ?? '' };
}

export const localeOf = (r: Pick<Recipient, 'locale'>): EmailLocale => (r.locale === 'en' ? 'en' : 'fr');

/** Signed link that unsubscribes a member from the news, without signing in (HMAC, Web Crypto). */
async function token(id: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(LINK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`unsub:${id}`)));
  return [...sig].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
export const unsubscribeUrl = async (id: string) => `${SITE}/desinscription?u=${encodeURIComponent(id)}&t=${await token(id)}`;
export async function checkUnsubscribe(id: string, t: string) {
  if (!LINK_SECRET) return false;
  const a = await token(id);
  const b = t ?? '';
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Bytes → base64 (Brevo attachments), in slices so large files do not overflow the call stack. */
export function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/**
 * Sends one message to many people, in their language when both texts are given. {{prenom}} and
 * {{nom}} are filled for each person (Brevo message versions, 100 per call), other variables before.
 */
export async function sendMessage(opts: {
  recipients: Recipient[];
  text: (locale: EmailLocale) => { subject: string; body: string };
  vars?: Record<string, string>;
  signature?: string;
  withUnsubscribe?: (r: Recipient) => boolean;
  attachments?: Attachment[];
}) {
  const people = opts.recipients.filter((r) => /\S+@\S+\.\S+/.test(r.email));
  // Groups by language, and by whether the unsubscribe link belongs in the email (news to members:
  // yes; admins, tests and automatic emails: no — the footer then has no link at all).
  const groups = (['fr', 'en'] as EmailLocale[]).flatMap((locale) =>
    [true, false].map((unsub) => ({ locale, unsub, people: people.filter((r) => localeOf(r) === locale && !!opts.withUnsubscribe?.(r) === unsub) }))
  );
  for (const { locale, unsub: withLink, people: group } of groups) {
    if (!group.length) continue;
    const { subject, body } = opts.text(locale);
    const common = { ...opts.vars, lien: SITE };
    for (let i = 0; i < group.length; i += 100) {
      const chunk = group.slice(i, i + 100);
      const unsub = await Promise.all(chunk.map((r) => (withLink ? unsubscribeUrl(r.id) : '')));
      const personal = (r: Recipient, s: string) => fillVars(fillVars(s, common), { prenom: r.first_name ?? '', nom: (r.last_name ?? '').toLocaleUpperCase('fr') });
      await brevo('/smtp/email', {
        sender: SENDER,
        replyTo: REPLY_TO ? { email: REPLY_TO, name: SENDER.name } : undefined,
        subject: fillVars(subject, common),
        // The unsubscribe link differs for each person: a Brevo parameter.
        htmlContent: emailHtml({ body: fillVars(body, { ...common, prenom: '{{ params.prenom }}', nom: '{{ params.nom }}' }), signature: opts.signature, logoUrl: LOGO, siteUrl: SITE, unsubscribeUrl: withLink ? '{{ params.unsub }}' : undefined, locale }),
        // A plain-text version too: spam filters trust emails that have both.
        textContent: emailText_({ body: fillVars(body, { ...common, prenom: '{{ params.prenom }}', nom: '{{ params.nom }}' }), signature: opts.signature, unsubscribe: withLink ? '{{ params.unsub }}' : undefined, locale }),
        attachment: opts.attachments?.length ? opts.attachments : undefined,
        messageVersions: chunk.map((r, k) => ({
          to: [{ email: r.email, name: [r.first_name, r.last_name].filter(Boolean).join(' ') || undefined }],
          subject: personal(r, subject),
          params: { prenom: r.first_name ?? '', nom: (r.last_name ?? '').toLocaleUpperCase('fr'), unsub: unsub[k] },
        })),
      });
    }
  }
  return people.length;
}

/** One of the automatic emails (texts from Admin → Emails, or the defaults). */
export async function sendEvent(admin: SupabaseClient, event: EmailEvent, recipients: Recipient[], vars?: (locale: EmailLocale) => Record<string, string>) {
  if (!emailStatus().configured || !recipients.length) return 0;
  const { templates, signature } = await emailSettings(admin);
  let sent = 0;
  for (const locale of ['fr', 'en'] as EmailLocale[]) {
    const group = recipients.filter((r) => localeOf(r) === locale);
    if (group.length) sent += await sendMessage({ recipients: group, text: () => emailText(templates, event, locale), vars: vars?.(locale), signature });
  }
  return sent;
}

export const ROLE_NAMES: Record<EmailLocale, Record<string, string>> = {
  fr: { alumni: 'Alumni', eleve: 'Élève', honneur: 'Membre d’honneur', admin: 'Admin' },
  en: { alumni: 'Alumni', eleve: 'Student', honneur: 'Honorary member', admin: 'Admin' },
};

// ——— Brevo contact lists (members who accept the news) ———

const listFor = (role?: string) => (role === 'eleve' ? LIST_ELEVES : role === 'alumni' || role === 'admin' ? LIST_ALUMNI : null);

/** Puts a member in the right list, or takes them out of both when they no longer want the news. */
export async function syncContact(p: Recipient & { approved?: boolean; marketing_opt_in?: boolean }) {
  if (!API_KEY || !(LIST_ALUMNI || LIST_ELEVES)) return;
  const list = p.approved && p.marketing_opt_in ? listFor(p.role) : null;
  if (list) {
    await brevo('/contacts', { email: p.email, attributes: { FIRSTNAME: p.first_name ?? '', LASTNAME: p.last_name ?? '' }, listIds: [list], updateEnabled: true });
  }
  for (const other of [LIST_ALUMNI, LIST_ELEVES]) {
    if (other && other !== list) await brevo(`/contacts/lists/${other}/contacts/remove`, { emails: [p.email] }).catch(() => {});
  }
}

/** Sends every member who accepts the news to their list (after a « Passage à l'année supérieure », say). */
export async function syncAllContacts(admin: SupabaseClient) {
  if (!API_KEY || !(LIST_ALUMNI || LIST_ELEVES)) throw new Error('lists_not_configured');
  const { data } = await admin.from('profiles').select('email, first_name, last_name, role').eq('approved', true).eq('marketing_opt_in', true);
  const counts = { alumni: 0, eleves: 0 };
  for (const [list, roles, key] of [[LIST_ALUMNI, ['alumni', 'admin'], 'alumni'], [LIST_ELEVES, ['eleve'], 'eleves']] as const) {
    const rows = (data ?? []).filter((r) => (roles as readonly string[]).includes(r.role));
    if (!list || !rows.length) continue;
    await brevo('/contacts/import', { listIds: [list], updateExistingContacts: true, emptyContactsAttributes: false, jsonBody: rows.map((r) => ({ email: r.email, attributes: { FIRSTNAME: r.first_name ?? '', LASTNAME: r.last_name ?? '' } })) });
    counts[key] = rows.length;
  }
  return counts;
}
