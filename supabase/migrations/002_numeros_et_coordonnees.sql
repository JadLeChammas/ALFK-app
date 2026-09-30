-- ============================================================================
-- Migration 002 — Numéro Alumni, code Bureau, coordonnées obligatoires, élèves
-- À exécuter une fois, APRÈS schema.sql : SQL Editor → New query → coller → Run.
-- Réexécutable sans risque.
--
--   • Numéro Alumni : 5 chiffres, 11111, 11112… attribué par la base aux Alumni et aux
--     Admins (Bureau), jamais modifié ni réattribué. Élèves et membres d'honneur : aucun.
--   • Code Bureau : 4 chiffres, unique, saisi par un admin, réservé aux Admins.
--   • Date de naissance et téléphone (« +965 12345678 ») obligatoires, sauf membres d'honneur.
--   • Élèves : établissement fixé à « Lycée Français du Koweït ».
-- ============================================================================

alter table public.profiles add column if not exists alumni_number text;
alter table public.profiles add column if not exists bureau_code text;

alter table public.profiles drop constraint if exists profiles_alumni_number_format;
alter table public.profiles add constraint profiles_alumni_number_format check (alumni_number is null or alumni_number ~ '^[0-9]{5}$');
alter table public.profiles drop constraint if exists profiles_bureau_code_format;
alter table public.profiles add constraint profiles_bureau_code_format check (bureau_code is null or bureau_code ~ '^[0-9]{4}$');

create unique index if not exists profiles_alumni_number_key on public.profiles (alumni_number);
create unique index if not exists profiles_bureau_code_key on public.profiles (bureau_code);

-- A sequence never hands out the same value twice, even if an account is deleted.
create sequence if not exists public.alumni_number_seq start 11111 minvalue 11111 maxvalue 99999 no cycle;

-- ─── Validation helpers ─────────────────────────────────────────────────────

create or replace function public.is_valid_phone(p text) returns boolean
language sql immutable as $$
  select p is not null and p ~ '^\+[0-9]{1,4} [0-9]{6,14}$'
$$;

create or replace function public.is_valid_birth_date(d date) returns boolean
language sql stable as $$
  select d is not null and d >= date '1900-01-01' and d <= (current_date - interval '10 years')::date
$$;

create or replace function public.try_date(t text) returns date
language plpgsql immutable as $$
begin
  return t::date;
exception when others then
  return null;
end $$;

-- ─── New accounts ───────────────────────────────────────────────────────────
-- Profile fields come from the sign-up form (user metadata). Role, approval, position and Bureau code
-- come only from app metadata, which only the server (api/admin.ts, secret key) can set.

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
                               phone, birth_date, fonction, bureau_code)
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
    case when by_admin then nullif(a ->> 'bureau_code', '') end
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- ─── Protected fields: only admins (or the server) change them ─────────────

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
     or new.id is distinct from old.id then
    raise exception 'Modification non autorisée';
  end if;
  return new;
end $$;

-- ─── Membership rules, applied on every insert and update ──────────────────
-- Named "zz_…" so it runs after guard_profile_update (triggers fire in name order).

create or replace function public.apply_member_rules() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Students are at the LFK.
  if new.role = 'eleve' then
    new.school := 'Lycée Français du Koweït';
  end if;
  -- Only Bureau members (admins) hold a Bureau code.
  if new.role <> 'admin' then
    new.bureau_code := null;
  end if;
  -- Alumni number: given once to alumni and admins, never changed afterwards.
  if tg_op = 'UPDATE' and old.alumni_number is not null then
    new.alumni_number := old.alumni_number;
  elsif new.role in ('alumni', 'admin') and new.alumni_number is null then
    new.alumni_number := lpad(nextval('public.alumni_number_seq')::text, 5, '0');
  elsif tg_op = 'INSERT' then
    new.alumni_number := null;
  end if;
  -- Contact details: required except for honorary members; checked whenever they are set or changed,
  -- so accounts created before this rule can still be edited until they add them.
  if tg_op = 'INSERT' or new.phone is distinct from old.phone then
    if (new.role <> 'honneur' or new.phone is not null) and not public.is_valid_phone(new.phone) then
      raise exception 'phone_invalid: format attendu « +965 12345678 »';
    end if;
  end if;
  if tg_op = 'INSERT' or new.birth_date is distinct from old.birth_date then
    if (new.role <> 'honneur' or new.birth_date is not null) and not public.is_valid_birth_date(new.birth_date) then
      raise exception 'birth_date_invalid: date de naissance obligatoire et passée';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists zz_member_rules on public.profiles;
create trigger zz_member_rules before insert or update on public.profiles
  for each row execute function public.apply_member_rules();

-- ─── Existing data ──────────────────────────────────────────────────────────
-- Numbers for existing alumni and admins, in sign-up order; students' school.

do $$
declare
  r record;
begin
  for r in select id from public.profiles where role in ('alumni', 'admin') and alumni_number is null order by created_at loop
    update public.profiles set alumni_number = lpad(nextval('public.alumni_number_seq')::text, 5, '0') where id = r.id;
  end loop;
  update public.profiles set school = 'Lycée Français du Koweït' where role = 'eleve' and school is distinct from 'Lycée Français du Koweït';
end $$;

grant execute on function public.is_valid_phone(text), public.is_valid_birth_date(date) to authenticated;
