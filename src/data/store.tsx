import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { isRemote, supabase } from '@/lib/supabase';
import { applyRoleRules, contactError, FIRST_ALUMNI_NUMBER, isValidBureauCode, LFK_SCHOOL, properFirstName } from './members';
import { can, canMessage, SELF_SIGNUP_ROLES } from './permissions';
import { parseAliases } from './places';
import { sortPartners } from './partners';
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
  toUser,
  loadProfiles,
  toMessage,
  toCircleMessage,
  toUrgentMessage,
  urgentMessageRow,
  toClubPost,
  toNotification,
  institutionRow,
  keyDateRow,
  proofUrl,
  uploadImage,
  uploadProof,
  uploadSignupFiles,
  uploadMailAttachment,
  callEmailApi,
  uploadCvFile,
  cvFileUrl,
  type PickedDoc,
  type PickedImage,
} from './remote';
import { createSeed } from './seed';
import type {
  AdminLog,
  AdminLogAction,
  Conversation,
  Db,
  Club,
  ClubMember,
  ClubPost,
  UrgentMessage,
  Gender,
  Grade,
  Institution,
  KeyDate,
  LfkEvent,
  Situation,
  Privacy,
  OtherSchool,
  Publication,
  Question,
  QuestionTopic,
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

export { properFirstName };

const STORAGE_KEY = 'lfk.demo.db.v13';
const SESSION_KEY = 'lfk.demo.session.v1';

export type AuthError =
  | 'invalid_credentials'
  | 'email_taken'
  | 'weak_password'
  | 'unknown_email'
  | 'wrong_password'
  | 'birth_date'
  | 'phone'
  | 'invalid_code'
  | 'code_taken'
  | 'proof'
  | 'email_not_confirmed'
  | 'unknown';
/** `detail`: the server's own message, shown to admins when the error has no translation. */
export type Result = { ok: true; confirmEmail?: boolean } | { ok: false; error: AuthError; detail?: string };

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
  /** "+965 12345678" — required except for honorary members. */
  phone?: string;
  /** YYYY-MM-DD — required except for honorary members. */
  birthDate?: string;
  /** Admin-created Bureau members only. */
  bureauCode?: string;
  /** Alumni: field of study, used by the orientation space. */
  fieldOfStudy?: string;
  /** Alumni: studying or working (then company and position). */
  situation?: Situation;
  employer?: string;
  jobTitle?: string;
  /** Same as on the profile: nationalities, a few words, and (alumni) accepting student questions. */
  nationalities?: string[];
  bio?: string;
  mentor?: boolean;
  otherSchools?: OtherSchool[];
  fields?: string[];
  schoolCountry?: string;
  /** Students: their class. */
  grade?: Grade;
  /** Accepts the Amicale's news by email; language of the emails. */
  marketing?: boolean;
  locale?: 'fr' | 'en';
};

export type ProfilePatch = Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'birthDate' | 'school' | 'promo' | 'city' | 'country' | 'avatar' | 'bio' | 'fieldOfStudy' | 'mentor' | 'situation' | 'employer' | 'jobTitle' | 'cv' | 'nationalities' | 'otherSchools' | 'fields' | 'schoolCountry' | 'needsCompletion'>>;

const demoId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const makeId = (p: string) => (isRemote ? newId() : demoId(p));
const nowIso = () => new Date().toISOString();
/** Last names are always shown in capitals (« Jad EL CHAMMAS »). */
export const upperName = (s: string) => s.toLocaleUpperCase('fr');
export const fullName = (u?: Pick<User, 'firstName' | 'lastName'>) => (u ? `${properFirstName(u.firstName)} ${upperName(u.lastName)}` : '');

function authError(message?: string, code?: string): AuthError {
  const m = `${code ?? ''} ${message ?? ''}`.toLowerCase();
  if (m.includes('birth_date')) return 'birth_date';
  if (m.includes('phone')) return 'phone';
  if (m.includes('code_taken') || m.includes('bureau_code')) return 'code_taken';
  if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) return 'email_not_confirmed';
  if (m.includes('invalid login') || m.includes('invalid_credentials')) return 'invalid_credentials';
  if (m.includes('already') || m.includes('email_exists') || m.includes('email_taken')) return 'email_taken';
  if (m.includes('weak') || m.includes('password should')) return 'weak_password';
  return 'unknown';
}

function useStoreValue() {
  const [db, setDb] = useState<Db | null>(null);
  const [session, setSession] = useState<Session>(null);
  const [error, setError] = useState<string | null>(null);
  // The sign-up proof and photo are still being sent: the pending screen says so instead of « not received ».
  const [sendingSignupFiles, setSendingSignupFiles] = useState(false);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_posts' }, (p) => {
        if (p.eventType === 'DELETE') {
          const id = (p.old as { id?: string }).id;
          commit((d) => ({ ...d, clubPosts: d.clubPosts.filter((x) => x.id !== id) }));
          return;
        }
        const m = toClubPost(p.new);
        commit((d) => (d.clubPosts.some((x) => x.id === m.id) ? d : { ...d, clubPosts: [...d.clubPosts, m] }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'circle_messages' }, (p) => {
        if (p.eventType === 'DELETE') {
          const id = (p.old as { id?: string }).id;
          commit((d) => ({ ...d, circleMessages: d.circleMessages.filter((x) => x.id !== id) }));
          return;
        }
        const m = toCircleMessage(p.new);
        commit((d) => (d.circleMessages.some((x) => x.id === m.id) ? d : { ...d, circleMessages: [...d.circleMessages, m] }));
      })
      // Urgent messages: a new one pops up at once; the admins also see when they are read.
      .on('postgres_changes', { event: '*', schema: 'public', table: 'urgent_messages' }, (p) => {
        if (p.eventType === 'DELETE') {
          const id = (p.old as { id?: string }).id;
          commit((d) => ({ ...d, urgentMessages: (d.urgentMessages ?? []).filter((x) => x.id !== id) }));
          return;
        }
        const m = toUrgentMessage(p.new);
        commit((d) => {
          const list = d.urgentMessages ?? [];
          return { ...d, urgentMessages: list.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : [...list, m] };
        });
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

  /** Supabase: uploads the proof to the private bucket and records it on the profile. */
  const saveProof = async (userId: string, doc: PickedDoc) => {
    const { path, type } = await uploadProof(userId, doc);
    const row = { proof_path: path, proof_name: doc.name.slice(0, 200), proof_mime: type, proof_uploaded_at: nowIso() };
    const { error: e } = await supabase!.from('profiles').update(row).eq('id', userId);
    if (e) throw e;
    return path;
  };

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
    async signUp(input: SignUpInput, proof: PickedDoc | null, photo?: PickedImage | null): Promise<Result> {
      if (input.password.length < 8) return { ok: false, error: 'weak_password' };
      if (!proof) return { ok: false, error: 'proof' };
      if (!SELF_SIGNUP_ROLES.includes(input.role)) return { ok: false, error: 'unknown' };
      const contact = contactError(input.role, input.birthDate, input.phone);
      if (contact) return { ok: false, error: contact };
      if (input.role === 'eleve') input = { ...input, school: LFK_SCHOOL };
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
              phone: input.phone ?? '',
              birth_date: input.birthDate ?? '',
              field_of_study: input.fieldOfStudy ?? '',
              situation: input.situation ?? '',
              employer: input.employer ?? '',
              job_title: input.jobTitle ?? '',
              nationalities: input.nationalities ?? [],
              bio: input.bio ?? '',
              mentor: input.mentor ? 'true' : '',
              other_schools: input.otherSchools ?? [],
              fields_of_study: input.fields ?? [],
              school_country: input.schoolCountry ?? '',
              grade: input.role === 'eleve' ? input.grade ?? '' : '',
            },
          },
        });
        if (e) return { ok: false, error: authError(e.message, e.code) };
        // The proof and the photo go up now, with or without a session (e-mail to confirm). When the
        // address was already used, Supabase answers with a placeholder account and nothing is sent.
        if (data.user?.identities?.length) {
          setSendingSignupFiles(true);
          try {
            await uploadSignupFiles(data.user.id, input.email, proof, photo);
          } catch {
            // The account exists; the pending screen offers to send the proof again.
          }
          // « Inscription reçue » to the member, alert to the admins — only once the address is confirmed
          // (otherwise after the code, see verifyEmailCode).
          if (data.session) await callEmailApi('signup-notify', { userId: data.user.id, email: input.email, locale: input.locale ?? 'fr', marketing: !!input.marketing }, false);
          if (data.session) await reload();
          setSendingSignupFiles(false);
        }
        if (!data.session || !data.user) return { ok: true, confirmEmail: true };
        return { ok: true };
      }
      if (findByEmail(input.email)) return { ok: false, error: 'email_taken' };
      const draft: User = {
        ...input,
        bureauCode: undefined,
        proof: proof ? { path: proof.uri, name: proof.name, mimeType: proof.mimeType ?? undefined, uploadedAt: nowIso() } : undefined,
        avatar: photo?.uri,
        email: input.email.trim(),
        id: demoId('u'),
        approved: false,
        createdAt: nowIso(),
        lastActiveAt: nowIso(),
        privacy: { showEmail: true, showPhone: false, showBirthday: true },
      };
      const [numbered, user] = withRules(dbRef.current!, draft);
      commit(() => ({
        ...numbered,
        users: [...numbered.users, user],
        notifications: [
          ...numbered.users
            .filter((a) => a.role === 'admin')
            .map((a) => ({ id: demoId('n'), userId: a.id, kind: 'approval' as const, template: 'pendingOne' as const, params: { name: fullName(user) }, href: '/admin/approbations', createdAt: nowIso(), read: false })),
          ...numbered.notifications,
        ],
      }));
      saveSession({ userId: user.id });
      return { ok: true };
    },
    /**
     * The code e-mailed to confirm the address (sign-up, or a sign-in before confirming). Right, it signs
     * the member in; after a sign-up, the request then goes to the admins.
     */
    async verifyEmailCode(email: string, code: string, extras?: { locale?: 'fr' | 'en'; marketing?: boolean }): Promise<Result> {
      if (!supabase) return { ok: true };
      const { data, error: e } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
      if (e || !data.user) return { ok: false, error: 'invalid_code', detail: e?.message };
      await callEmailApi('signup-notify', { userId: data.user.id, email: email.trim(), locale: extras?.locale ?? 'fr', marketing: extras?.marketing ?? true }, false);
      await reload();
      return { ok: true };
    },
    async resendEmailCode(email: string): Promise<Result> {
      if (!supabase) return { ok: true };
      const { error: e } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
      return e ? { ok: false, error: 'unknown', detail: e.message } : { ok: true };
    },
    signOut() {
      if (supabase) supabase.auth.signOut();
      else saveSession(null);
    },
    /** Sends the reset e-mail (Supabase), or checks the address exists (demo). */
    async requestPasswordReset(email: string): Promise<Result> {
      if (supabase) {
        const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl });
        // The e-mail service's own message too (« Error sending recovery email », a rate limit…).
        return e ? { ok: false, error: authError(e.message, e.code), detail: e.message } : { ok: true };
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
    /** Saves the signed-in member's profile after checking the membership rules. */
    updateProfile(patch: ProfilePatch): Result {
      if (!me) return { ok: false, error: 'unknown' };
      const merged = { ...me, ...patch };
      const contact = contactError(me.role, merged.birthDate, merged.phone);
      if (contact) return { ok: false, error: contact };
      const safe: ProfilePatch = me.role === 'eleve' ? { ...patch, school: LFK_SCHOOL } : patch;
      commit((d) => ({ ...d, users: d.users.map((u) => (u.id === me.id ? { ...u, ...safe } : u)) }));
      if (supabase) send(supabase.from('profiles').update(profilePatchToRow(safe)).eq('id', me.id));
      return { ok: true };
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
    /** Shows a new profile photo at once on this device, while it is being uploaded. */
    previewAvatar(uri: string) {
      if (!meId) return;
      commit((d) => ({ ...d, users: d.users.map((u) => (u.id === meId ? { ...u, avatar: uri } : u)) }));
    },
    /** Uploads a CV as a PDF and returns the path to store in `cv.file` (the demo keeps the local URI). */
    async uploadCvFile(doc: PickedDoc): Promise<string> {
      if (!supabase || !meId) return doc.uri;
      return uploadCvFile(meId, doc);
    },
    /** Opens link for an uploaded CV. */
    async cvFileUrl(path: string): Promise<string | null> {
      return supabase ? cvFileUrl(path) : path;
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
      // The « new message » notifications of this conversation are read too.
      const href = `/messages/${conversationId}`;
      if (dbRef.current?.notifications.some((n) => n.userId === meId && !n.read && n.href === href)) {
        commit((d) => ({ ...d, notifications: d.notifications.map((n) => (n.userId === meId && n.href === href ? { ...n, read: true } : n)) }));
        if (supabase) send(supabase.from('notifications').update({ read: true }).eq('user_id', meId).eq('href', href).eq('read', false));
      }
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
    /**
     * Admins and school leadership publish directly; every other member's announcement waits for an admin.
     * Returns the new id and whether it is pending.
     */
    createPublication(p: Omit<Publication, 'id' | 'authorId' | 'date' | 'status'>, authorId?: string) {
      const direct = can(me, 'publish');
      // Admins may publish in someone else's name (« publié par le président »).
      const author = me?.role === 'admin' && authorId ? authorId : meId!;
      const pub: Publication = { ...p, id: makeId('pub'), authorId: author, date: nowIso(), status: direct ? 'published' : 'pending' };
      const sb = supabase;
      if (sb) {
        // The database only accepts one's own name on creation; an admin then sets the author.
        const row = publicationRow({ ...pub, authorId: meId! });
        if (author === meId) send(sb.from('publications').insert(row));
        else
          Promise.resolve(sb.from('publications').insert(row)).then(({ error: e }) => {
            if (e) return setError(e.message);
            send(sb.from('publications').update({ author_id: author }).eq('id', pub.id));
          });
      }
      commit((d) => {
        const next = { ...d, publications: [pub, ...d.publications] };
        if (direct) return log(next, 'create_publication', p.title);
        // Demo: tell the admins (Supabase does it with a database trigger).
        if (supabase) return next;
        const alerts = d.users
          .filter((a) => a.role === 'admin' && a.approved)
          .map((a) => ({ id: demoId('n'), userId: a.id, kind: 'publication' as const, template: 'publicationToReview' as const, params: { title: pub.title }, href: '/admin/contenus', createdAt: nowIso(), read: false }));
        return { ...next, notifications: [...alerts, ...next.notifications] };
      });
      return { id: pub.id, pending: !direct };
    },
    /** Admins: publish or reject a member's announcement. */
    reviewPublication(id: string, decision: 'published' | 'rejected') {
      commit((d) => {
        const p = d.publications.find((x) => x.id === id);
        if (!p) return d;
        const next = {
          ...d,
          publications: d.publications.map((x) => (x.id === id ? { ...x, status: decision, date: decision === 'published' ? nowIso() : x.date } : x)),
          notifications: supabase
            ? d.notifications
            : [{ id: demoId('n'), userId: p.authorId, kind: 'publication' as const, template: decision === 'published' ? ('publicationApproved' as const) : ('publicationRejected' as const), params: { title: p.title }, href: `/publications/${id}`, createdAt: nowIso(), read: false }, ...d.notifications],
        };
        return log(next, decision === 'published' ? 'approve_publication' : 'reject_publication', p.title);
      });
      if (supabase) send(supabase.from('publications').update({ status: decision, ...(decision === 'published' ? { date: nowIso() } : {}) }).eq('id', id));
    },
    /**
     * Admins and the author edit a publication. A member who cannot publish directly sends it back to
     * the admins (pending again); returns whether it is pending.
     */
    updatePublication(id: string, patch: Pick<Publication, 'title' | 'excerpt' | 'body' | 'cover' | 'category'> & { authorId?: string }) {
      const p = dbRef.current?.publications.find((x) => x.id === id);
      if (!p) return { pending: false };
      const reviewAgain = !can(me, 'publish') && me?.role !== 'admin';
      const status = reviewAgain ? 'pending' : p.status;
      // Only admins change who the publication is signed by.
      const authorId = me?.role === 'admin' && patch.authorId ? patch.authorId : p.authorId;
      commit((d) => ({ ...d, publications: d.publications.map((x) => (x.id === id ? { ...x, ...patch, authorId, status } : x)) }));
      if (supabase) send(supabase.from('publications').update({ title: patch.title, excerpt: patch.excerpt, body: patch.body, cover: patch.cover, category: patch.category, status, author_id: authorId }).eq('id', id));
      return { pending: status === 'pending' };
    },
    deletePublication(id: string) {
      commit((d) => {
        const p = d.publications.find((x) => x.id === id);
        return log({ ...d, publications: d.publications.filter((x) => x.id !== id) }, 'delete_publication', p?.title ?? id);
      });
      if (supabase) send(supabase.from('publications').delete().eq('id', id));
    },

    // ——— Clubs ———
    /** An alumnus proposes a club; it waits for an admin. The creator becomes its manager. */
    proposeClub(input: { name: string; description: string; cover?: string }) {
      if (!meId) return;
      const club: Club = { id: makeId('club'), name: input.name.trim(), description: input.description.trim(), cover: input.cover || undefined, status: 'pending', createdBy: meId, createdAt: nowIso() };
      const manager: ClubMember = { clubId: club.id, userId: meId, role: 'manager', status: 'active', createdAt: nowIso() };
      commit((d) => ({ ...d, clubs: [...d.clubs, club], clubMembers: [...d.clubMembers, manager] }));
      // The database makes the creator manager by itself (trigger, migration 033).
      if (supabase) send(supabase.from('clubs').insert({ id: club.id, name: club.name, description: club.description, cover: club.cover ?? null, status: 'pending', created_by: meId }));
    },
    /** Admins: approve or refuse a proposed club. */
    reviewClub(id: string, status: 'approved' | 'rejected') {
      commit((d) => ({ ...d, clubs: d.clubs.map((c) => (c.id === id ? { ...c, status } : c)) }));
      if (supabase) send(supabase.from('clubs').update({ status }).eq('id', id));
    },
    updateClub(id: string, patch: { name: string; description: string; cover?: string }) {
      const next = { name: patch.name.trim(), description: patch.description.trim(), cover: patch.cover || undefined };
      commit((d) => ({ ...d, clubs: d.clubs.map((c) => (c.id === id ? { ...c, ...next } : c)) }));
      if (supabase) send(supabase.from('clubs').update({ name: next.name, description: next.description, cover: next.cover ?? null }).eq('id', id));
    },
    deleteClub(id: string) {
      commit((d) => ({ ...d, clubs: d.clubs.filter((c) => c.id !== id), clubMembers: d.clubMembers.filter((m) => m.clubId !== id), clubPosts: d.clubPosts.filter((p) => p.clubId !== id) }));
      if (supabase) send(supabase.from('clubs').delete().eq('id', id));
    },
    /** Asks to join (a manager accepts). */
    requestToJoinClub(clubId: string) {
      if (!meId) return;
      const m: ClubMember = { clubId, userId: meId, role: 'member', status: 'pending', createdAt: nowIso() };
      commit((d) => ({ ...d, clubMembers: [...d.clubMembers.filter((x) => !(x.clubId === clubId && x.userId === meId)), m] }));
      if (supabase) send(supabase.from('club_members').insert({ club_id: clubId, user_id: meId, role: 'member', status: 'pending' }));
    },
    /** Leaving, cancelling a request, or (managers) removing someone / refusing a request. */
    removeClubMember(clubId: string, userId: string) {
      commit((d) => ({ ...d, clubMembers: d.clubMembers.filter((x) => !(x.clubId === clubId && x.userId === userId)) }));
      if (supabase) send(supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', userId));
    },
    /** Managers: accept a request, or name / unname a co-manager. */
    updateClubMember(clubId: string, userId: string, patch: Partial<Pick<ClubMember, 'role' | 'status'>>) {
      commit((d) => ({ ...d, clubMembers: d.clubMembers.map((x) => (x.clubId === clubId && x.userId === userId ? { ...x, ...patch } : x)) }));
      if (supabase) send(supabase.from('club_members').update(patch).eq('club_id', clubId).eq('user_id', userId));
    },
    postToClub(clubId: string, kind: ClubPost['kind'], text: string) {
      const body = text.trim();
      if (!meId || !body) return;
      const p: ClubPost = { id: makeId('cp'), clubId, authorId: meId, kind, text: body, createdAt: nowIso() };
      commit((d) => ({ ...d, clubPosts: [...d.clubPosts, p] }));
      if (supabase) send(supabase.from('club_posts').insert({ id: p.id, club_id: clubId, author_id: meId, kind, text: body }));
    },
    deleteClubPost(id: string) {
      commit((d) => ({ ...d, clubPosts: d.clubPosts.filter((p) => p.id !== id) }));
      if (supabase) send(supabase.from('club_posts').delete().eq('id', id));
    },

    // ——— Honorary members' circle ———
    postCircleMessage(text: string) {
      const body = text.trim();
      if (!meId || !body) return;
      const m = { id: makeId('cm'), authorId: meId, text: body, createdAt: nowIso() };
      commit((d) => ({ ...d, circleMessages: [...d.circleMessages, m] }));
      if (supabase) send(supabase.from('circle_messages').insert({ id: m.id, author_id: meId, text: body }));
    },
    deleteCircleMessage(id: string) {
      commit((d) => ({ ...d, circleMessages: d.circleMessages.filter((x) => x.id !== id) }));
      if (supabase) send(supabase.from('circle_messages').delete().eq('id', id));
    },

    // ——— Anonymous questions ———
    /** Students: ask a question. It stays hidden until an admin publishes it; the name is never shown. */
    askQuestion(text: string, topic: QuestionTopic) {
      if (!meId) return;
      const q: Question = { id: makeId('q'), text, topic, status: 'pending', createdAt: nowIso(), authorId: meId };
      if (supabase) send(supabase.rpc('ask_question', { p_id: q.id, p_text: text, p_topic: topic }));
      commit((d) => {
        const next = { ...d, questions: [q, ...d.questions] };
        if (supabase) return next;
        const alerts = d.users
          .filter((a) => a.role === 'admin' && a.approved)
          .map((a) => ({ id: demoId('n'), userId: a.id, kind: 'question' as const, template: 'questionToReview' as const, params: { title: text.slice(0, 80) }, href: '/admin/questions', createdAt: nowIso(), read: false }));
        return { ...next, notifications: [...alerts, ...next.notifications] };
      });
    },
    /** Admins: publish (possibly after rewording, e.g. to remove a detail that gives the author away) or reject. */
    reviewQuestion(id: string, decision: 'published' | 'rejected', text?: string) {
      const at = nowIso();
      commit((d) => {
        const q = d.questions.find((x) => x.id === id);
        if (!q) return d;
        const title = (text ?? q.text).slice(0, 80);
        const next = {
          ...d,
          questions: d.questions.map((x) => (x.id === id ? { ...x, status: decision, text: text ?? x.text, publishedAt: decision === 'published' ? at : x.publishedAt } : x)),
        };
        if (!supabase) {
          const alerts = [
            ...(q.authorId ? [{ userId: q.authorId, template: decision === 'published' ? ('questionPublished' as const) : ('questionRejected' as const) }] : []),
            ...(decision === 'published' ? d.users.filter((u) => u.role === 'alumni' && u.approved).map((u) => ({ userId: u.id, template: 'questionNew' as const })) : []),
          ].map((a) => ({ id: demoId('n'), ...a, kind: 'question' as const, params: { title }, href: `/questions/${id}`, createdAt: at, read: false }));
          next.notifications = [...alerts, ...d.notifications];
        }
        return log(next, decision === 'published' ? 'approve_question' : 'reject_question', title);
      });
      if (supabase) send(supabase.from('questions').update({ status: decision, ...(text ? { text } : {}), ...(decision === 'published' ? { published_at: at } : {}) }).eq('id', id));
    },
    deleteQuestion(id: string) {
      commit((d) => ({ ...d, questions: d.questions.filter((x) => x.id !== id), answers: d.answers.filter((a) => a.questionId !== id) }));
      if (supabase) send(supabase.from('questions').delete().eq('id', id));
    },
    /** Alumni: answer a published question (answers are signed). */
    answerQuestion(questionId: string, text: string) {
      if (!meId) return;
      const a = { id: makeId('a'), questionId, authorId: meId, text, createdAt: nowIso() };
      if (supabase) send(supabase.from('answers').insert({ id: a.id, question_id: questionId, author_id: meId, text }));
      commit((d) => {
        const next = { ...d, answers: [...d.answers, a] };
        const q = d.questions.find((x) => x.id === questionId);
        if (supabase || !q?.authorId || q.authorId === meId) return next;
        return { ...next, notifications: [{ id: demoId('n'), userId: q.authorId, kind: 'question' as const, template: 'questionAnswered' as const, params: { title: q.text.slice(0, 80) }, href: `/questions/${questionId}`, createdAt: a.createdAt, read: false }, ...next.notifications] };
      });
    },
    deleteAnswer(id: string) {
      commit((d) => ({ ...d, answers: d.answers.filter((a) => a.id !== id) }));
      if (supabase) send(supabase.from('answers').delete().eq('id', id));
    },

    // ——— Promos ———
    setPromoWhatsapp(year: number, url: string) {
      commit((d) => {
        const exists = d.promos.some((p) => p.year === year);
        const promos = exists ? d.promos.map((p) => (p.year === year ? { ...p, whatsapp: url || undefined } : p)) : [...d.promos, { year, whatsapp: url || undefined }];
        return { ...d, promos };
      });
      // Through a function: since migration 035 the links can't be read (so neither upserted) from the table directly.
      if (supabase) send(supabase.rpc('set_promo_whatsapp', { p_year: year, p_url: url }));
    },

    // ——— Admin ———
    /** Pending members: send (or replace) the proof of schooling. */
    async submitProof(doc: PickedDoc): Promise<Result> {
      if (!meId) return { ok: false, error: 'unknown' };
      let path = doc.uri;
      if (supabase) {
        try {
          path = await saveProof(meId, doc);
        } catch {
          return { ok: false, error: 'unknown' };
        }
      }
      const proof = { path, name: doc.name, mimeType: doc.mimeType ?? undefined, uploadedAt: nowIso() };
      commit((d) => ({ ...d, users: d.users.map((u) => (u.id === meId ? { ...u, proof } : u)) }));
      return { ok: true };
    },
    /** Admins: a link to open a member's proof (temporary signed link with Supabase). */
    async openProof(userId: string): Promise<string | null> {
      const u = dbRef.current?.users.find((x) => x.id === userId);
      if (!u?.proof) return null;
      return supabase ? proofUrl(u.proof.path) : u.proof.path;
    },
    /** Approval requires the proof of schooling (accounts created by an admin are exempt). */
    approveUser(id: string): Result {
      const target = dbRef.current?.users.find((x) => x.id === id);
      if (!target) return { ok: false, error: 'unknown' };
      // Honorary members have no proof of schooling.
      if (!target.proof && !target.createdByAdmin) return { ok: false, error: 'proof' };
      actions.approveUserNow(id);
      return { ok: true };
    },
    approveUserNow(id: string) {
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
      if (supabase) {
        // Approved in the database first, then the « compte validé » email.
        Promise.resolve(supabase.from('profiles').update({ approved: true }).eq('id', id)).then(({ error: e }) => {
          if (e) {
            setError(e.message);
            reload();
          } else callEmailApi('approved', { userId: id }).catch(() => {});
        });
      }
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
        // Gone from the screen at once; the server then deletes the account and its proof.
        commit((d) => ({ ...removeUser(d, id), logs: [{ id: newId(), actorId: meId!, action, target: name, createdAt: nowIso() }, ...d.logs] }));
        const r = await callAdminApi('delete-user', { userId: id, logAction: action, name });
        if (!r.ok) {
          reload();
          return { ok: false, error: 'unknown', detail: r.error };
        }
        return { ok: true };
      }
      commit((d) => log(removeUser(d, id), action, name));
      return { ok: true };
    },
    /** Admins: give another member a new password (server: api/admin.ts). Demo: changed locally. */
    async setUserPassword(id: string, password: string): Promise<Result> {
      if (password.length < 8) return { ok: false, error: 'weak_password' };
      const target = dbRef.current?.users.find((x) => x.id === id);
      if (supabase) {
        const r = await callAdminApi('set-password', { userId: id, password, name: fullName(target) });
        return r.ok ? { ok: true } : { ok: false, error: authError(r.error, r.error), detail: r.error };
      }
      commit((d) => log({ ...d, users: d.users.map((x) => (x.id === id ? { ...x, password } : x)) }, 'reset_password', fullName(target)));
      return { ok: true };
    },
    async createUser(input: SignUpInput): Promise<Result> {
      if (input.password.length < 8) return { ok: false, error: 'weak_password' };
      const contact = contactError(input.role, input.birthDate, input.phone);
      if (contact) return { ok: false, error: contact };
      if (input.role !== 'admin') input = { ...input, bureauCode: undefined };
      if (input.bureauCode) {
        if (!isValidBureauCode(input.bureauCode)) return { ok: false, error: 'invalid_code' };
        if (dbRef.current?.users.some((u) => u.bureauCode === input.bureauCode)) return { ok: false, error: 'code_taken' };
      }
      if (input.role === 'eleve') input = { ...input, school: LFK_SCHOOL };
      if (supabase) {
        const r = await callAdminApi('create-user', { ...input, email: input.email.trim() });
        if (!r.ok) return { ok: false, error: authError(r.error, r.error), detail: r.error };
        await reload();
        return { ok: true };
      }
      if (findByEmail(input.email)) return { ok: false, error: 'email_taken' };
      const draft: User = {
        ...input,
        email: input.email.trim(),
        id: demoId('u'),
        approved: true,
        createdAt: nowIso(),
        lastActiveAt: nowIso(),
        privacy: { showEmail: true, showPhone: false, showBirthday: true },
      };
      const [numbered, user] = withRules(dbRef.current!, draft);
      commit(() => log({ ...numbered, users: [...numbered.users, user] }, 'create_user', fullName(user)));
      return { ok: true };
    },
    // ——— Emails ———
    /** The member's own choice: receive the Amicale's news by email (Brevo lists follow). */
    setMarketing(on: boolean) {
      if (!meId) return;
      commit((d) => ({ ...d, users: d.users.map((x) => (x.id === meId ? { ...x, marketingOptIn: on } : x)) }));
      if (supabase) callEmailApi('marketing', { on }).then((r) => {
        if (!r.ok) reload();
      });
    },
    /** Language of the emails, following the language chosen on the site. */
    setLocale(locale: 'fr' | 'en') {
      if (!meId) return;
      commit((d) => ({ ...d, users: d.users.map((x) => (x.id === meId ? { ...x, locale } : x)) }));
      if (supabase) send(supabase.from('profiles').update({ locale }).eq('id', meId));
    },
    async emailStatus() {
      if (!supabase) return { ok: false, configured: false, lists: false, sender: '' };
      return callEmailApi<{ configured: boolean; lists: boolean; sender: string }>('status');
    },
    async uploadMailAttachment(doc: PickedDoc) {
      if (!supabase || !meId) return { path: doc.uri, name: doc.name };
      return uploadMailAttachment(meId, doc);
    },
    /** An admin's email to groups of members (or a test to themself). Demo: nothing is sent. */
    async sendEmail(input: { audience: Role[]; subject: string; body: string; attachments: { path: string; name: string }[]; test?: boolean }) {
      if (!supabase) return { ok: false, error: 'demo', sent: 0 };
      return callEmailApi<{ sent: number }>('send', input);
    },
    async syncContacts() {
      if (!supabase) return { ok: false, error: 'demo' };
      return callEmailApi<{ alumni: number; eleves: number }>('sync-contacts');
    },
    saveEmailTemplates(templates: object | null) {
      const value = templates ? JSON.stringify(templates) : undefined;
      commit((d) => ({ ...d, settings: { ...d.settings, emailTemplates: value } }));
      if (supabase) send(supabase.from('app_settings').upsert({ key: 'emailTemplates', value: value ?? null }));
    },
    /** Admins: the proviseurs' and directors' timelines (data/schoolLeaders.ts). */
    saveSchoolLeaders(list: object[]) {
      const value = list.length ? JSON.stringify(list) : undefined;
      commit((d) => ({ ...d, settings: { ...d.settings, schoolLeaders: value } }));
      if (supabase) send(supabase.from('app_settings').upsert({ key: 'schoolLeaders', value: value ?? null }));
    },
    saveEmailSignature(text: string) {
      const value = text.trim() || undefined;
      commit((d) => ({ ...d, settings: { ...d.settings, emailSignature: value } }));
      if (supabase) send(supabase.from('app_settings').upsert({ key: 'emailSignature', value: value ?? null }));
    },
    /** Students: set the class (admins, e.g. for students who signed up before classes existed). */
    setGrade(id: string, grade: Grade) {
      commit((d) => ({ ...d, users: d.users.map((x) => (x.id === id ? { ...x, grade } : x)) }));
      if (supabase) send(supabase.from('profiles').update({ grade }).eq('id', id));
    },
    /**
     * New school year: Terminale → Alumni (they fill in their account before using the site),
     * Première → Terminale, Seconde → Première. One database call, all or nothing.
     */
    async promoteStudents(): Promise<{ ok: boolean; alumni: number; terminale: number; premiere: number }> {
      if (supabase) {
        const { data, error: e } = await supabase.rpc('promote_students');
        if (e) return { ok: false, alumni: 0, terminale: 0, premiere: 0 };
        await reload();
        const r = (data ?? {}) as { alumni?: number; terminale?: number; premiere?: number };
        return { ok: true, alumni: r.alumni ?? 0, terminale: r.terminale ?? 0, premiere: r.premiere ?? 0 };
      }
      const counts = { alumni: 0, terminale: 0, premiere: 0 };
      commit((d) => {
        let next = d;
        for (const u of d.users) {
          if (u.role !== 'eleve' || !u.grade) continue;
          if (u.grade === 'Tle') {
            counts.alumni++;
            const [numbered, updated] = withRules(next, { ...u, role: 'alumni', grade: undefined, school: undefined, schoolCountry: undefined, situation: undefined, needsCompletion: true });
            next = { ...numbered, users: numbered.users.map((x) => (x.id === u.id ? updated : x)) };
          } else {
            const grade: Grade = u.grade === '1ere' ? 'Tle' : '1ere';
            if (grade === 'Tle') counts.terminale++;
            else counts.premiere++;
            next = { ...next, users: next.users.map((x) => (x.id === u.id ? { ...x, grade } : x)) };
          }
        }
        return log(next, 'promote_students', '', counts);
      });
      return { ok: true, ...counts };
    },
    setFonction(id: string, fonction: string) {
      const value = fonction.trim() || undefined;
      commit((d) => ({ ...d, users: d.users.map((x) => (x.id === id ? { ...x, fonction: value } : x)) }));
      if (supabase) send(supabase.from('profiles').update({ fonction: value ?? null }).eq('id', id));
    },
    setRole(id: string, role: Role) {
      commit((d) => {
        const u = d.users.find((x) => x.id === id);
        if (!u) return d;
        // Demo: same rules as the database trigger (number, school, Bureau code).
        const [numbered, updated] = supabase ? [d, { ...u, role }] : withRules(d, { ...u, role });
        return log({ ...numbered, users: numbered.users.map((x) => (x.id === id ? updated : x)) }, 'change_role', fullName(u), { role });
      });
      if (supabase) {
        // The database assigns the Alumni number / school / Bureau code; read the row back.
        Promise.resolve(supabase.from('profiles').update({ role }).eq('id', id)).then(({ error: e }) => {
          if (e) {
            setError(e.message);
            reload();
          } else actions.refreshUser(id);
        });
      }
    },
    /** Bureau code: 4 digits, unique, admins (Bureau members) only. */
    async setBureauCode(id: string, code: string): Promise<Result> {
      const value = code.trim();
      const target = dbRef.current?.users.find((u) => u.id === id);
      if (!target || target.role !== 'admin') return { ok: false, error: 'unknown' };
      if (value && !isValidBureauCode(value)) return { ok: false, error: 'invalid_code' };
      if (value && dbRef.current?.users.some((u) => u.id !== id && u.bureauCode === value)) return { ok: false, error: 'code_taken' };
      if (supabase) {
        const { error: e } = await supabase.from('profiles').update({ bureau_code: value || null }).eq('id', id);
        if (e) return { ok: false, error: e.code === '23505' ? 'code_taken' : authError(e.message, e.code) };
      }
      commit((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, bureauCode: value || undefined } : u)) }));
      return { ok: true };
    },
    /** Supabase: re-reads one profile (after server-side rules changed it). */
    async refreshUser(id: string) {
      if (!supabase) return;
      const [data] = await loadProfiles(id).catch(() => []);
      if (data) commit((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? toUser(data) : u)) }));
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
    /** One notification, when it is opened. */
    markNotificationRead(id: string) {
      if (!meId || !dbRef.current?.notifications.some((n) => n.id === id && !n.read)) return;
      commit((d) => ({ ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
      if (supabase) send(supabase.from('notifications').update({ read: true }).eq('id', id));
    },
    markNotificationsRead() {
      if (!meId) return;
      commit((d) => ({ ...d, notifications: d.notifications.map((n) => (n.userId === meId ? { ...n, read: true } : n)) }));
      if (supabase) send(supabase.from('notifications').update({ read: true }).eq('user_id', meId).eq('read', false));
    },

    // ——— WhatsApp community, honorary institutions, calendar (admins) ———
    setWhatsappCommunity(url: string) {
      const value = url.trim() || undefined;
      commit((d) => ({ ...d, settings: { ...d.settings, whatsappCommunity: value } }));
      if (supabase) send(supabase.from('app_settings').upsert({ key: 'whatsappCommunity', value: value ?? null }));
    },
    /** Admins: show or hide the « Voir la démo » invitation to visitors. */
    setShowDemo(on: boolean) {
      const value = on ? 'on' : 'off';
      commit((d) => ({ ...d, settings: { ...d.settings, showDemo: value } }));
      if (supabase) send(supabase.from('app_settings').upsert({ key: 'showDemo', value }));
    },
    /** Admins: save the « Le LFK » page (history and fun facts). */
    saveLfkStory(story: object | null) {
      const value = story ? JSON.stringify(story) : undefined;
      commit((d) => ({ ...d, settings: { ...d.settings, lfkStory: value } }));
      if (supabase) send(supabase.from('app_settings').upsert({ key: 'lfkStory', value: value ?? null }));
    },
    /** Admins: save the end credits (null = back to the default ones). */
    saveCredits(config: object | null) {
      const value = config ? JSON.stringify(config) : undefined;
      commit((d) => ({ ...d, settings: { ...d.settings, credits: value } }));
      if (supabase) send(supabase.from('app_settings').upsert({ key: 'credits', value: value ?? null }));
    },
    /** Admins: save the country guides (null = back to the default France guide). */
    saveGuides(guides: object[] | null) {
      const value = guides ? JSON.stringify(guides) : undefined;
      commit((d) => ({ ...d, settings: { ...d.settings, guides: value } }));
      if (supabase) send(supabase.from('app_settings').upsert({ key: 'guides', value: value ?? null }));
    },
    /** Admins: treat `from` as the same university / company as `to` (or undo with `to` = null). */
    mergePlace(fromKey: string, toKey: string | null) {
      const current = parseAliases(dbRef.current?.settings.placeAliases);
      if (toKey && toKey !== fromKey) {
        current[fromKey] = toKey;
        // Merging back the other way replaces the earlier merge instead of making a loop.
        if (current[toKey] === fromKey) delete current[toKey];
      }
      else delete current[fromKey];
      const value = Object.keys(current).length ? JSON.stringify(current) : undefined;
      commit((d) => ({ ...d, settings: { ...d.settings, placeAliases: value } }));
      if (supabase) send(supabase.from('app_settings').upsert({ key: 'placeAliases', value: value ?? null }));
    },
    addInstitution(inst: Omit<Institution, 'id' | 'order'>) {
      const row: Institution = { ...inst, id: makeId('inst'), order: (dbRef.current?.institutions.length ?? 0) + 1 };
      commit((d) => ({ ...d, institutions: [...d.institutions, row] }));
      if (supabase) send(supabase.from('institutions').insert(institutionRow(row)));
    },
    /** Admins: change a partner (name, description, website, logo). */
    updateInstitution(id: string, patch: Partial<Omit<Institution, 'id' | 'order'>>) {
      commit((d) => ({ ...d, institutions: d.institutions.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
      const row = dbRef.current?.institutions.find((i) => i.id === id);
      if (supabase && row) send(supabase.from('institutions').update(institutionRow({ ...row, ...patch })).eq('id', id));
    },
    /** Admins: move a partner one place up (-1) or down (+1); the order is saved for everyone. */
    moveInstitution(id: string, delta: -1 | 1) {
      // Moved within the order shown on the page (Hi Dev always last, so it is left out of the swap).
      const list = sortPartners(dbRef.current?.institutions ?? []);
      const movable = [...list];
      const i = movable.findIndex((x) => x.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= movable.length) return;
      [movable[i], movable[j]] = [movable[j], movable[i]];
      // Orders become 1, 2, 3… in the new sequence.
      const renumbered = movable.map((x, k) => ({ ...x, order: k + 1 }));
      commit((d) => ({ ...d, institutions: renumbered }));
      if (supabase) for (const x of renumbered) send(supabase.from('institutions').update({ sort_order: x.order }).eq('id', x.id));
    },
    /** Admins: hide a partner (only admins still see it) or show it again to members and visitors. */
    setInstitutionHidden(id: string, hidden: boolean) {
      commit((d) => ({ ...d, institutions: d.institutions.map((i) => (i.id === id ? { ...i, hidden } : i)) }));
      if (supabase) send(supabase.from('institutions').update({ hidden }).eq('id', id));
    },
    /**
     * Admins: an urgent message to each of `userIds` — ready-made reasons (e.g. an invalid profile photo)
     * and/or the admin's own title and text. It pops up for them until they acknowledge it.
     */
    sendUrgentMessage(userIds: string[], msg: { title?: string; body?: string; reasons: string[] }) {
      if (!meId || !userIds.length) return;
      const createdAt = nowIso();
      const rows: UrgentMessage[] = userIds.map((userId) => ({ id: makeId('urg'), userId, title: msg.title || undefined, body: msg.body || undefined, reasons: msg.reasons, createdBy: meId, createdAt }));
      commit((d) => ({ ...d, urgentMessages: [...(d.urgentMessages ?? []), ...rows] }));
      if (supabase) send(supabase.from('urgent_messages').insert(rows.map(urgentMessageRow)));
    },
    /** The member read an urgent message (« J'ai compris »): it stops popping up. */
    acknowledgeUrgentMessage(id: string) {
      const at = nowIso();
      commit((d) => ({ ...d, urgentMessages: (d.urgentMessages ?? []).map((m) => (m.id === id ? { ...m, acknowledgedAt: at } : m)) }));
      if (supabase) send(supabase.from('urgent_messages').update({ acknowledged_at: at }).eq('id', id));
    },
    /** Admins: withdraw an urgent message (one recipient), read or not. */
    deleteUrgentMessage(id: string) {
      commit((d) => ({ ...d, urgentMessages: (d.urgentMessages ?? []).filter((m) => m.id !== id) }));
      if (supabase) send(supabase.from('urgent_messages').delete().eq('id', id));
    },
    deleteInstitution(id: string) {
      commit((d) => ({ ...d, institutions: d.institutions.filter((i) => i.id !== id) }));
      if (supabase) send(supabase.from('institutions').delete().eq('id', id));
    },
    addKeyDate(k: Omit<KeyDate, 'id'>) {
      const row: KeyDate = { ...k, id: makeId('kd') };
      commit((d) => ({ ...d, keyDates: [...d.keyDates, row] }));
      if (supabase) send(supabase.from('key_dates').insert(keyDateRow(row)));
    },
    deleteKeyDate(id: string) {
      commit((d) => ({ ...d, keyDates: d.keyDates.filter((k) => k.id !== id) }));
      if (supabase) send(supabase.from('key_dates').delete().eq('id', id));
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

  return { ready: db !== null, db: (db ?? EMPTY_DB) as Db, session, me, actions, error, isRemote, sendingSignupFiles };
}

/** Applies the membership rules to one user and advances the never-reused Alumni number counter. */
function withRules(d: Db, u: User): [Db, User] {
  let counter = Math.max(d.nextAlumniNumber ?? FIRST_ALUMNI_NUMBER, ...d.users.map((x) => Number(x.alumniNumber ?? 0) + 1));
  const next = applyRoleRules(u, () => String(counter++));
  return [{ ...d, nextAlumniNumber: counter }, next];
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

/** Announcements everyone can read (pending or rejected submissions stay with their author and the admins). */
export function usePublished() {
  const { db } = useStore();
  return useMemo(() => db.publications.filter((p) => p.status === 'published').sort((a, b) => (a.date < b.date ? 1 : -1)), [db.publications]);
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
