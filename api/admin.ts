import { createClient } from '@supabase/supabase-js';

/**
 * Server-side account actions that need Supabase's secret key (never shipped to the browser):
 *   create-user · delete-user                    → admins only
 *   (no password reset: members use « Mot de passe oublié », which e-mails them a link)
 *   delete-self                                   → any signed-in member, for their own account
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
};

const ROLES = ['alumni', 'eleve', 'honneur', 'admin'];

export async function POST(request: Request) {
  if (!url || !secret) return json(500, { error: 'server_not_configured' });
  const admin = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });

  // Who is calling?
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'unauthorized' });
  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller.user) return json(401, { error: 'unauthorized' });
  const callerId = caller.user.id;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json(400, { error: 'bad_request' });
  }

  /** Removes a member's proof of schooling (private "proofs" bucket, one folder per member). */
  const removeProofs = async (userId: string) => {
    const { data } = await admin.storage.from('proofs').list(userId);
    if (data?.length) await admin.storage.from('proofs').remove(data.map((f) => `${userId}/${f.name}`));
  };

  if (body.action === 'delete-self') {
    await removeProofs(callerId);
    const { error } = await admin.auth.admin.deleteUser(callerId);
    return error ? json(500, { error: error.message }) : json(200, { ok: true });
  }

  const { data: profile } = await admin.from('profiles').select('role, approved').eq('id', callerId).single();
  if (!profile || profile.role !== 'admin' || !profile.approved) return json(403, { error: 'forbidden' });

  const log = (action: string, target: string, meta?: Record<string, unknown>) =>
    admin.from('admin_logs').insert({ actor_id: callerId, action, target, meta: meta ?? null });

  switch (body.action) {
    case 'create-user': {
      const { email, password, firstName, lastName, gender, promo, phone, country, city, school, fonction, birthDate, bureauCode } = body;
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
        },
        // Trusted fields: only this server can set app metadata. The trigger reads them to create an
        // approved account with its role, position and Bureau code; the Alumni number is assigned there.
        app_metadata: { created_by_admin: true, role, fonction: role === 'honneur' ? fonction ?? '' : '', bureau_code: code },
      });
      if (error || !data.user) {
        const taken = /already|exists|registered/i.test(error?.message ?? '');
        return json(taken ? 409 : 500, { error: taken ? 'email_taken' : error?.message ?? 'failed' });
      }
      await log('create_user', `${firstName} ${lastName}`);
      return json(200, { ok: true });
    }

    case 'delete-user': {
      if (!body.userId) return json(400, { error: 'missing' });
      if (body.userId === callerId) return json(400, { error: 'use_delete_self' });
      await removeProofs(body.userId);
      const { error } = await admin.auth.admin.deleteUser(body.userId);
      if (error) return json(500, { error: error.message });
      await log(body.logAction === 'refuse' ? 'refuse' : 'delete_user', body.name ?? body.userId);
      return json(200, { ok: true });
    }

    default:
      return json(400, { error: 'unknown_action' });
  }
}
