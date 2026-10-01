-- ============================================================================
-- Migration 005 — Situation des anciens : études ou travail
-- À exécuter une fois, APRÈS 004 : SQL Editor → New query → coller → Run.
-- Réexécutable sans risque.
--
--   • situation : 'student' (étudie encore) ou 'working' (travaille déjà).
--   • employer / job_title : entreprise ou organisation, et poste (si en activité).
--   • school reste l'université : actuelle pour un étudiant, celle dont on est diplômé sinon.
--   • city / country : là où la personne étudie ou travaille aujourd'hui.
-- ============================================================================

alter table public.profiles add column if not exists situation text;
alter table public.profiles add column if not exists employer text;
alter table public.profiles add column if not exists job_title text;

alter table public.profiles drop constraint if exists profiles_situation_check;
alter table public.profiles add constraint profiles_situation_check check (situation is null or situation in ('student', 'working'));

-- New accounts: same as 003, plus the situation chosen at sign-up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  a jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  by_admin boolean := coalesce((a ->> 'created_by_admin')::boolean, false);
  wanted text := case when by_admin then coalesce(a ->> 'role', 'alumni') else coalesce(m ->> 'role', 'alumni') end;
  final_role text;
  sit text := nullif(m ->> 'situation', '');
begin
  final_role := case
    when by_admin and wanted in ('alumni', 'eleve', 'honneur', 'admin') then wanted
    when wanted in ('alumni', 'eleve') then wanted
    else 'alumni'
  end;
  if sit not in ('student', 'working') or final_role not in ('alumni', 'admin') then
    sit := null;
  end if;
  insert into public.profiles (id, email, first_name, last_name, gender, role, approved, promo, school, city, country,
                               phone, birth_date, fonction, bureau_code, created_by_admin, field_of_study,
                               situation, employer, job_title)
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
    nullif(m ->> 'field_of_study', ''),
    sit,
    case when sit = 'working' then nullif(m ->> 'employer', '') end,
    case when sit = 'working' then nullif(m ->> 'job_title', '') end
  )
  on conflict (id) do nothing;
  return new;
end $$;
