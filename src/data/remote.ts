import * as Crypto from 'expo-crypto';

import { ATTACHMENT_TYPES, checkUpload, CV_TYPES, extensionFor, IMAGE_TYPES, PROOF_TYPES } from '@/lib/fileSafety';
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
  Question,
  Answer,
  CircleMessage,
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

export const EMPTY_DB: Db = { users: [], promos: [], events: [], photos: [], publications: [], conversations: [], messages: [], contacts: [], logs: [], notifications: [], institutions: [], keyDates: [], questions: [], answers: [], circleMessages: [], settings: {} };

export const toUser = (r: Row): User => ({
  id: r.id,
  firstName: r.first_name,
  lastName: r.last_name,
  email: r.email ?? '',
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
  grade: r.grade === '2nde' || r.grade === '1ere' || r.grade === 'Tle' ? r.grade : undefined,
  needsCompletion: !!r.needs_completion,
  marketingOptIn: !!r.marketing_opt_in,
  locale: r.locale === 'en' ? 'en' : 'fr',
  fieldOfStudy: opt(r.field_of_study),
  fields: Array.isArray(r.fields_of_study) && r.fields_of_study.length ? r.fields_of_study : undefined,
  schoolCountry: opt(r.school_country),
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
  cv: opt(r.cv),
  otherSchools: Array.isArray(r.other_schools) && r.other_schools.length ? r.other_schools : undefined,
  nationalities: Array.isArray(r.nationalities) && r.nationalities.length ? r.nationalities : undefined,
});

const PROFILE_COLUMNS: Record<string, string> = {
  firstName: 'first_name',
  cv: 'cv',
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
  fields: 'fields_of_study',
  schoolCountry: 'school_country',
  nationalities: 'nationalities',
  otherSchools: 'other_schools',
  mentor: 'mentor',
  grade: 'grade',
  needsCompletion: 'needs_completion',
  locale: 'locale',
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
const toQuestion = (r: Row): Question => ({ id: r.id, text: r.text, topic: r.topic, status: r.status, createdAt: r.created_at, publishedAt: opt(r.published_at) });
export const toCircleMessage = (r: Row): CircleMessage => ({ id: r.id, authorId: opt(r.author_id), text: r.text, createdAt: r.created_at });
const toAnswer = (r: Row): Answer => ({ id: r.id, questionId: r.question_id, authorId: opt(r.author_id), text: r.text, createdAt: r.created_at });
const toKeyDate = (r: Row): KeyDate => ({ id: r.id, title: r.title, month: r.month, day: r.day, year: opt(r.year), category: r.category, endMonth: opt(r.end_month), endDay: opt(r.end_day), url: opt(r.url) });
export const toConversation = (r: Row): Conversation => ({ id: r.id, members: [r.members[0], r.members[1]], lastRead: r.last_read ?? {}, report: opt(r.report) });
export const toMessage = (r: Row): Message => ({ id: r.id, conversationId: r.conversation_id, senderId: r.sender_id ?? '', text: r.text, createdAt: r.created_at });
const toContact = (r: Row): ContactMessage => ({ id: r.id, name: r.name, email: r.email, subject: r.subject, message: r.message, createdAt: r.created_at, read: r.read });
const toLog = (r: Row): AdminLog => ({ id: r.id, actorId: r.actor_id ?? '', action: r.action, target: r.target, meta: opt(r.meta), createdAt: r.created_at });
export const toNotification = (r: Row): AppNotification => ({ id: r.id, userId: r.user_id, kind: r.kind, template: r.template, params: opt(r.params), href: opt(r.href), createdAt: r.created_at, read: r.read });

/** Profile columns any approved member may read (migration 031 limits direct reads to these). */
const PROFILE_PUBLIC_COLUMNS =
  'id, first_name, last_name, gender, role, approved, promo, school, fonction, city, country, avatar, bio, show_email, show_phone, show_birthday, ' +
  'created_at, last_active_at, alumni_number, created_by_admin, field_of_study, mentor, situation, employer, job_title, cv, nationalities, ' +
  'other_schools, fields_of_study, school_country, grade, needs_completion, locale';

/**
 * Profiles: the public columns, plus the private ones from member_private_fields() — e-mail, phone and
 * birth date only when the member shows them (always for oneself and for admins), proof of schooling,
 * Bureau code and news consent only for oneself and admins. `onlyId`: just that profile.
 */
export async function loadProfiles(onlyId?: string): Promise<Row[]> {
  const sb = supabase!;
  let q = sb.from('profiles').select(PROFILE_PUBLIC_COLUMNS);
  if (onlyId) q = q.eq('id', onlyId);
  const [{ data, error }, priv] = await Promise.all([q, sb.rpc('member_private_fields', onlyId ? { only_id: onlyId } : {})]);
  if (error) throw error;
  const extra = new Map(((priv.data ?? []) as Row[]).map((r) => [r.id, r]));
  return ((data ?? []) as Row[]).map((r) => ({ ...r, ...extra.get(r.id) }));
}

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
  const [users, promos, events, photos, publications, conversations, messages, contacts, logs, notifications, institutions, keyDates, settings, questions, questionAuthors, answers, circle] = await Promise.all([
    loadProfiles(),
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
    optional('questions'),
    optional('question_authors'),
    optional('answers'),
    optional('circle_messages'),
  ]);
  // Only the user's own questions (or all of them for admins) come back with an author.
  const askedBy = new Map(questionAuthors.map((r: Row) => [r.question_id, r.user_id]));
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
    questions: questions.map((r: Row) => ({ ...toQuestion(r), authorId: askedBy.get(r.id) })).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    answers: answers.map(toAnswer).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    circleMessages: circle.map(toCircleMessage).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
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
  let body: Uint8Array | Blob;
  if (img.base64) body = base64ToBytes(img.base64);
  else body = await (await fetch(img.uri)).blob();
  const type = await checkUpload(body, img.uri, img.mimeType, IMAGE_TYPES);
  const path = `${userId}/${folder}/${newId()}.${extensionFor(type)}`;
  const { error } = await sb.storage.from('media').upload(path, body, { contentType: type, upsert: false });
  if (error) throw error;
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}

/**
 * Checks a file as soon as it is picked (type, size, real contents), so a bad file is refused at once
 * instead of after the form is sent. Throws FileRejected.
 */
export async function checkPicked(file: PickedDoc | PickedImage, allowed: string[]): Promise<void> {
  const body =
    'file' in file && file.file ? file.file : file.base64 ? base64ToBytes(file.base64) : await (await fetch(file.uri)).arrayBuffer();
  await checkUpload(body, 'name' in file ? file.name : file.uri, file.mimeType, allowed);
}

// ——— Proof of schooling (private bucket "proofs": the member uploads, only admins can read) ———

export type PickedDoc = { uri: string; name: string; mimeType?: string | null; file?: Blob | null; base64?: string | null; size?: number };

/** Uploads the proof into proofs/<userId>/…; returns the storage path saved on the profile and the checked type. */
export async function uploadProof(userId: string, doc: PickedDoc): Promise<{ path: string; type: string }> {
  const sb = supabase!;
  const body = doc.file ?? (doc.base64 ? base64ToBytes(doc.base64) : await (await fetch(doc.uri)).arrayBuffer());
  const type = await checkUpload(body, doc.name, doc.mimeType, PROOF_TYPES);
  const path = `${userId}/${newId()}.${extensionFor(type)}`;
  const { error } = await sb.storage.from('proofs').upload(path, body, { contentType: type, upsert: false });
  if (error) throw error;
  return { path, type };
}

/**
 * The proof and the photo chosen in the sign-up form. Sent through one-time upload links from the
 * server (api/admin.ts, signup-upload / signup-finish): right after signing up there is often no
 * session yet, and a pending member cannot write to the photo bucket. Throws when it fails.
 */
export async function uploadSignupFiles(userId: string, email: string, proof: PickedDoc | null, photo?: PickedImage | null) {
  const sb = supabase!;
  const post = async (payload: Record<string, unknown>) => {
    const res = await fetch(`${apiBase}/api/admin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, email, ...payload }) });
    const json = (await res.json().catch(() => ({}))) as { error?: string; proof?: { path: string; token: string }; photo?: { path: string; token: string } };
    if (!res.ok) throw new Error(json.error ?? `http_${res.status}`);
    return json;
  };
  // Both files are checked before anything is sent.
  const proofBody = proof ? (proof.file ?? (proof.base64 ? base64ToBytes(proof.base64) : await (await fetch(proof.uri)).arrayBuffer())) : null;
  const proofType = proof && proofBody ? await checkUpload(proofBody, proof.name, proof.mimeType, PROOF_TYPES) : null;
  const photoBody = photo ? (photo.base64 ? base64ToBytes(photo.base64) : await (await fetch(photo.uri)).blob()) : null;
  const photoType = photo && photoBody ? await checkUpload(photoBody, photo.uri, photo.mimeType, IMAGE_TYPES) : null;
  const links = await post({ action: 'signup-upload', proofExt: proofType ? extensionFor(proofType) : undefined, photoExt: photoType ? extensionFor(photoType) : undefined });
  const done: Record<string, unknown> = {};
  if (proof && proofBody && proofType && links.proof) {
    const { error } = await sb.storage.from('proofs').uploadToSignedUrl(links.proof.path, links.proof.token, proofBody, { contentType: proofType });
    if (error) throw error;
    done.proof = { path: links.proof.path, name: proof.name, mime: proofType };
  }
  if (photoBody && photoType && links.photo) {
    const { error } = await sb.storage.from('media').uploadToSignedUrl(links.photo.path, links.photo.token, photoBody, { contentType: photoType });
    if (!error) done.photo = { path: links.photo.path };
  }
  if (done.proof || done.photo) await post({ action: 'signup-finish', ...done });
}

/** A link valid 10 minutes, for an admin reviewing a sign-up. */
export async function proofUrl(path: string): Promise<string | null> {
  const { data } = await supabase!.storage.from('proofs').createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

// ——— Uploaded CVs (private bucket "cvs": the member uploads, approved members can read) ———

export async function uploadCvFile(userId: string, doc: PickedDoc): Promise<string> {
  const sb = supabase!;
  const body = doc.file ?? (doc.base64 ? base64ToBytes(doc.base64) : await (await fetch(doc.uri)).arrayBuffer());
  await checkUpload(body, doc.name, doc.mimeType, CV_TYPES);
  const path = `${userId}/${newId()}.pdf`;
  const { error } = await sb.storage.from('cvs').upload(path, body, { contentType: 'application/pdf', upsert: false });
  if (error) throw error;
  return path;
}

/** A link valid 10 minutes. */
export async function cvFileUrl(path: string): Promise<string | null> {
  const { data } = await supabase!.storage.from('cvs').createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

// ——— Server-side admin actions (api/admin.ts) ———

export type AdminApiResult = { ok: true } | { ok: false; error: string };

/**
 * Emails (api/email.ts). Signed in by default; `signup-notify` is sent without a session (a brand-new
 * account checked by the server). Returns the server's answer, with `ok`.
 */
export async function callEmailApi<T extends object = object>(action: string, payload: Record<string, unknown> = {}, signedIn = true): Promise<{ ok: boolean; error?: string } & Partial<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (signedIn) {
    const { data } = await supabase!.auth.getSession();
    if (!data.session) return { ok: false, error: 'unauthorized' } as { ok: boolean; error?: string } & Partial<T>;
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  try {
    const res = await fetch(`${apiBase}/api/email`, { method: 'POST', headers, body: JSON.stringify({ action, ...payload }) });
    const json = (await res.json().catch(() => ({}))) as { error?: string } & Partial<T>;
    return { ...json, ok: res.ok, error: res.ok ? undefined : json.error ?? `http_${res.status}` };
  } catch {
    return { ok: false, error: 'network' } as { ok: boolean; error?: string } & Partial<T>;
  }
}

/** A file attached to an admin's email: private bucket « mail-attachments ». */
export async function uploadMailAttachment(userId: string, doc: PickedDoc): Promise<{ path: string; name: string }> {
  const sb = supabase!;
  const body = doc.file ?? (doc.base64 ? base64ToBytes(doc.base64) : await (await fetch(doc.uri)).arrayBuffer());
  const type = await checkUpload(body, doc.name, doc.mimeType, ATTACHMENT_TYPES);
  const safe = doc.name.replace(/[^\w.\-]+/g, '_').slice(-80) || 'fichier';
  const path = `${userId}/${newId()}-${safe}`;
  const { error } = await sb.storage.from('mail-attachments').upload(path, body, { contentType: type, upsert: false });
  if (error) throw error;
  return { path, name: doc.name };
}

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
