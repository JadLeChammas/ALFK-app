import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { isRemote, supabase } from '@/lib/supabase';
import { canMessage } from './permissions';
import {
  callAdminApi,
  EMPTY_DB,
  eventRow,
  loadDb,
  logRow,
  newId,
  profilePatchToRow,
  publicationRow,
  toConversation,
  toMessage,
  toNotification,
  uploadImage,
  type PickedImage,
} from './remote';
import { createSeed } from './seed';
import type {
  AdminLog,
  AdminLogAction,
  Conversation,
  Db,
  Gender,
  LfkEvent,
  Privacy,
  Publication,
  Role,
  Session,
  User,
} from './types';

/**
 * App state + every action the screens can take.
 *
 * Two backends behind the same API:
 * - **Supabase** (when EXPO_PUBLIC_SUPABASE_URL is set): real accounts, database and storage. Changes are
 *   applied to the local copy right away and written to Supabase; if Supabase refuses one, the data is
 *   reloaded and `error` is set so the UI can say so.
 * - **Local demo** otherwise: seeded data saved on the device (src/data/seed.ts).
 */

const STORAGE_KEY = 'lfk.demo.db.v3';
const SESSION_KEY = 'lfk.demo.session.v1';

export type AuthError = 'invalid_credentials' | 'email_taken' | 'weak_password' | 'unknown_email' | 'wrong_password' | 'unknown';
export type Result = { ok: true; confirmEmail?: boolean } | { ok: false; error: AuthError };

export type SignUpInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: Gender;
  role: Role;
  promo?: number;
  school?: string;
  fonction?: string;
  city?: string;
  country?: string;
  phone?: string;
};

export type ProfilePatch = Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'birthDate' | 'school' | 'promo' | 'city' | 'country' | 'avatar' | 'bio'>>;

const demoId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const makeId = (p: string) => (isRemote ? newId() : demoId(p));
const nowIso = () => new Date().toISOString();
export const fullName = (u?: Pick<User, 'firstName' | 'lastName'>) => (u ? `${u.firstName} ${u.lastName}` : '');

function authError(message?: string, code?: string): AuthError {
  const m = `${code ?? ''} ${message ?? ''}`.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid_credentials')) return 'invalid_credentials';
  if (m.includes('already') || m.includes('email_exists') || m.includes('email_taken')) return 'email_taken';
  if (m.includes('weak') || m.includes('password should')) return 'weak_password';
  return 'unknown';
}

function useStoreValue() {
  const [db, setDb] = useState<Db | null>(null);
  const [session, setSession] = useState<Session>(null);
  const [error, setError] = useState<string | null>(null);
  const dbRef = useRef<Db | null>(null);
  const loadingFor = useRef<string | null>(null);
  /** True while signed in through a password-reset link (overrides every other state). */
  const recoveryRef = useRef(false);

  const setAll = useCallback((next: Db) => {
    dbRef.current = next;
    setDb(next);
  }, []);

  /** Local update (optimistic in Supabase mode; persisted to the device in demo mode). */
  const commit = useCallback((fn: (d: Db) => Db) => {
    const cur = dbRef.current;
    if (!cur) return;
    const next = fn(cur);
    dbRef.current = next;
    setDb(next);
    if (!isRemote) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  // ——— Supabase: load data for the signed-in user ———
  const reload = useCallback(async () => {
    if (!supabase) return;
    try {
      setAll(await loadDb());
    } catch (e) {
      setError((e as Error).message ?? 'load_failed');
    }
  }, [setAll]);

  /** Sends a write to Supabase; on refusal, resyncs from the server and reports the error. */
  const send = useCallback(
    (op: PromiseLike<{ error: { message: string } | null }>) => {
      Promise.resolve(op).then(
        ({ error: e }) => {
          if (e) {
            setError(e.message);
            reload();
          }
        },
        (e: Error) => {
          setError(e.message);
          reload();
        }
      );
    },
    [reload]
  );

  useEffect(() => {
    if (!supabase) {
      // ——— Demo mode ———
      (async () => {
        let loaded: Db | null = null;
        let s: Session = null;
        try {
          const [raw, rawSession] = await Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(SESSION_KEY)]);
          if (raw) loaded = JSON.parse(raw);
          if (rawSession) s = JSON.parse(rawSession);
        } catch {}
        const next = loaded ?? createSeed();
        setAll(next);
        setSession(s && next.users.some((u) => u.id === s!.userId) ? s : null);
      })();
      return;
    }

    // ——— Supabase mode ———
    const sb = supabase;
    const onSession = async (userId: string | null) => {
      if (!userId) {
        loadingFor.current = null;
        setAll(EMPTY_DB);
        setSession(null);
        return;
      }
      if (loadingFor.current !== userId) {
        loadingFor.current = userId;
        setDb(null); // not ready until this user's data is in
        try {
          const data = await loadDb();
          setAll(data);
          sb.from('profiles').update({ last_active_at: nowIso() }).eq('id', userId).then(() => {});
        } catch (e) {
          setError((e as Error).message);
          setAll(EMPTY_DB);
        }
      }
      setSession({ userId, recovery: recoveryRef.current });
    };

    sb.auth.getSession().then(({ data }) => onSession(data.session?.user.id ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') recoveryRef.current = true;
      if (event === 'SIGNED_OUT') recoveryRef.current = false;
      if (event === 'INITIAL_SESSION') return; // handled by getSession above
      // Defer: supabase-js warns against awaiting other calls inside this callback.
      setTimeout(() => onSession(s?.user.id ?? null), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [setAll]);

  const me = db && session ? db.users.find((u) => u.id === session.userId) ?? null : null;
  const meId = me?.id;

  // ——— Supabase: live messages, conversations and notifications ———
  useEffect(() => {
    if (!supabase || !meId || !me?.approved) return;
    const sb = supabase;
    const channel = sb
      .channel(`live-${meId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
        const m = toMessage(p.new);
        commit((d) => (d.messages.some((x) => x.id === m.id) ? d : { ...d, messages: [...d.messages, m] }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (p) => {
        if (p.eventType === 'DELETE') return;
        const c = toConversation(p.new);
        commit((d) => ({ ...d, conversations: d.conversations.some((x) => x.id === c.id) ? d.conversations.map((x) => (x.id === c.id ? c : x)) : [...d.conversations, c] }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${meId}` }, (p) => {
        const n = toNotification(p.new);
        commit((d) => (d.notifications.some((x) => x.id === n.id) ? d : { ...d, notifications: [n, ...d.notifications] }));
      })
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [meId, me?.approved, commit]);

  const saveSession = useCallback((s: Session) => {
    setSession(s);
    if (s) AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s)).catch(() => {});
    else AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  }, []);

  /** Records an admin-log entry locally and, in Supabase mode, in the database. */
  const log = useCallback(
    (d: Db, action: AdminLogAction, target: string, meta?: AdminLog['meta']): Db => {
      if (!meId) return d;
      const entry: AdminLog = { id: makeId('l'), actorId: meId, action, target, meta, createdAt: nowIso() };
      if (supabase) send(supabase.from('admin_logs').insert(logRow(entry)));
      return { ...d, logs: [entry, ...d.logs] };
    },
    [meId, send]
  );

  const findByEmail = (email: string) => dbRef.current?.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  const redirectUrl = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;

  const actions = {
    // ——— Auth ———
    async signIn(email: string, password: string): Promise<Result> {
      if (supabase) {
        const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return e ? { ok: false, error: authError(e.message, e.code) } : { ok: true };
      }
      const u = findByEmail(email);
      if (!u || u.password !== password) return { ok: false, error: 'invalid_credentials' };
      commit((d) => ({ ...d, users: d.users.map((x) => (x.id === u.id ? { ...x, lastActiveAt: nowIso() } : x)) }));
      saveSession({ userId: u.id });
      return { ok: true };
    },
    async signUp(input: SignUpInput): Promise<Result> {
      if (input.password.length < 8) return { ok: false, error: 'weak_password' };
      if (supabase) {
        const { data, error: e } = await supabase.auth.signUp({
          email: input.email.trim(),
          password: input.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: input.firstName,
              last_name: input.lastName,
              gender: input.gender,
              role: input.role,
              promo: input.promo ?? '',
              school: input.school ?? '',
              city: input.city ?? '',
              country: input.country ?? '',
            },
          },
        });
        if (e) return { ok: false, error: authError(e.message, e.code) };
        // Supabase answers without a session when e-mail confirmation is enabled (or the address is already used).
        return { ok: true, confirmEmail: !data.session };
      }
      if (findByEmail(input.email)) return { ok: false, error: 'email_taken' };
      const user: User = {
        ...input,
        email: input.email.trim(),
        id: demoId('u'),
        approved: false,
        createdAt: nowIso(),
        lastActiveAt: nowIso(),
        privacy: { showEmail: true, showPhone: false, showBirthday: true },
      };
      commit((d) => ({
        ...d,
        users: [...d.users, user],
        notifications: [
          ...d.users
            .filter((a) => a.role === 'admin')
            .map((a) => ({ id: demoId('n'), userId: a.id, kind: 'approval' as const, template: 'pendingOne' as const, params: { name: fullName(user) }, href: '/admin/approbations', createdAt: nowIso(), read: false })),
          ...d.notifications,
        ],
      }));
      saveSession({ userId: user.id });
      return { ok: true };
    },
    signOut() {
      if (supabase) supabase.auth.signOut();
      else saveSession(null);
    },
    /** Sends the reset e-mail (Supabase), or checks the address exists (demo). */
    async requestPasswordReset(email: string): Promise<Result> {
      if (supabase) {
        const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl });
        return e ? { ok: false, error: authError(e.message, e.code) } : { ok: true };
      }
      return findByEmail(email) ? { ok: true } : { ok: false, error: 'unknown_email' };
    },
    /** Demo only — simulates clicking the e-mailed link. */
    openRecoveryLink(email: string) {
      const u = findByEmail(email);
      if (u) saveSession({ userId: u.id, recovery: true });
    },
    async completeRecovery(password: string): Promise<Result> {
      if (password.length < 8) return { ok: false, error: 'weak_password' };
      if (!meId) return { ok: false, error: 'unknown_email' };
      if (supabase) {
        const { error: e } = await supabase.auth.updateUser({ password });
        if (e) return { ok: false, error: authError(e.message, e.code) };
        recoveryRef.current = false;
        setSession({ userId: meId });
        return { ok: true };
      }
      commit((d) => ({ ...d, users: d.users.map((u) => (u.id === meId ? { ...u, password } : u)) }));
      saveSession({ userId: meId });
      return { ok: true };
    },
    async changePassword(current: string, next: string): Promise<Result> {
      if (!me) return { ok: false, error: 'wrong_password' };
      if (next.length < 8) return { ok: false, error: 'weak_password' };
      if (supabase) {
        const check = await supabase.auth.signInWithPassword({ email: me.email, password: current });
        if (check.error) return { ok: false, error: 'wrong_password' };
        const { error: e } = await supabase.auth.updateUser({ password: next });
        return e ? { ok: false, error: authError(e.message, e.code) } : { ok: true };
      }
      if (me.password !== current) return { ok: false, error: 'wrong_password' };
      commit((d) => ({ ...d, users: d.users.map((u) => (u.id === me.id ? { ...u, password: next } : u)) }));
      return { ok: true };
    },

    // ——— Profile ———
    updateProfile(patch: ProfilePatch) {
      if (!meId) return;
      commit((d) => ({ ...d, users: d.users.map((u) => (u.id === meId ? { ...u, ...patch } : u)) }));
      if (supabase) send(supabase.from('profiles').update(profilePatchToRow(patch)).eq('id', meId));
    },
    updatePrivacy(patch: Partial<Privacy>) {
      if (!meId) return;
      commit((d) => ({ ...d, users: d.users.map((u) => (u.id === meId ? { ...u, privacy: { ...u.privacy, ...patch } } : u)) }));
      if (supabase) send(supabase.from('profiles').update(profilePatchToRow({ privacy: patch as Privacy })).eq('id', meId));
    },
    async deleteMyAccount(): Promise<Result> {
      if (!meId) return { ok: false, error: 'unknown' };
      if (supabase) {
        const r = await callAdminApi('delete-self');
        if (!r.ok) return { ok: false, error: 'unknown' };
        await supabase.auth.signOut();
        return { ok: true };
      }
      commit((d) => removeUser(d, meId));
      saveSession(null);
      return { ok: true };
    },
    /** Uploads a picked image (Supabase) and returns the URL to store; the demo keeps the local URI. */
    async uploadImage(img: PickedImage, folder: string): Promise<string> {
      if (!supabase || !meId) return img.uri;
      return uploadImage(meId, img, folder);
    },

    // ——— Messaging ———
    /** Returns the conversation id, or null when messaging between the two roles is disabled. */
    conversationWith(otherId: string): string | null {
      const d = dbRef.current!;
      if (!canMessage(me, d.users.find((u) => u.id === otherId))) return null;
      const existing = d.conversations.find((c) => c.members.includes(meId!) && c.members.includes(otherId));
      if (existing) return existing.id;
      const id = makeId('c');
      const conv: Conversation = { id, members: [meId!, otherId], lastRead: { [meId!]: nowIso() } };
      commit((x) => ({ ...x, conversations: [...x.conversations, conv] }));
      if (supabase) send(supabase.from('conversations').insert({ id, members: conv.members, last_read: conv.lastRead }));
      return id;
    },
    sendMessage(conversationId: string, text: string) {
      const body = text.trim();
      if (!body || !meId) return;
      const at = nowIso();
      const id = makeId('m');
      commit((d) => {
        const conv = d.conversations.find((c) => c.id === conversationId);
        const other = conv?.members.find((m) => m !== meId);
        return {
          ...d,
          messages: [...d.messages, { id, conversationId, senderId: meId, text: body, createdAt: at }],
          conversations: d.conversations.map((c) => (c.id === conversationId ? { ...c, lastRead: { ...c.lastRead, [meId]: at } } : c)),
          // Supabase writes the recipient's notification itself (database trigger).
          notifications:
            other && !supabase
              ? [{ id: demoId('n'), userId: other, kind: 'message', template: 'message', params: { name: fullName(me!) }, href: `/messages/${conversationId}`, createdAt: at, read: false }, ...d.notifications]
              : d.notifications,
        };
      });
      if (supabase) {
        const conv = dbRef.current?.conversations.find((c) => c.id === conversationId);
        send(supabase.from('messages').insert({ id, conversation_id: conversationId, sender_id: meId, text: body }));
        if (conv) send(supabase.from('conversations').update({ last_read: conv.lastRead }).eq('id', conversationId));
      }
    },
    markConversationRead(conversationId: string) {
      if (!meId) return;
      const conv = dbRef.current?.conversations.find((c) => c.id === conversationId);
      const last = dbRef.current?.messages.filter((m) => m.conversationId === conversationId).at(-1);
      if (!conv || !last || (conv.lastRead[meId] ?? '') >= last.createdAt) return;
      const lastRead = { ...conv.lastRead, [meId]: nowIso() };
      commit((d) => ({ ...d, conversations: d.conversations.map((c) => (c.id === conversationId ? { ...c, lastRead } : c)) }));
      if (supabase) send(supabase.from('conversations').update({ last_read: lastRead }).eq('id', conversationId));
    },
    reportConversation(conversationId: string, reason: string) {
      if (!meId) return;
      const report = { by: meId, reason, at: nowIso() };
      commit((d) => ({ ...d, conversations: d.conversations.map((c) => (c.id === conversationId ? { ...c, report } : c)) }));
      if (supabase) send(supabase.from('conversations').update({ report }).eq('id', conversationId));
    },

    // ——— Events & galleries ———
    async addPhotos(eventId: string, images: PickedImage[]): Promise<number> {
      if (!meId || !images.length) return 0;
      let uris = images.map((i) => i.uri);
      if (supabase) {
        try {
          uris = await Promise.all(images.map((img) => uploadImage(meId, img, `events/${eventId}`)));
        } catch (e) {
          setError((e as Error).message);
          return 0;
        }
      }
      const rows = uris.map((uri) => ({ id: makeId('p'), eventId, uri, uploadedBy: meId, createdAt: nowIso() }));
      commit((d) => ({ ...d, photos: [...rows, ...d.photos] }));
      if (supabase) send(supabase.from('event_photos').insert(rows.map((r) => ({ id: r.id, event_id: r.eventId, uri: r.uri, uploaded_by: r.uploadedBy }))));
      return rows.length;
    },
    deletePhoto(photoId: string) {
      commit((d) => {
        const p = d.photos.find((x) => x.id === photoId);
        const ev = d.events.find((e) => e.id === p?.eventId);
        const next = { ...d, photos: d.photos.filter((x) => x.id !== photoId) };
        return me?.role === 'admin' && p?.uploadedBy !== meId ? log(next, 'delete_photo', ev?.title ?? '') : next;
      });
      if (supabase) send(supabase.from('event_photos').delete().eq('id', photoId));
    },
    createEvent(e: Omit<LfkEvent, 'id' | 'createdBy'>) {
      const ev: LfkEvent = { ...e, id: makeId('e'), createdBy: meId! };
      if (supabase) send(supabase.from('events').insert(eventRow(ev)));
      commit((d) => log({ ...d, events: [...d.events, ev] }, 'create_event', e.title));
      return ev.id;
    },
    deleteEvent(id: string) {
      commit((d) => {
        const ev = d.events.find((e) => e.id === id);
        return log({ ...d, events: d.events.filter((e) => e.id !== id), photos: d.photos.filter((p) => p.eventId !== id) }, 'delete_event', ev?.title ?? id);
      });
      if (supabase) send(supabase.from('events').delete().eq('id', id));
    },

    // ——— Publications ———
    createPublication(p: Omit<Publication, 'id' | 'authorId' | 'date'>) {
      const pub: Publication = { ...p, id: makeId('pub'), authorId: meId!, date: nowIso() };
      if (supabase) send(supabase.from('publications').insert(publicationRow(pub)));
      commit((d) => log({ ...d, publications: [pub, ...d.publications] }, 'create_publication', p.title));
      return pub.id;
    },
    deletePublication(id: string) {
      commit((d) => {
        const p = d.publications.find((x) => x.id === id);
        return log({ ...d, publications: d.publications.filter((x) => x.id !== id) }, 'delete_publication', p?.title ?? id);
      });
      if (supabase) send(supabase.from('publications').delete().eq('id', id));
    },

    // ——— Promos ———
    setPromoWhatsapp(year: number, url: string) {
      commit((d) => {
        const exists = d.promos.some((p) => p.year === year);
        const promos = exists ? d.promos.map((p) => (p.year === year ? { ...p, whatsapp: url || undefined } : p)) : [...d.promos, { year, whatsapp: url || undefined }];
        return { ...d, promos };
      });
      if (supabase) send(supabase.from('promos').upsert({ year, whatsapp: url || null }));
    },

    // ——— Admin ———
    approveUser(id: string) {
      commit((d) => {
        const u = d.users.find((x) => x.id === id);
        return log(
          {
            ...d,
            users: d.users.map((x) => (x.id === id ? { ...x, approved: true } : x)),
            notifications: supabase
              ? d.notifications
              : [{ id: demoId('n'), userId: id, kind: 'approval', template: 'approved', href: '/', createdAt: nowIso(), read: false }, ...d.notifications],
          },
          'approve',
          fullName(u)
        );
      });
      if (supabase) send(supabase.from('profiles').update({ approved: true }).eq('id', id));
    },
    async refuseUser(id: string): Promise<Result> {
      return actions.removeAccount(id, 'refuse');
    },
    async deleteUser(id: string): Promise<Result> {
      return actions.removeAccount(id, 'delete_user');
    },
    async removeAccount(id: string, action: 'refuse' | 'delete_user'): Promise<Result> {
      const name = fullName(dbRef.current?.users.find((x) => x.id === id));
      if (supabase) {
        const r = await callAdminApi('delete-user', { userId: id, logAction: action, name });
        if (!r.ok) return { ok: false, error: 'unknown' };
        commit((d) => ({ ...removeUser(d, id), logs: [{ id: newId(), actorId: meId!, action, target: name, createdAt: nowIso() }, ...d.logs] }));
        return { ok: true };
      }
      commit((d) => log(removeUser(d, id), action, name));
      return { ok: true };
    },
    async createUser(input: SignUpInput): Promise<Result> {
      if (input.password.length < 8) return { ok: false, error: 'weak_password' };
      if (supabase) {
        const r = await callAdminApi('create-user', { ...input, email: input.email.trim() });
        if (!r.ok) return { ok: false, error: authError(r.error, r.error) };
        await reload();
        return { ok: true };
      }
      if (findByEmail(input.email)) return { ok: false, error: 'email_taken' };
      const user: User = {
        ...input,
        email: input.email.trim(),
        id: demoId('u'),
        approved: true,
        createdAt: nowIso(),
        lastActiveAt: nowIso(),
        privacy: { showEmail: true, showPhone: false, showBirthday: true },
      };
      commit((d) => log({ ...d, users: [...d.users, user] }, 'create_user', fullName(user)));
      return { ok: true };
    },
    setFonction(id: string, fonction: string) {
      const value = fonction.trim() || undefined;
      commit((d) => ({ ...d, users: d.users.map((x) => (x.id === id ? { ...x, fonction: value } : x)) }));
      if (supabase) send(supabase.from('profiles').update({ fonction: value ?? null }).eq('id', id));
    },
    setRole(id: string, role: Role) {
      commit((d) => {
        const u = d.users.find((x) => x.id === id);
        return log({ ...d, users: d.users.map((x) => (x.id === id ? { ...x, role } : x)) }, 'change_role', fullName(u), { role });
      });
      if (supabase) send(supabase.from('profiles').update({ role }).eq('id', id));
    },
    async adminResetPassword(id: string, password: string): Promise<Result> {
      if (password.length < 8) return { ok: false, error: 'weak_password' };
      const name = fullName(dbRef.current?.users.find((x) => x.id === id));
      if (supabase) {
        const r = await callAdminApi('reset-password', { userId: id, password, name });
        if (!r.ok) return { ok: false, error: authError(r.error, r.error) };
        commit((d) => ({ ...d, logs: [{ id: newId(), actorId: meId!, action: 'reset_password', target: name, createdAt: nowIso() }, ...d.logs] }));
        return { ok: true };
      }
      commit((d) => log({ ...d, users: d.users.map((x) => (x.id === id ? { ...x, password } : x)) }, 'reset_password', name));
      return { ok: true };
    },
    openReportedConversation(id: string) {
      commit((d) => {
        const c = d.conversations.find((x) => x.id === id);
        const names = c?.members.map((m) => fullName(d.users.find((u) => u.id === m))).join(' ↔ ') ?? id;
        return log(d, 'open_reported_conversation', names);
      });
    },
    resolveReport(id: string) {
      let report: Conversation['report'];
      commit((d) => {
        const c = d.conversations.find((x) => x.id === id);
        report = c?.report ? { ...c.report, resolved: true } : undefined;
        const names = c?.members.map((m) => fullName(d.users.find((u) => u.id === m))).join(' ↔ ') ?? id;
        return log({ ...d, conversations: d.conversations.map((x) => (x.id === id && report ? { ...x, report } : x)) }, 'resolve_report', names);
      });
      if (supabase && report) send(supabase.from('conversations').update({ report }).eq('id', id));
    },
    setContactRead(id: string, read: boolean) {
      commit((d) => ({ ...d, contacts: d.contacts.map((c) => (c.id === id ? { ...c, read } : c)) }));
      if (supabase) send(supabase.from('contacts').update({ read }).eq('id', id));
    },
    deleteContact(id: string) {
      commit((d) => ({ ...d, contacts: d.contacts.filter((c) => c.id !== id) }));
      if (supabase) send(supabase.from('contacts').delete().eq('id', id));
    },
    submitContact(c: { name: string; email: string; subject: string; message: string }) {
      if (supabase) {
        // Visitors can write to the contact inbox but not read it back.
        send(supabase.from('contacts').insert(c));
        return;
      }
      commit((d) => ({ ...d, contacts: [{ ...c, id: demoId('ct'), createdAt: nowIso(), read: false }, ...d.contacts] }));
    },

    // ——— Notifications ———
    markNotificationsRead() {
      if (!meId) return;
      commit((d) => ({ ...d, notifications: d.notifications.map((n) => (n.userId === meId ? { ...n, read: true } : n)) }));
      if (supabase) send(supabase.from('notifications').update({ read: true }).eq('user_id', meId).eq('read', false));
    },

    // ——— Demo ———
    resetDemo() {
      if (supabase) return;
      const fresh = createSeed();
      setAll(fresh);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)).catch(() => {});
      saveSession(null);
    },
    clearError() {
      setError(null);
    },
    reload,
  };

  return { ready: db !== null, db: (db ?? EMPTY_DB) as Db, session, me, actions, error, isRemote };
}

function removeUser(d: Db, id: string): Db {
  const convIds = new Set(d.conversations.filter((c) => c.members.includes(id)).map((c) => c.id));
  return {
    ...d,
    users: d.users.filter((u) => u.id !== id),
    conversations: d.conversations.filter((c) => !convIds.has(c.id)),
    messages: d.messages.filter((m) => !convIds.has(m.conversationId)),
    photos: d.photos.filter((p) => p.uploadedBy !== id),
    notifications: d.notifications.filter((n) => n.userId !== id),
  };
}

type Store = ReturnType<typeof useStoreValue>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

/** For screens that only render once signed in. */
export function useMe() {
  const { me } = useStore();
  return me!;
}

// ——— Selectors ———

export function useUserMap() {
  const { db } = useStore();
  return useMemo(() => new Map(db.users.map((u) => [u.id, u])), [db.users]);
}

export function useApprovedMembers() {
  const { db } = useStore();
  return useMemo(() => db.users.filter((u) => u.approved), [db.users]);
}

export function useInbox() {
  const { db, me } = useStore();
  return useMemo(() => {
    if (!me) return { threads: [], unread: 0 };
    const threads = db.conversations
      .filter((c) => c.members.includes(me.id))
      .map((c) => {
        const msgs = db.messages.filter((m) => m.conversationId === c.id);
        const last = msgs.at(-1);
        const otherId = c.members.find((m) => m !== me.id)!;
        const readAt = c.lastRead[me.id] ?? '';
        const unread = msgs.filter((m) => m.senderId !== me.id && m.createdAt > readAt).length;
        return { conversation: c, otherId, last, unread };
      })
      .filter((t) => t.last)
      .sort((a, b) => (b.last!.createdAt > a.last!.createdAt ? 1 : -1));
    return { threads, unread: threads.reduce((a, t) => a + t.unread, 0) };
  }, [db.conversations, db.messages, me]);
}

/** Members whose birthday falls within the next `days` days, soonest first. */
export function useUpcomingBirthdays(days = 30) {
  const members = useApprovedMembers();
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return members
      .filter((u) => u.birthDate && u.privacy.showBirthday)
      .map((u) => {
        const [, m, d] = u.birthDate!.split('-').map(Number);
        let next = new Date(today.getFullYear(), m - 1, d);
        if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
        const inDays = Math.round((next.getTime() - today.getTime()) / 86_400_000);
        return { user: u, date: next, inDays };
      })
      .filter((b) => b.inDays <= days)
      .sort((a, b) => a.inDays - b.inDays);
  }, [members, days]);
}

export function useUnreadNotifications() {
  const { db, me } = useStore();
  return useMemo(() => (me ? db.notifications.filter((n) => n.userId === me.id && !n.read).length : 0), [db.notifications, me]);
}
