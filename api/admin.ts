import { createClient } from '@supabase/supabase-js';

import { sendEvent } from './_email';

/**
 * Server-side account actions that need Supabase's secret key (never shipped to the browser):
 *   create-user · delete-user · set-password     → admins only (set-password: another member's password)
 *   delete-self                                   → any signed-in member, for their own account
 *   signup-upload · signup-finish                 → a brand-new account, without a session (see below)
 *
 * Vercel env: EXPO_PUBLIC_SUPABASE_URL (shared with the app) and SUPABASE_SECRET_KEY
 * (Supabase → Project Settings → API Keys → secret key; the legacy service_role key also works).
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

const json = (status: number, body: unknown) => Response.json(body, { status });

type Body = {
  action?: string;
  userId?: string;
  password?: string;
  name?: string;
  logAction?: 'refuse' | 'delete_user';
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: 'F' | 'M' | 'N';
  role?: 'alumni' | 'eleve' | 'honneur' | 'admin';
  promo?: number;
  phone?: string;
  country?: string;
  city?: string;
  school?: string;
  fonction?: string;
  birthDate?: string;
  bureauCode?: string;
  grade?: string;
  /** signup-upload: which files are coming (their extensions). */
  proofExt?: string;
  photoExt?: string;
  /** signup-finish: what was uploaded. */
  proof?: { path: string; name?: string; mime?: string };
  photo?: { path: string };
};

// Only these extensions get an upload link (the buckets also refuse any other file type).
const PROOF_EXTS = ['jpg', 'png', 'webp', 'gif', 'heic', 'heif', 'pdf'];
const PHOTO_EXTS = ['jpg', 'png', 'webp', 'gif', 'heic', 'heif'];
const PROOF_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf'];
const ext = (e: string | undefined, allowed: string[]) => {
  const x = (e ?? '').toLowerCase().replace(/[^a-z0-9]/g, '').replace('jpeg', 'jpg');
  return allowed.includes(x) ? x : null;
};
const randomId = () => crypto.randomUUID();

const ROLES = ['alumni', 'eleve', 'honneur', 'admin'];

export async function POST(request: Request) {
  if (!url || !secret) return json(500, { error: 'server_not_configured' });
  const admin = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json(400, { error: 'bad_request' });
  }

  // ——— Files chosen in the sign-up form ———
  // Right after signing up there is often no session yet (e-mail to confirm), and a pending member may
  // not write to the photo bucket: the proof and the photo were then lost and had to be sent again.
  // Here the server checks the account was created minutes ago, is still pending and has no proof yet,
  // then hands out one-time upload links (signup-upload) and records the files (signup-finish).
  if (body.action === 'signup-upload' || body.action === 'signup-finish') {
    const userId = body.userId ?? '';
    const { data: found } = userId ? await admin.auth.admin.getUserById(userId) : { data: null };
    const u = found?.user;
    const fresh = !!u && Date.now() - new Date(u.created_at).getTime() < 2 * 3600 * 1000;
    const sameEmail = !!u && (u.email ?? '').toLowerCase() === (body.email ?? '').trim().toLowerCase();
    // Or the member themselves, signed in (pending screen: a photo or proof that never arrived).
    const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const self = !!u && !!bearer && (await admin.auth.getUser(bearer)).data.user?.id === u.id;
    if (!u || !(self || (fresh && sameEmail))) return json(403, { error: 'forbidden' });
    const { data: p } = await admin.from('profiles').select('approved, proof_path, avatar').eq('id', userId).single();
    if (!p || p.approved) return json(403, { error: 'forbidden' });

    if (body.action === 'signup-upload') {
      const out: Record<string, { path: string; token: string }> = {};
      const proofExt = ext(body.proofExt, PROOF_EXTS);
      const photoExt = ext(body.photoExt, PHOTO_EXTS);
      if ((body.proofExt && !proofExt) || (body.photoExt && !photoExt)) return json(400, { error: 'file_type' });
      if (proofExt && !p.proof_path) {
        const { data, error } = await admin.storage.from('proofs').createSignedUploadUrl(`${userId}/${randomId()}.${proofExt}`);
        if (error || !data) return json(500, { error: error?.message ?? 'failed' });
        out.proof = { path: data.path, token: data.token };
      }
      if (photoExt && !p.avatar) {
        const { data, error } = await admin.storage.from('media').createSignedUploadUrl(`${userId}/avatars/${randomId()}.${photoExt}`);
        if (error || !data) return json(500, { error: error?.message ?? 'failed' });
        out.photo = { path: data.path, token: data.token };
      }
      return json(200, { ok: true, ...out });
    }

    // signup-finish: only files really present in this member's own folders are recorded.
    const exists = async (bucket: string, path: string) => {
      const dir = path.slice(0, path.lastIndexOf('/'));
      const name = path.slice(path.lastIndexOf('/') + 1);
      const { data } = await admin.storage.from(bucket).list(dir, { search: name });
      return !!data?.some((f) => f.name === name);
    };
    const row: Record<string, string | null> = {};
    if (body.proof?.path && !p.proof_path && body.proof.path.startsWith(`${userId}/`) && (await exists('proofs', body.proof.path))) {
      const mime = PROOF_MIMES.includes(body.proof.mime ?? '') ? body.proof.mime! : null;
      Object.assign(row, { proof_path: body.proof.path, proof_name: (body.proof.name ?? 'justificatif').slice(0, 200), proof_mime: mime, proof_uploaded_at: new Date().toISOString() });
    }
    if (body.photo?.path && !p.avatar && body.photo.path.startsWith(`${userId}/avatars/`) && (await exists('media', body.photo.path))) {
      row.avatar = admin.storage.from('media').getPublicUrl(body.photo.path).data.publicUrl;
    }
    if (Object.keys(row).length) {
      const { error } = await admin.from('profiles').update(row).eq('id', userId);
      if (error) return json(500, { error: error.message });
    }
    return json(200, { ok: true });
  }

  // Who is calling?
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'unauthorized' });
  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller.user) return json(401, { error: 'unauthorized' });
  const callerId = caller.user.id;

  /**
   * Before an account is deleted: its private files (proof of schooling, CVs) and its profile photos.
   * The rest of its « media » folder stays: an admin's folder also holds the partners' logos, the
   * leaders' photos and publication covers, which the site keeps showing.
   */
  const removeFiles = async (userId: string) => {
    for (const [bucket, dir] of [['proofs', userId], ['cvs', userId], ['media', `${userId}/avatars`]] as const) {
      const { data } = await admin.storage.from(bucket).list(dir, { limit: 1000 });
      const files = (data ?? []).filter((f) => f.id); // folders have no id
      if (files.length) await admin.storage.from(bucket).remove(files.map((f) => `${dir}/${f.name}`));
    }
  };

  if (body.action === 'delete-self') {
    await removeFiles(callerId);
    const { error } = await admin.auth.admin.deleteUser(callerId);
    return error ? json(500, { error: error.message }) : json(200, { ok: true });
  }

  const { data: profile } = await admin.from('profiles').select('role, approved').eq('id', callerId).single();
  if (!profile || profile.role !== 'admin' || !profile.approved) return json(403, { error: 'forbidden' });

  const log = (action: string, target: string, meta?: Record<string, unknown>) =>
    admin.from('admin_logs').insert({ actor_id: callerId, action, target, meta: meta ?? null });

  switch (body.action) {
    case 'create-user': {
      const { email, password, firstName, lastName, gender, promo, phone, country, city, school, fonction, birthDate, bureauCode, grade } = body;
      const role = body.role && ROLES.includes(body.role) ? body.role : 'alumni';
      if (!email || !password || !firstName || !lastName) return json(400, { error: 'missing' });
      if (password.length < 8) return json(400, { error: 'weak_password' });
      // Same rules as the app; the database checks them again (migration 002).
      if (role !== 'honneur' || phone) if (!/^\+\d{1,4} \d{6,14}$/.test(phone ?? '')) return json(400, { error: 'phone' });
      if (role !== 'honneur' || birthDate) if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate ?? '')) return json(400, { error: 'birth_date' });
      const code = role === 'admin' ? (bureauCode ?? '').trim() : '';
      if (code) {
        if (!/^\d{4}$/.test(code)) return json(400, { error: 'invalid_code' });
        const { data: clash } = await admin.from('profiles').select('id').eq('bureau_code', code).maybeSingle();
        if (clash) return json(409, { error: 'code_taken' });
      }
      // Supabase adds app_metadata only after creating the user, too late for the profile trigger:
      // the role is left here for it (migration 024), and removed by the trigger once read.
      const pendingEmail = email.trim().toLowerCase();
      const { error: pendingError } = await admin
        .from('admin_pending_accounts')
        .upsert({ email: pendingEmail, role, fonction: role === 'honneur' ? fonction ?? null : null, bureau_code: code || null, created_at: new Date().toISOString() });
      if (pendingError) return json(500, { error: pendingError.message });
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          gender,
          promo: promo ?? '',
          country: country ?? '',
          city: city ?? '',
          school: school ?? '',
          phone: phone ?? '',
          birth_date: birthDate ?? '',
          grade: role === 'eleve' ? grade ?? '' : '',
        },
        // Trusted fields: only this server can set app metadata. The trigger reads them to create an
        // approved account with its role, position and Bureau code; the Alumni number is assigned there.
        app_metadata: { created_by_admin: true, role, fonction: role === 'honneur' ? fonction ?? '' : '', bureau_code: code },
      });
      if (error || !data.user) {
        await admin.from('admin_pending_accounts').delete().eq('email', pendingEmail);
        const taken = /already|exists|registered/i.test(error?.message ?? '');
        return json(taken ? 409 : 500, { error: taken ? 'email_taken' : error?.message ?? 'failed' });
      }
      await log('create_user', `${firstName} ${lastName}`);
      // « Votre compte a été créé » (Admin → Emails); the account works even if the email fails.
      await sendEvent(admin, 'accountCreated', [{ id: data.user.id, email, first_name: firstName, last_name: lastName, locale: 'fr', role }]).catch(() => {});
      return json(200, { ok: true });
    }

    case 'set-password': {
      // An admin gives another member a new password (members can also use « Mot de passe oublié »).
      if (!body.userId || !body.password) return json(400, { error: 'missing' });
      if (body.userId === callerId) return json(400, { error: 'use_own_settings' });
      if (body.password.length < 8) return json(400, { error: 'weak_password' });
      const { error } = await admin.auth.admin.updateUserById(body.userId, { password: body.password });
      if (error) return json(500, { error: error.message });
      await log('reset_password', body.name ?? body.userId);
      return json(200, { ok: true });
    }

    case 'delete-user': {
      if (!body.userId) return json(400, { error: 'missing' });
      if (body.userId === callerId) return json(400, { error: 'use_delete_self' });
      await removeFiles(body.userId);
      const { error } = await admin.auth.admin.deleteUser(body.userId);
      if (error) return json(500, { error: error.message });
      await log(body.logAction === 'refuse' ? 'refuse' : 'delete_user', body.name ?? body.userId);
      return json(200, { ok: true });
    }

    default:
      return json(400, { error: 'unknown_action' });
  }
}
