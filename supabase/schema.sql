-- ============================================================================
-- Amicale LFK — base de données Supabase
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller → Run.
-- Réexécutable : les objets existants sont remplacés.
--
-- Règles d'accès (voir aussi src/data/permissions.ts) :
--   • rien n'est visible sans compte approuvé ;
--   • Admin : gère comptes, approbations, modération, contact, journal ;
--   • Membre d'honneur (direction du lycée) : publie, crée des événements ;
--   • Événements et galeries : Alumni + direction + admins (pas les élèves) ;
--   • Messagerie privée interdite entre direction et élèves.
-- ============================================================================

-- ─── Tables ─────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  gender text not null default 'F' check (gender in ('F', 'M')),
  role text not null default 'alumni' check (role in ('alumni', 'eleve', 'honneur', 'admin')),
  approved boolean not null default false,
  promo int,
  school text,
  fonction text,
  city text,
  country text,
  phone text,
  birth_date date,
  avatar text,
  bio text,
  show_email boolean not null default true,
  show_phone boolean not null default false,
  show_birthday boolean not null default true,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create table if not exists public.promos (
  year int primary key,
  whatsapp text,
  group_photo text
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date timestamptz not null,
  location text not null default '',
  category text not null default 'soiree' check (category in ('soiree', 'sport', 'culture', 'networking')),
  description text not null default '',
  cover text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  uri text not null,
  uploaded_by uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'actualite' check (category in ('actualite', 'article', 'annonce')),
  date timestamptz not null default now(),
  cover text not null default '',
  excerpt text not null default '',
  body text not null default '',
  author_id uuid references public.profiles (id) on delete set null
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  members uuid[] not null check (array_length(members, 1) = 2),
  last_read jsonb not null default '{}'::jsonb,
  report jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete cascade,
  text text not null check (length(text) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target text not null default '',
  meta jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  template text not null,
  params jsonb,
  href text,
  created_at timestamptz not null default now(),
  read boolean not null default false
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ─── Helpers (security definer: they read profiles without tripping RLS) ────

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and approved
$$;

create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and approved)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

create or replace function public.can_view_events() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('alumni', 'honneur', 'admin'), false)
$$;

create or replace function public.can_publish() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('honneur', 'admin'), false)
$$;

-- Private messaging is disabled between school leadership and students.
create or replace function public.can_message(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select
    (select approved from public.profiles where id = a) and
    (select approved from public.profiles where id = b) and
    not exists (
      select 1 from public.profiles p1, public.profiles p2
      where p1.id = a and p2.id = b
        and ((p1.role = 'honneur' and p2.role = 'eleve') or (p1.role = 'eleve' and p2.role = 'honneur'))
    )
$$;

-- ─── Profiles: created from sign-up metadata, protected fields ─────────────

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted text := coalesce(m ->> 'role', 'alumni');
begin
  insert into public.profiles (id, email, first_name, last_name, gender, role, promo, school, city, country)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(m ->> 'first_name', ''),
    coalesce(m ->> 'last_name', ''),
    case when m ->> 'gender' in ('F', 'M') then m ->> 'gender' else 'F' end,
    -- Only alumni / élève can be self-declared; other roles are granted by an admin.
    case when wanted in ('alumni', 'eleve') then wanted else 'alumni' end,
    nullif(m ->> 'promo', '')::int,
    nullif(m ->> 'school', ''),
    nullif(m ->> 'city', ''),
    nullif(m ->> 'country', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Members edit their own profile, but only admins (or server-side code) change
-- role, approval, gender (locked after sign-up), position or e-mail.
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.approved is distinct from old.approved
     or new.gender is distinct from old.gender
     or new.fonction is distinct from old.fonction
     or new.email is distinct from old.email
     or new.id is distinct from old.id then
    raise exception 'Modification non autorisée';
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Conversation members can mark read / report, but never change who is in it.
create or replace function public.guard_conversation_update() returns trigger
language plpgsql as $$
begin
  if new.members is distinct from old.members then
    raise exception 'Modification non autorisée';
  end if;
  return new;
end $$;

drop trigger if exists guard_conversation_update on public.conversations;
create trigger guard_conversation_update before update on public.conversations
  for each row execute function public.guard_conversation_update();

-- ─── Notifications are written by the database, never by clients ───────────

create or replace function public.notify_new_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  other uuid;
  sender_name text;
begin
  select m into other from public.conversations c, unnest(c.members) m
    where c.id = new.conversation_id and m <> new.sender_id limit 1;
  select first_name || ' ' || last_name into sender_name from public.profiles where id = new.sender_id;
  if other is not null then
    insert into public.notifications (user_id, kind, template, params, href)
    values (other, 'message', 'message', jsonb_build_object('name', sender_name), '/messages/' || new.conversation_id);
  end if;
  return new;
end $$;

drop trigger if exists notify_new_message on public.messages;
create trigger notify_new_message after insert on public.messages
  for each row execute function public.notify_new_message();

create or replace function public.notify_profile_changes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and not new.approved then
    insert into public.notifications (user_id, kind, template, params, href)
      select id, 'approval', 'pendingOne', jsonb_build_object('name', new.first_name || ' ' || new.last_name), '/admin/approbations'
      from public.profiles where role = 'admin' and approved;
  elsif tg_op = 'UPDATE' and new.approved and not old.approved then
    insert into public.notifications (user_id, kind, template, href) values (new.id, 'approval', 'approved', '/');
  end if;
  return new;
end $$;

drop trigger if exists notify_profile_changes on public.profiles;
create trigger notify_profile_changes after insert or update of approved on public.profiles
  for each row execute function public.notify_profile_changes();

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.promos enable row level security;
alter table public.events enable row level security;
alter table public.event_photos enable row level security;
alter table public.publications enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.contacts enable row level security;
alter table public.admin_logs enable row level security;
alter table public.notifications enable row level security;

-- profiles
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin() or (public.is_approved() and approved));
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
-- Deleting an account goes through the server (api/admin.ts) which removes the auth user.

-- promos
drop policy if exists "promos read" on public.promos;
create policy "promos read" on public.promos for select to authenticated using (public.is_approved());
drop policy if exists "promos admin write" on public.promos;
create policy "promos admin write" on public.promos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- events
drop policy if exists "events read" on public.events;
create policy "events read" on public.events for select to authenticated using (public.can_view_events());
drop policy if exists "events create" on public.events;
create policy "events create" on public.events for insert to authenticated
  with check (public.can_publish() and created_by = auth.uid());
drop policy if exists "events delete" on public.events;
create policy "events delete" on public.events for delete to authenticated
  using (public.is_admin() or created_by = auth.uid());

-- event photos
drop policy if exists "photos read" on public.event_photos;
create policy "photos read" on public.event_photos for select to authenticated using (public.can_view_events());
drop policy if exists "photos add" on public.event_photos;
create policy "photos add" on public.event_photos for insert to authenticated
  with check (public.can_view_events() and uploaded_by = auth.uid());
drop policy if exists "photos delete" on public.event_photos;
create policy "photos delete" on public.event_photos for delete to authenticated
  using (public.is_admin() or uploaded_by = auth.uid());

-- publications
drop policy if exists "publications read" on public.publications;
create policy "publications read" on public.publications for select to authenticated using (public.is_approved());
drop policy if exists "publications create" on public.publications;
create policy "publications create" on public.publications for insert to authenticated
  with check (public.can_publish() and author_id = auth.uid());
drop policy if exists "publications delete" on public.publications;
create policy "publications delete" on public.publications for delete to authenticated
  using (public.is_admin() or author_id = auth.uid());

-- conversations: members only; admins may open a reported one
drop policy if exists "conversations read" on public.conversations;
create policy "conversations read" on public.conversations for select to authenticated
  using (auth.uid() = any (members) or (public.is_admin() and report is not null));
drop policy if exists "conversations create" on public.conversations;
create policy "conversations create" on public.conversations for insert to authenticated
  with check (
    auth.uid() = any (members)
    and public.can_message(members[1], members[2])
  );
drop policy if exists "conversations update" on public.conversations;
create policy "conversations update" on public.conversations for update to authenticated
  using (auth.uid() = any (members) or (public.is_admin() and report is not null))
  with check (auth.uid() = any (members) or public.is_admin());

-- messages
drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversations c where c.id = conversation_id
      and (auth.uid() = any (c.members) or (public.is_admin() and c.report is not null))
  ));
drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c where c.id = conversation_id
        and auth.uid() = any (c.members)
        and public.can_message(c.members[1], c.members[2])
    )
  );

-- contacts: anyone can write (public form), only admins read/manage
drop policy if exists "contacts submit" on public.contacts;
create policy "contacts submit" on public.contacts for insert to anon, authenticated with check (true);
drop policy if exists "contacts admin" on public.contacts;
create policy "contacts admin" on public.contacts for select to authenticated using (public.is_admin());
drop policy if exists "contacts admin update" on public.contacts;
create policy "contacts admin update" on public.contacts for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "contacts admin delete" on public.contacts;
create policy "contacts admin delete" on public.contacts for delete to authenticated using (public.is_admin());

-- admin log
drop policy if exists "logs read" on public.admin_logs;
create policy "logs read" on public.admin_logs for select to authenticated using (public.is_admin());
drop policy if exists "logs write" on public.admin_logs;
create policy "logs write" on public.admin_logs for insert to authenticated
  with check (actor_id = auth.uid() and public.can_publish());

-- notifications: own only
drop policy if exists "notifications own" on public.notifications;
create policy "notifications own" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications mark read" on public.notifications;
create policy "notifications mark read" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── Data API access ────────────────────────────────────────────────────────
-- Explicit grants (the project does not auto-expose new tables). RLS above
-- still decides which rows each person can see or change.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.profiles, public.promos, public.events, public.event_photos, public.publications,
  public.conversations, public.messages, public.contacts, public.admin_logs, public.notifications
  to authenticated;
grant insert on public.contacts to anon;
grant execute on function
  public.my_role(), public.is_approved(), public.is_admin(), public.can_view_events(),
  public.can_publish(), public.can_message(uuid, uuid)
  to authenticated;

-- ─── Live updates for chat and notifications ────────────────────────────────

do $$
begin
  begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.conversations; exception when duplicate_object then null; end;
end $$;

-- ─── Photo storage (avatars, event galleries) ───────────────────────────────
-- Public-read bucket: files are only reachable by their unguessable URL, which
-- only approved members ever see. Uploads go into a folder named after the uploader.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media upload own folder" on storage.objects;
create policy "media upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_approved() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "media delete own or admin" on storage.objects;
create policy "media delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
