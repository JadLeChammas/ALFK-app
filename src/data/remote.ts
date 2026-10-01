import * as Crypto from 'expo-crypto';

import { apiBase, supabase } from '@/lib/supabase';
import type {
  AdminLog,
  AppNotification,
  ContactMessage,
  Conversation,
  Db,
  EventPhoto,
  Institution,
  KeyDate,
  LfkEvent,
  Message,
  Promo,
  Publication,
  User,
} from './types';

/** Supabase ⇄ app mapping. Rows are snake_case; the app's Db shape is camelCase. */

type Row = Record<string, any>;
const opt = <T,>(v: T | null | undefined) => (v === null || v === undefined ? undefined : v);

export const newId = () => Crypto.randomUUID();

export const EMPTY_DB: Db = { users: [], promos: [], events: [], photos: [], publications: [], conversations: [], messages: [], contacts: [], logs: [], notifications: [], institutions: [], keyDates: [], settings: {} };

export const toUser = (r: Row): User => ({
  id: r.id,
  firstName: r.first_name,
  lastName: r.last_name,
  email: r.email,
  password: '',
  gender: r.gender,
  role: r.role,
  approved: r.approved,
  promo: opt(r.promo),
  school: opt(r.school),
  situation: r.situation === 'working' || r.situation === 'student' ? r.situation : undefined,
  employer: opt(r.employer),
  jobTitle: opt(r.job_title),
  fonction: opt(r.fonction),
  alumniNumber: opt(r.alumni_number),
  bureauCode: opt(r.bureau_code),
  proof: r.proof_path ? { path: r.proof_path, name: r.proof_name ?? '', mimeType: opt(r.proof_mime), uploadedAt: r.proof_uploaded_at ?? r.created_at } : undefined,
  createdByAdmin: !!r.created_by_admin,
  fieldOfStudy: opt(r.field_of_study),
  mentor: r.mentor ?? undefined,
  city: opt(r.city),
  country: opt(r.country),
  phone: opt(r.phone),
  birthDate: opt(r.birth_date),
  avatar: opt(r.avatar),
  bio: opt(r.bio),
  createdAt: r.created_at,
  lastActiveAt: r.last_active_at,
  privacy: { showEmail: r.show_email, showPhone: r.show_phone, showBirthday: r.show_birthday },
});

const PROFILE_COLUMNS: Record<string, string> = {
  firstName: 'first_name',
  lastName: 'last_name',
  phone: 'phone',
  birthDate: 'birth_date',
  school: 'school',
  situation: 'situation',
  employer: 'employer',
  jobTitle: 'job_title',
  promo: 'promo',
  city: 'city',
  country: 'country',
  avatar: 'avatar',
  bio: 'bio',
  role: 'role',
  approved: 'approved',
  fonction: 'fonction',
  bureauCode: 'bureau_code',
  fieldOfStudy: 'field_of_study',
  mentor: 'mentor',
};

export function profilePatchToRow(patch: Partial<User>): Row {
  const row: Row = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'privacy' && v) {
      const p = v as User['privacy'];
      if (p.showEmail !== undefined) row.show_email = p.showEmail;
      if (p.showPhone !== undefined) row.show_phone = p.showPhone;
      if (p.showBirthday !== undefined) row.show_birthday = p.showBirthday;
    } else if (PROFILE_COLUMNS[k]) {
      row[PROFILE_COLUMNS[k]] = v === undefined ? null : v;
    }
  }
  return row;
}

const toPromo = (r: Row): Promo => ({ year: r.year, whatsapp: opt(r.whatsapp), groupPhoto: opt(r.group_photo) });
const toEvent = (r: Row): LfkEvent => ({ id: r.id, title: r.title, date: r.date, location: r.location, category: r.category, description: r.description, cover: r.cover, createdBy: r.created_by ?? '' });
const toPhoto = (r: Row): EventPhoto => ({ id: r.id, eventId: r.event_id, uri: r.uri, uploadedBy: r.uploaded_by ?? '', createdAt: r.created_at });
const toPublication = (r: Row): Publication => ({ id: r.id, title: r.title, category: r.category, date: r.date, cover: r.cover, excerpt: r.excerpt, body: r.body, authorId: r.author_id ?? '', status: r.status ?? 'published' });
const toInstitution = (r: Row): Institution => ({ id: r.id, name: r.name, description: r.description ?? '', logo: opt(r.logo), website: opt(r.website), order: r.sort_order ?? 0 });
const toKeyDate = (r: Row): KeyDate => ({ id: r.id, title: r.title, month: r.month, day: r.day, year: opt(r.year), category: r.category, endMonth: opt(r.end_month), endDay: opt(r.end_day), url: opt(r.url) });
export const toConversation = (r: Row): Conversation => ({ id: r.id, members: [r.members[0], r.members[1]], lastRead: r.last_read ?? {}, report: opt(r.report) });
export const toMessage = (r: Row): Message => ({ id: r.id, conversationId: r.conversation_id, senderId: r.sender_id ?? '', text: r.text, createdAt: r.created_at });
const toContact = (r: Row): ContactMessage => ({ id: r.id, name: r.name, email: r.email, subject: r.subject, message: r.message, createdAt: r.created_at, read: r.read });
const toLog = (r: Row): AdminLog => ({ id: r.id, actorId: r.actor_id ?? '', action: r.action, target: r.target, meta: opt(r.meta), createdAt: r.created_at });
export const toNotification = (r: Row): AppNotification => ({ id: r.id, userId: r.user_id, kind: r.kind, template: r.template, params: opt(r.params), href: opt(r.href), createdAt: r.created_at, read: r.read });

/** Loads everything this user is allowed to see (row-level security filters the rest). */
export async function loadDb(): Promise<Db> {
  const sb = supabase!;
  const all = async (table: string, order?: string) => {
    let q = sb.from(table).select('*');
    if (order) q = q.order(order, { ascending: true });
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  };
  // Tables added by migration 003: an empty list until it has been run, instead of breaking the app.
  const optional = (table: string) => all(table).catch(() => [] as Row[]);
  const [users, promos, events, photos, publications, conversations, messages, contacts, logs, notifications, institutions, keyDates, settings] = await Promise.all([
    all('profiles'),
    all('promos'),
    all('events', 'date'),
    all('event_photos', 'created_at'),
    all('publications', 'date'),
    all('conversations'),
    all('messages', 'created_at'),
    all('contacts'),
    all('admin_logs'),
    all('notifications'),
    optional('institutions'),
    optional('key_dates'),
    optional('app_settings'),
  ]);
  return {
    users: users.map(toUser),
    promos: promos.map(toPromo),
    events: events.map(toEvent),
    photos: photos.map(toPhoto).reverse(),
    publications: publications.map(toPublication),
    conversations: conversations.map(toConversation),
    messages: messages.map(toMessage),
    contacts: contacts.map(toContact),
    logs: logs.map(toLog),
    notifications: notifications.map(toNotification),
    institutions: institutions.map(toInstitution).sort((a, b) => a.order - b.order),
    keyDates: keyDates.map(toKeyDate),
    settings: Object.fromEntries(settings.map((s: Row) => [s.key, s.value])),
  };
}

// ——— Row builders for inserts ———

export const eventRow = (e: LfkEvent) => ({ id: e.id, title: e.title, date: e.date, location: e.location, category: e.category, description: e.description, cover: e.cover, created_by: e.createdBy });
export const publicationRow = (p: Publication) => ({ id: p.id, title: p.title, category: p.category, date: p.date, cover: p.cover, excerpt: p.excerpt, body: p.body, author_id: p.authorId, status: p.status });
export const institutionRow = (i: Institution) => ({ id: i.id, name: i.name, description: i.description, logo: i.logo ?? null, website: i.website ?? null, sort_order: i.order });
// Period and link columns only when used, so plain dates still save before migration 008.
export const keyDateRow = (k: KeyDate) => ({
  id: k.id, title: k.title, month: k.month, day: k.day, year: k.year ?? null, category: k.category,
  ...(k.endMonth && k.endDay ? { end_month: k.endMonth, end_day: k.endDay } : {}),
  ...(k.url ? { url: k.url } : {}),
});
export const logRow = (l: AdminLog) => ({ id: l.id, actor_id: l.actorId, action: l.action, target: l.target, meta: l.meta ?? null, created_at: l.createdAt });

// ——— Photo upload ———

export type PickedImage = { uri: string; base64?: string | null; mimeType?: string | null };

function base64ToBytes(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Uploads a picked image to the public "media" bucket under the user's folder; returns its URL. */
export async function uploadImage(userId: string, img: PickedImage, folder: string): Promise<string> {
  const sb = supabase!;
  const type = img.mimeType ?? 'image/jpeg';
  const ext = type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  let body: Uint8Array | Blob;
  if (img.base64) body = base64ToBytes(img.base64);
  else body = await (await fetch(img.uri)).blob();
  const path = `${userId}/${folder}/${newId()}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, body, { contentType: type, upsert: false });
  if (error) throw error;
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}

// ——— Proof of schooling (private bucket "proofs": the member uploads, only admins can read) ———

export type PickedDoc = { uri: string; name: string; mimeType?: string | null; file?: Blob | null; base64?: string | null; size?: number };

/** Uploads the proof into proofs/<userId>/…; returns the storage path saved on the profile. */
export async function uploadProof(userId: string, doc: PickedDoc): Promise<string> {
  const sb = supabase!;
  const ext = (doc.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const body = doc.file ?? (doc.base64 ? base64ToBytes(doc.base64) : await (await fetch(doc.uri)).arrayBuffer());
  const path = `${userId}/${newId()}.${ext}`;
  const { error } = await sb.storage.from('proofs').upload(path, body, { contentType: doc.mimeType ?? undefined, upsert: false });
  if (error) throw error;
  return path;
}

/** A link valid 10 minutes, for an admin reviewing a sign-up. */
export async function proofUrl(path: string): Promise<string | null> {
  const { data } = await supabase!.storage.from('proofs').createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

// ——— Server-side admin actions (api/admin.ts) ———

export type AdminApiResult = { ok: true } | { ok: false; error: string };

export async function callAdminApi(action: string, payload: Record<string, unknown> = {}): Promise<AdminApiResult> {
  const { data } = await supabase!.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, error: 'unauthorized' };
  try {
    const res = await fetch(`${apiBase}/api/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...payload }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    return res.ok ? { ok: true } : { ok: false, error: json.error ?? `http_${res.status}` };
  } catch {
    return { ok: false, error: 'network' };
  }
}
