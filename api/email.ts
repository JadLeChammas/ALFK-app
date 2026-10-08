import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { urgentEmail } from '../src/data/urgentEmail';
import { checkUnsubscribe, emailSettings, emailStatus, ROLE_NAMES, sendEvent, sendMessage, syncAllContacts, syncContact, toBase64, type Attachment, type Recipient } from './_email';

/**
 * POST /api/email — emails through Brevo (see api/_email.ts).
 *   signup-notify   a brand-new account (no session needed): « inscription reçue » + alert to the Amicale's inbox
 *   unsubscribe     the link in the news emails
 *   marketing       a member turns the news on or off (their own account)
 *   approved        an admin approved an account: « compte validé »
 *   send            an admin's email (Admin → Emails) to a group, or a test to themself
 *   urgent          the email that goes with an urgent message (Admin → Messages urgents)
 *   sync-contacts   admins: every member who accepts the news → Brevo lists
 *   status          admins: is Brevo set up?
 */
export const maxDuration = 60;

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const json = (status: number, body: unknown) => Response.json(body, { status });
const COLUMNS = 'id, email, first_name, last_name, locale, role, approved, marketing_opt_in';
const MAX_ATTACHMENTS = 10 * 1024 * 1024;
/**
 * Who is told about each new sign-up: the Amicale's inbox (Vercel env SIGNUP_ALERT_EMAIL can change it).
 * The admins still see the requests in Admin → Approbations and in their notifications.
 */
const SIGNUP_ALERT: Recipient = {
  id: 'amicale',
  email: process.env.SIGNUP_ALERT_EMAIL || 'amicalelyceefrancaisdekoweit@gmail.com',
  first_name: 'Bureau',
  last_name: null,
  locale: 'fr',
  role: 'admin',
};

type Body = {
  action?: string;
  userId?: string;
  email?: string;
  locale?: string;
  marketing?: boolean;
  on?: boolean;
  u?: string;
  t?: string;
  audience?: string[];
  /** An admin's email to one member (instead of `audience`). */
  memberId?: string;
  subject?: string;
  body?: string;
  attachments?: { path: string; name: string }[];
  test?: boolean;
  userIds?: string[];
  title?: string;
  reasons?: string[];
};

export async function POST(request: Request) {
  if (!url || !secret) return json(500, { error: 'server_not_configured' });
  const admin = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json(400, { error: 'bad_request' });
  }

  try {
    // ——— No session ———
    if (body.action === 'signup-notify') return await signupNotify(admin, body);
    if (body.action === 'unsubscribe') {
      if (!body.u || !(await checkUnsubscribe(body.u, body.t ?? ''))) return json(403, { error: 'forbidden' });
      const { data: p } = await admin.from('profiles').update({ marketing_opt_in: false }).eq('id', body.u).select(COLUMNS).single();
      if (p) await syncContact(p as Recipient).catch(() => {});
      return json(200, { ok: true });
    }

    // ——— Signed in ———
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return json(401, { error: 'unauthorized' });
    const { data: caller } = await admin.auth.getUser(token);
    if (!caller?.user) return json(401, { error: 'unauthorized' });
    const { data: me } = await admin.from('profiles').select(COLUMNS).eq('id', caller.user.id).single();
    if (!me) return json(403, { error: 'forbidden' });

    if (body.action === 'marketing') {
      const { data: p } = await admin.from('profiles').update({ marketing_opt_in: !!body.on }).eq('id', me.id).select(COLUMNS).single();
      if (p) await syncContact(p as Recipient).catch(() => {});
      return json(200, { ok: true });
    }

    if (me.role !== 'admin' || !me.approved) return json(403, { error: 'forbidden' });

    switch (body.action) {
      case 'status':
        return json(200, { ok: true, ...emailStatus() });
      case 'approved': {
        const { data: p } = await admin.from('profiles').select(COLUMNS).eq('id', body.userId ?? '').single();
        if (!p?.approved) return json(400, { error: 'not_approved' });
        await sendEvent(admin, 'accountApproved', [p as Recipient]);
        await syncContact(p as Recipient).catch(() => {});
        return json(200, { ok: true });
      }
      case 'send':
        return await sendFromAdmin(admin, me as Recipient, body);
      case 'urgent':
        return await sendUrgent(admin, me as Recipient, body);
      case 'sync-contacts':
        return json(200, { ok: true, ...(await syncAllContacts(admin)) });
      default:
        return json(400, { error: 'unknown_action' });
    }
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : 'failed' });
  }
}

/** Right after signing up: thank the member, tell the admins. Once per account, minutes after its creation. */
async function signupNotify(admin: SupabaseClient, body: Body) {
  const id = body.userId ?? '';
  const { data: found } = id ? await admin.auth.admin.getUserById(id) : { data: null };
  const u = found?.user;
  // Within two days of signing up (time to find the code), and only once the address is confirmed.
  const fresh = !!u && Date.now() - new Date(u.created_at).getTime() < 48 * 3600 * 1000;
  if (!u || !fresh || (u.email ?? '').toLowerCase() !== (body.email ?? '').trim().toLowerCase()) return json(403, { error: 'forbidden' });
  if (!u.email_confirmed_at) return json(409, { error: 'not_confirmed' });
  const { data: p } = await admin.from('profiles').select(`${COLUMNS}, signup_notified`).eq('id', id).single();
  if (!p || p.approved || p.signup_notified) return json(200, { ok: true });
  const { data: updated } = await admin
    .from('profiles')
    .update({ signup_notified: true, locale: body.locale === 'en' ? 'en' : 'fr', marketing_opt_in: !!body.marketing })
    .eq('id', id)
    .select(COLUMNS)
    .single();
  const member = (updated ?? p) as Recipient;
  await sendEvent(admin, 'signupReceived', [member]);
  const name = [member.first_name, (member.last_name ?? '').toLocaleUpperCase('fr')].filter(Boolean).join(' ');
  // The « new account to review » alert goes to the Amicale's own inbox only, not to every admin.
  await sendEvent(admin, 'adminPending', [SIGNUP_ALERT], (locale) => ({ membre: name, role: ROLE_NAMES[locale][member.role ?? 'alumni'] ?? '' }));
  return json(200, { ok: true });
}

/**
 * The email of an urgent message: to every chosen member — even those who turned the news off or whose
 * account is restricted (it is not news, it is about their account).
 */
async function sendUrgent(admin: SupabaseClient, me: Recipient, body: Body) {
  const ids = [...new Set((body.userIds ?? []).filter((x) => typeof x === 'string'))].slice(0, 5000);
  const reasons = (body.reasons ?? []).filter((x) => typeof x === 'string').slice(0, 10);
  if (!ids.length || (!reasons.length && !(body.body ?? '').trim())) return json(400, { error: 'missing' });
  if (!emailStatus().configured) return json(400, { error: 'email_not_configured' });
  const recipients: Recipient[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await admin.from('profiles').select(COLUMNS).eq('approved', true).in('id', ids.slice(i, i + 200));
    recipients.push(...((data ?? []) as Recipient[]));
  }
  const { signature } = await emailSettings(admin);
  const msg = { title: (body.title ?? '').slice(0, 120), body: (body.body ?? '').slice(0, 2000), reasons };
  const sent = await sendMessage({ recipients, text: (locale) => urgentEmail(locale, msg), signature });
  await admin.from('admin_logs').insert({ actor_id: me.id, action: 'send_email', target: urgentEmail('fr', msg).subject.slice(0, 200), meta: { count: sent } });
  return json(200, { ok: true, sent });
}

/**
 * An admin's email: to the chosen groups (members who accept the news; admins always), to one member
 * (`memberId`: a personal email, sent even if they turned the news off), or a test.
 */
async function sendFromAdmin(admin: SupabaseClient, me: Recipient, body: Body) {
  const subject = (body.subject ?? '').trim();
  const text = (body.body ?? '').trim();
  if (!subject || !text) return json(400, { error: 'missing' });
  if (!emailStatus().configured) return json(400, { error: 'email_not_configured' });

  let recipients: (Recipient & { approved?: boolean; marketing_opt_in?: boolean })[];
  if (body.test) {
    recipients = [me];
  } else if (body.memberId) {
    const { data } = await admin.from('profiles').select(COLUMNS).eq('approved', true).eq('id', body.memberId).maybeSingle();
    if (!data) return json(400, { error: 'no_audience' });
    recipients = [data as Recipient];
  } else {
    // Honorary members do not receive the admins' emails.
    const roles = (body.audience ?? []).filter((r) => ['alumni', 'eleve', 'admin'].includes(r));
    if (!roles.length) return json(400, { error: 'no_audience' });
    const { data } = await admin.from('profiles').select(COLUMNS).eq('approved', true).in('role', roles);
    recipients = (data ?? []).filter((r) => r.role === 'admin' || r.marketing_opt_in) as Recipient[];
  }

  const attachments: Attachment[] = [];
  let size = 0;
  for (const a of body.attachments ?? []) {
    const { data: file, error } = await admin.storage.from('mail-attachments').download(a.path);
    if (error || !file) return json(400, { error: 'attachment_missing' });
    const bytes = await file.arrayBuffer();
    size += bytes.byteLength;
    if (size > MAX_ATTACHMENTS) return json(400, { error: 'attachments_too_big' });
    attachments.push({ name: a.name.slice(0, 120), content: toBase64(bytes) });
  }

  const { signature } = await emailSettings(admin);
  const sent = await sendMessage({
    recipients,
    text: () => ({ subject, body: text }),
    signature,
    // News to members carry the unsubscribe link; admins and tests do not need it.
    withUnsubscribe: (r) => !body.test && !body.memberId && r.role !== 'admin',
    attachments,
  });
  if (!body.test) await admin.from('admin_logs').insert({ actor_id: me.id, action: 'send_email', target: subject.slice(0, 200), meta: { count: sent } });
  return json(200, { ok: true, sent });
}
