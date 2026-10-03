-- 024 — Comptes créés par un admin (membres d'honneur, etc.) : « phone_invalid » / « Database error creating new user ».
--
-- Supabase crée l'utilisateur, PUIS ajoute ses informations de confiance (rôle, « créé par un admin »).
-- Au moment où le profil est créé, la base ne les voyait donc pas : elle appliquait les règles d'une
-- inscription normale (alumni : téléphone et date de naissance obligatoires) et refusait le compte.
-- Désormais le serveur (api/admin.ts) dépose le rôle dans admin_pending_accounts juste avant ; cette
-- table n'est accessible qu'au serveur (aucun droit pour les visiteurs ni les membres).

create table if not exists public.admin_pending_accounts (
  email text primary key,
  role text not null check (role in ('alumni', 'eleve', 'honneur', 'admin')),
  fonction text,
  bureau_code text,
  created_at timestamptz not null default now()
);
alter table public.admin_pending_accounts enable row level security;
revoke all on public.admin_pending_accounts from anon, authenticated;
grant all on public.admin_pending_accounts to service_role;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  a jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  pend public.admin_pending_accounts%rowtype;
  by_admin boolean;
  wanted text;
  final_role text;
  sit text := nullif(m ->> 'situation', '');
  -- Fields of study (keys or « other:… »), at most 3.
  flds text[] := (
    select array_agg(x) from (
      select x from jsonb_array_elements_text(case when jsonb_typeof(m -> 'fields_of_study') = 'array' then m -> 'fields_of_study' else '[]'::jsonb end) as x
      where x <> '' limit 3
    ) f
  );
  -- Nationalities: ISO codes (two capital letters), at most 4.
  nats text[] := (
    select array_agg(x) from (
      select distinct x from jsonb_array_elements_text(case when jsonb_typeof(m -> 'nationalities') = 'array' then m -> 'nationalities' else '[]'::jsonb end) as x
      where x ~ '^[A-Z]{2}$' limit 4
    ) n
  );
begin
  -- An account created by an admin: the server wrote its role in admin_pending_accounts just before
  -- (Supabase only adds the app metadata after this insert, so it cannot be read here).
  select * into pend from public.admin_pending_accounts
    where email = lower(coalesce(new.email, '')) and created_at > now() - interval '15 minutes';
  if found then
    delete from public.admin_pending_accounts where email = pend.email;
    a := a || jsonb_build_object('created_by_admin', true, 'role', pend.role, 'fonction', coalesce(pend.fonction, ''), 'bureau_code', coalesce(pend.bureau_code, ''));
  end if;
  by_admin := coalesce((a ->> 'created_by_admin')::boolean, false);
  wanted := case when by_admin then coalesce(a ->> 'role', 'alumni') else coalesce(m ->> 'role', 'alumni') end;
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
                               situation, employer, job_title, nationalities, bio, mentor, other_schools, fields_of_study, school_country)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(m ->> 'first_name', ''),
    upper(coalesce(m ->> 'last_name', '')),
    case when m ->> 'gender' in ('F', 'M', 'N') then m ->> 'gender' else 'N' end,
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
    case when sit = 'working' or final_role = 'honneur' then nullif(m ->> 'employer', '') end,
    case when sit = 'working' then nullif(m ->> 'job_title', '') end,
    nats,
    left(nullif(m ->> 'bio', ''), 600),
    -- Answering students' questions is for former students.
    final_role in ('alumni', 'admin') and coalesce(m ->> 'mentor', '') = 'true',
    -- Other universities (exchange, second degree): former students only, at most 5.
    case when final_role in ('alumni', 'admin') and jsonb_typeof(m -> 'other_schools') = 'array' and jsonb_array_length(m -> 'other_schools') > 0
         then (select jsonb_agg(x) from (select x from jsonb_array_elements(m -> 'other_schools') x
                                          where jsonb_typeof(x) = 'object' and coalesce(x ->> 'name', '') <> '' limit 5) s)
    end,
    case when final_role in ('alumni', 'admin') then flds end,
    case when final_role in ('alumni', 'admin') then nullif(m ->> 'school_country', '') end
  )
  on conflict (id) do nothing;
  return new;
end $$;
