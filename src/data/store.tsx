import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { canMessage } from './permissions';
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
 * Local demo backend. Every screen goes through the actions below, so swapping this file for a
 * Supabase-backed implementation (see supabase/schema.sql) does not change the UI.
 */

const STORAGE_KEY = 'lfk.demo.db.v3';
const SESSION_KEY = 'lfk.demo.session.v1';

export type AuthError = 'invalid_credentials' | 'email_taken' | 'weak_password' | 'unknown_email' | 'wrong_password';
type Result = { ok: true } | { ok: false; error: AuthError };

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
};

export type ProfilePatch = Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'birthDate' | 'school' | 'promo' | 'city' | 'country' | 'avatar' | 'bio'>>;

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();
export const fullName = (u?: Pick<User, 'firstName' | 'lastName'>) => (u ? `${u.firstName} ${u.lastName}` : '');

function useStoreValue() {
  const [db, setDb] = useState<Db | null>(null);
  const [session, setSession] = useState<Session>(null);
  const dbRef = useRef<Db | null>(null);

  useEffect(() => {
    (async () => {
      let loaded: Db | null = null;
      let s: Session = null;
      try {
        const [raw, rawSession] = await Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(SESSION_KEY)]);
        if (raw) loaded = JSON.parse(raw);
        if (rawSession) s = JSON.parse(rawSession);
      } catch {}
      const next = loaded ?? createSeed();
      dbRef.current = next;
      setDb(next);
      setSession(s && next.users.some((u) => u.id === s!.userId) ? s : null);
    })();
  }, []);

  const commit = useCallback((fn: (d: Db) => Db) => {
    const cur = dbRef.current;
    if (!cur) return;
    const next = fn(cur);
    dbRef.current = next;
    setDb(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const saveSession = useCallback((s: Session) => {
    setSession(s);
    if (s) AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s)).catch(() => {});
    else AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  }, []);

  const me = db && session ? db.users.find((u) => u.id === session.userId) ?? null : null;
  const meId = me?.id;

  const log = useCallback(
    (d: Db, action: AdminLogAction, target: string, meta?: AdminLog['meta']): Db =>
      meId ? { ...d, logs: [{ id: uid('l'), actorId: meId, action, target, meta, createdAt: nowIso() }, ...d.logs] } : d,
    [meId]
  );

  const findByEmail = (email: string) => dbRef.current?.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  const actions = {
    // ——— Auth ———
    signIn(email: string, password: string): Result {
      const u = findByEmail(email);
      if (!u || u.password !== password) return { ok: false, error: 'invalid_credentials' };
      commit((d) => ({ ...d, users: d.users.map((x) => (x.id === u.id ? { ...x, lastActiveAt: nowIso() } : x)) }));
      saveSession({ userId: u.id });
      return { ok: true };
    },
    signUp(input: SignUpInput): Result {
      if (findByEmail(input.email)) return { ok: false, error: 'email_taken' };
      if (input.password.length < 8) return { ok: false, error: 'weak_password' };
      const user: User = {
        ...input,
        email: input.email.trim(),
        id: uid('u'),
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
            .map((a) => ({ id: uid('n'), userId: a.id, kind: 'approval' as const, template: 'pendingOne' as const, params: { name: fullName(user) }, href: '/admin/approbations', createdAt: nowIso(), read: false })),
          ...d.notifications,
        ],
      }));
      saveSession({ userId: user.id });
      return { ok: true };
    },
    signOut() {
      saveSession(null);
    },
    /** In production this sends an e-mail; the demo returns whether the address exists. */
    requestPasswordReset(email: string): Result {
      return findByEmail(email) ? { ok: true } : { ok: false, error: 'unknown_email' };
    },
    /** Simulates clicking the e-mail link: opens a recovery session. */
    openRecoveryLink(email: string) {
      const u = findByEmail(email);
      if (u) saveSession({ userId: u.id, recovery: true });
    },
    completeRecovery(password: string): Result {
      if (password.length < 8) return { ok: false, error: 'weak_password' };
      if (!meId) return { ok: false, error: 'unknown_email' };
      commit((d) => ({ ...d, users: d.users.map((u) => (u.id === meId ? { ...u, password } : u)) }));
      saveSession({ userId: meId });
      return { ok: true };
    },
    changePassword(current: string, next: string): Result {
      if (!me || me.password !== current) return { ok: false, error: 'wrong_password' };
      if (next.length < 8) return { ok: false, error: 'weak_password' };
      commit((d) => ({ ...d, users: d.users.map((u) => (u.id === me.id ? { ...u, password: next } : u)) }));
      return { ok: true };
    },

    // ——— Profile ———
    updateProfile(patch: ProfilePatch) {
      if (!meId) return;
      commit((d) => ({ ...d, users: d.users.map((u) => (u.id === meId ? { ...u, ...patch } : u)) }));
    },
    updatePrivacy(patch: Partial<Privacy>) {
      if (!meId) return;
      commit((d) => ({ ...d, users: d.users.map((u) => (u.id === meId ? { ...u, privacy: { ...u.privacy, ...patch } } : u)) }));
    },
    deleteMyAccount() {
      if (!meId) return;
      commit((d) => removeUser(d, meId));
      saveSession(null);
    },

    // ——— Messaging ———
    /** Returns the conversation id, or null when messaging between the two roles is disabled. */
    conversationWith(otherId: string): string | null {
      const d = dbRef.current!;
      if (!canMessage(me, d.users.find((u) => u.id === otherId))) return null;
      const existing = d.conversations.find((c) => c.members.includes(meId!) && c.members.includes(otherId));
      if (existing) return existing.id;
      const id = uid('c');
      const conv: Conversation = { id, members: [meId!, otherId], lastRead: { [meId!]: nowIso() } };
      commit((x) => ({ ...x, conversations: [...x.conversations, conv] }));
      return id;
    },
    sendMessage(conversationId: string, text: string) {
      const body = text.trim();
      if (!body || !meId) return;
      const at = nowIso();
      commit((d) => {
        const conv = d.conversations.find((c) => c.id === conversationId);
        const other = conv?.members.find((m) => m !== meId);
        return {
          ...d,
          messages: [...d.messages, { id: uid('m'), conversationId, senderId: meId, text: body, createdAt: at }],
          conversations: d.conversations.map((c) => (c.id === conversationId ? { ...c, lastRead: { ...c.lastRead, [meId]: at } } : c)),
          notifications: other
            ? [{ id: uid('n'), userId: other, kind: 'message', template: 'message', params: { name: fullName(me!) }, href: `/messages/${conversationId}`, createdAt: at, read: false }, ...d.notifications]
            : d.notifications,
        };
      });
    },
    markConversationRead(conversationId: string) {
      if (!meId) return;
      const conv = dbRef.current?.conversations.find((c) => c.id === conversationId);
      const last = dbRef.current?.messages.filter((m) => m.conversationId === conversationId).at(-1);
      if (!conv || !last || (conv.lastRead[meId] ?? '') >= last.createdAt) return;
      commit((d) => ({ ...d, conversations: d.conversations.map((c) => (c.id === conversationId ? { ...c, lastRead: { ...c.lastRead, [meId]: nowIso() } } : c)) }));
    },
    reportConversation(conversationId: string, reason: string) {
      if (!meId) return;
      commit((d) => ({ ...d, conversations: d.conversations.map((c) => (c.id === conversationId ? { ...c, report: { by: meId, reason, at: nowIso() } } : c)) }));
    },

    // ——— Events & galleries ———
    addPhotos(eventId: string, uris: string[]) {
      if (!meId || !uris.length) return;
      commit((d) => ({ ...d, photos: [...uris.map((uri) => ({ id: uid('p'), eventId, uri, uploadedBy: meId, createdAt: nowIso() })), ...d.photos] }));
    },
    deletePhoto(photoId: string) {
      commit((d) => {
        const p = d.photos.find((x) => x.id === photoId);
        const ev = d.events.find((e) => e.id === p?.eventId);
        const next = { ...d, photos: d.photos.filter((x) => x.id !== photoId) };
        return me?.role === 'admin' && p?.uploadedBy !== meId ? log(next, 'delete_photo', ev?.title ?? '') : next;
      });
    },
    createEvent(e: Omit<LfkEvent, 'id' | 'createdBy'>) {
      const id = uid('e');
      commit((d) => log({ ...d, events: [...d.events, { ...e, id, createdBy: meId! }] }, 'create_event', e.title));
      return id;
    },
    deleteEvent(id: string) {
      commit((d) => {
        const ev = d.events.find((e) => e.id === id);
        return log({ ...d, events: d.events.filter((e) => e.id !== id), photos: d.photos.filter((p) => p.eventId !== id) }, 'delete_event', ev?.title ?? id);
      });
    },

    // ——— Publications ———
    createPublication(p: Omit<Publication, 'id' | 'authorId' | 'date'>) {
      const id = uid('pub');
      commit((d) => log({ ...d, publications: [{ ...p, id, authorId: meId!, date: nowIso() }, ...d.publications] }, 'create_publication', p.title));
      return id;
    },
    deletePublication(id: string) {
      commit((d) => {
        const p = d.publications.find((x) => x.id === id);
        return log({ ...d, publications: d.publications.filter((x) => x.id !== id) }, 'delete_publication', p?.title ?? id);
      });
    },

    // ——— Promos ———
    setPromoWhatsapp(year: number, url: string) {
      commit((d) => {
        const exists = d.promos.some((p) => p.year === year);
        const promos = exists ? d.promos.map((p) => (p.year === year ? { ...p, whatsapp: url || undefined } : p)) : [...d.promos, { year, whatsapp: url || undefined }];
        return { ...d, promos };
      });
    },

    // ——— Admin ———
    approveUser(id: string) {
      commit((d) => {
        const u = d.users.find((x) => x.id === id);
        return log(
          {
            ...d,
            users: d.users.map((x) => (x.id === id ? { ...x, approved: true } : x)),
            notifications: [{ id: uid('n'), userId: id, kind: 'approval', template: 'approved', href: '/', createdAt: nowIso(), read: false }, ...d.notifications],
          },
          'approve',
          fullName(u)
        );
      });
    },
    refuseUser(id: string) {
      commit((d) => log(removeUser(d, id), 'refuse', fullName(d.users.find((x) => x.id === id))));
    },
    createUser(input: SignUpInput): Result {
      if (findByEmail(input.email)) return { ok: false, error: 'email_taken' };
      if (input.password.length < 8) return { ok: false, error: 'weak_password' };
      const user: User = {
        ...input,
        email: input.email.trim(),
        id: uid('u'),
        approved: true,
        createdAt: nowIso(),
        lastActiveAt: nowIso(),
        privacy: { showEmail: true, showPhone: false, showBirthday: true },
      };
      commit((d) => log({ ...d, users: [...d.users, user] }, 'create_user', fullName(user)));
      return { ok: true };
    },
    setFonction(id: string, fonction: string) {
      commit((d) => ({ ...d, users: d.users.map((x) => (x.id === id ? { ...x, fonction: fonction.trim() || undefined } : x)) }));
    },
    setRole(id: string, role: Role) {
      commit((d) => {
        const u = d.users.find((x) => x.id === id);
        return log({ ...d, users: d.users.map((x) => (x.id === id ? { ...x, role } : x)) }, 'change_role', fullName(u), { role });
      });
    },
    adminResetPassword(id: string, password: string): Result {
      if (password.length < 8) return { ok: false, error: 'weak_password' };
      commit((d) => log({ ...d, users: d.users.map((x) => (x.id === id ? { ...x, password } : x)) }, 'reset_password', fullName(d.users.find((x) => x.id === id))));
      return { ok: true };
    },
    deleteUser(id: string) {
      commit((d) => log(removeUser(d, id), 'delete_user', fullName(d.users.find((x) => x.id === id))));
    },
    openReportedConversation(id: string) {
      commit((d) => {
        const c = d.conversations.find((x) => x.id === id);
        const names = c?.members.map((m) => fullName(d.users.find((u) => u.id === m))).join(' ↔ ') ?? id;
        return log(d, 'open_reported_conversation', names);
      });
    },
    resolveReport(id: string) {
      commit((d) => {
        const c = d.conversations.find((x) => x.id === id);
        const names = c?.members.map((m) => fullName(d.users.find((u) => u.id === m))).join(' ↔ ') ?? id;
        return log({ ...d, conversations: d.conversations.map((x) => (x.id === id && x.report ? { ...x, report: { ...x.report, resolved: true } } : x)) }, 'resolve_report', names);
      });
    },
    setContactRead(id: string, read: boolean) {
      commit((d) => ({ ...d, contacts: d.contacts.map((c) => (c.id === id ? { ...c, read } : c)) }));
    },
    deleteContact(id: string) {
      commit((d) => ({ ...d, contacts: d.contacts.filter((c) => c.id !== id) }));
    },
    submitContact(c: { name: string; email: string; subject: string; message: string }) {
      commit((d) => ({ ...d, contacts: [{ ...c, id: uid('ct'), createdAt: nowIso(), read: false }, ...d.contacts] }));
    },

    // ——— Notifications ———
    markNotificationsRead() {
      if (!meId) return;
      commit((d) => ({ ...d, notifications: d.notifications.map((n) => (n.userId === meId ? { ...n, read: true } : n)) }));
    },

    // ——— Demo ———
    resetDemo() {
      const fresh = createSeed();
      dbRef.current = fresh;
      setDb(fresh);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)).catch(() => {});
      saveSession(null);
    },
  };

  return { ready: db !== null, db: db as Db, session, me, actions };
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
