-- ============================================================================
-- Migration 003 — Justificatif de scolarité, annonces vérifiées, orientation,
-- membres d'honneur, calendrier, communauté WhatsApp
-- À exécuter une fois, APRÈS schema.sql et 002 : SQL Editor → New query → coller → Run.
-- Réexécutable sans risque.
--
--   • Justificatif de scolarité au LFK obligatoire à l'inscription : fichier privé
--     (bucket « proofs »), visible uniquement par son auteur et les admins. Un compte ne
--     peut pas être approuvé sans justificatif, sauf s'il a été créé par un admin.
--   • Publications : les admins et la direction publient directement ; les autres membres
--     proposent une annonce, publiée seulement après vérification par un admin.
--   • Orientation : domaine d'études et disponibilité pour conseiller les lycéens.
--   • Membres d'honneur (institutions), dates clés du calendrier, lien de la communauté WhatsApp.
-- ============================================================================

-- ─── Profiles: proof of schooling, orientation ─────────────────────────────

alter table public.profiles add column if not exists proof_path text;
alter table public.profiles add column if not exists proof_name text;
alter table public.profiles add column if not exists proof_mime text;
alter table public.profiles add column if not exists proof_uploaded_at timestamptz;
alter table public.profiles add column if not exists created_by_admin boolean not null default false;
alter table public.profiles add column if not exists field_of_study text;
alter table public.profiles add column if not exists mentor boolean not null default false;

-- Members approved before this migration keep their access: they are treated as verified.
update public.profiles set created_by_admin = true where approved and proof_path is null and not created_by_admin;

-- New accounts: same as 002, plus "created by an admin" (exempt from the proof) and the field of study.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  a jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  by_admin boolean := coalesce((a ->> 'created_by_admin')::boolean, false);
  wanted text := case when by_admin then coalesce(a ->> 'role', 'alumni') else coalesce(m ->> 'role', 'alumni') end;
  final_role text;
begin
  final_role := case
    when by_admin and wanted in ('alumni', 'eleve', 'honneur', 'admin') then wanted
    when wanted in ('alumni', 'eleve') then wanted
    else 'alumni'
  end;
  insert into public.profiles (id, email, first_name, last_name, gender, role, approved, promo, school, city, country,
                               phone, birth_date, fonction, bureau_code, created_by_admin, field_of_study)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(m ->> 'first_name', ''),
    coalesce(m ->> 'last_name', ''),
    case when m ->> 'gender' in ('F', 'M') then m ->> 'gender' else 'F' end,
    final_role,
    by_admin,
    nullif(m ->> 'promo', '')::int,
    nullif(m ->> 'school', ''),
    nullif(m ->> 'city', ''),
    nullif(m ->> 'country', ''),
    nullif(m ->> 'phone', ''),
    public.try_date(nullif(m ->> 'birth_date', '')),
    case when by_admin then nullif(a ->> 'fonction', '') end,
    case when by_admin then nullif(a ->> 'bureau_code', '') end,
    by_admin,
    nullif(m ->> 'field_of_study', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- Protected fields (same as 002) + "created by an admin"; a member can only point the
-- proof to a file in their own folder.
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
     or new.alumni_number is distinct from old.alumni_number
     or new.bureau_code is distinct from old.bureau_code
     or new.created_by_admin is distinct from old.created_by_admin
     or new.id is distinct from old.id then
    raise exception 'Modification non autorisée';
  end if;
  if new.proof_path is distinct from old.proof_path
     and new.proof_path is not null
     and split_part(new.proof_path, '/', 1) <> auth.uid()::text then
    raise exception 'Justificatif invalide';
  end if;
  return new;
end $$;

-- No approval without a proof of schooling (accounts created by an admin are exempt).
create or replace function public.require_proof_for_approval() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.approved and not coalesce(old.approved, false)
     and new.proof_path is null and not new.created_by_admin then
    raise exception 'Justificatif de scolarité manquant : approbation impossible';
  end if;
  return new;
end $$;

drop trigger if exists zz_require_proof on public.profiles;
create trigger zz_require_proof before update of approved on public.profiles
  for each row execute function public.require_proof_for_approval();

-- ─── Private storage for proofs ─────────────────────────────────────────────
-- Not public: files are only reachable through short-lived signed links.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs', 'proofs', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "proofs upload own folder" on storage.objects;
create policy "proofs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "proofs read own or admin" on storage.objects;
create policy "proofs read own or admin" on storage.objects for select to authenticated
  using (bucket_id = 'proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists "proofs delete admin" on storage.objects;
create policy "proofs delete admin" on storage.objects for delete to authenticated
  using (bucket_id = 'proofs' and public.is_admin());

-- ─── Publications: verification before publishing ───────────────────────────

alter table public.publications add column if not exists status text not null default 'published';
alter table public.publications alter column status set default 'pending';
alter table public.publications drop constraint if exists publications_status_check;
alter table public.publications add constraint publications_status_check check (status in ('pending', 'published', 'rejected'));

drop policy if exists "publications read" on public.publications;
create policy "publications read" on public.publications for select to authenticated
  using (public.is_admin() or author_id = auth.uid() or (public.is_approved() and status = 'published'));
drop policy if exists "publications create" on public.publications;
create policy "publications create" on public.publications for insert to authenticated
  with check (author_id = auth.uid() and public.is_approved() and (status = 'pending' or public.can_publish()));
drop policy if exists "publications review" on public.publications;
create policy "publications review" on public.publications for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Admins hear about new submissions; the author hears about the decision.
create or replace function public.notify_publication_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.notifications (user_id, kind, template, params, href)
      select id, 'publication', 'publicationToReview', jsonb_build_object('title', new.title), '/admin/contenus'
      from public.profiles where role = 'admin' and approved;
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status <> 'pending' and new.author_id is not null then
    insert into public.notifications (user_id, kind, template, params, href)
      values (new.author_id, 'publication',
              case when new.status = 'published' then 'publicationApproved' else 'publicationRejected' end,
              jsonb_build_object('title', new.title), '/publications/' || new.id);
  end if;
  return new;
end $$;

drop trigger if exists notify_publication_review on public.publications;
create trigger notify_publication_review after insert or update of status on public.publications
  for each row execute function public.notify_publication_review();

-- ─── Honorary institutions, key dates, settings ─────────────────────────────

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  logo text,
  website text,
  sort_order int not null default 0
);

create table if not exists public.key_dates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  month int not null check (month between 1 and 12),
  day int not null check (day between 1 and 31),
  year int check (year is null or year between 1900 and 2100),
  category text not null check (category in ('francophonie', 'aefe', 'lfk', 'france', 'koweit', 'amicale'))
);

create table if not exists public.app_settings (
  key text primary key,
  value text
);

alter table public.institutions enable row level security;
alter table public.key_dates enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "institutions read" on public.institutions;
create policy "institutions read" on public.institutions for select to authenticated using (public.is_approved());
drop policy if exists "institutions admin write" on public.institutions;
create policy "institutions admin write" on public.institutions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "key dates read" on public.key_dates;
create policy "key dates read" on public.key_dates for select to authenticated using (public.is_approved());
drop policy if exists "key dates admin write" on public.key_dates;
create policy "key dates admin write" on public.key_dates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings read" on public.app_settings;
create policy "settings read" on public.app_settings for select to authenticated using (public.is_approved());
drop policy if exists "settings admin write" on public.app_settings;
create policy "settings admin write" on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.institutions, public.key_dates, public.app_settings to authenticated;

-- ─── Starting content ───────────────────────────────────────────────────────
-- The LFK only. Any other institution (e.g. the SCAC of the French Embassy) is added
-- by an admin from the app, once it has given its written consent.

insert into public.institutions (name, description, logo, website, sort_order)
select 'Lycée Français du Koweït',
       'L''établissement où tout a commencé : l''Amicale réunit ses anciens élèves et reste liée à sa direction, à ses équipes et à ses élèves.',
       'lfk', 'https://www.lfkoweit.edu.kw', 1
where not exists (select 1 from public.institutions where logo = 'lfk');

insert into public.key_dates (title, month, day, category)
select v.title, v.month, v.day, v.category
from (values
  ('Fête nationale du Koweït', 2, 25, 'koweit'),
  ('Jour de la Libération du Koweït', 2, 26, 'koweit'),
  ('Journée internationale de la Francophonie', 3, 20, 'francophonie'),
  ('Victoire du 8 mai 1945', 5, 8, 'france'),
  ('Fête nationale française', 7, 14, 'france'),
  ('Armistice du 11 novembre 1918', 11, 11, 'france')
) as v(title, month, day, category)
where not exists (select 1 from public.key_dates k where k.title = v.title);
