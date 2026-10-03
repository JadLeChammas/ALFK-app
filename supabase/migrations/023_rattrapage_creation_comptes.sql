-- 023 — Rattrapage : création des comptes (« Database error creating new user »).
--
-- La création d'un profil utilise des colonnes ajoutées par plusieurs migrations (005, 010, 012, 016,
-- 019, 021). S'il en manque une, Supabase refuse de créer le compte avec ce message. Ce fichier
-- remet tout d'aplomb d'un coup ; il peut être lancé plusieurs fois sans risque, quelles que soient
-- les migrations déjà passées.

alter table public.profiles add column if not exists created_by_admin boolean not null default false;
alter table public.profiles add column if not exists field_of_study text;
alter table public.profiles add column if not exists mentor boolean not null default false;
alter table public.profiles add column if not exists situation text;
alter table public.profiles add column if not exists employer text;
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists cv jsonb;
alter table public.profiles add column if not exists nationalities text[];
alter table public.profiles add column if not exists other_schools jsonb;
alter table public.profiles add column if not exists fields_of_study text[];
alter table public.profiles add column if not exists school_country text;

-- Sexe : « Je préfère ne pas dire » (N) accepté.
alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles add constraint profiles_gender_check check (gender in ('F', 'M', 'N'));

-- Date lue sans erreur (texte vide ou invalide → null).
create or replace function public.try_date(t text) returns date
language plpgsql immutable as $f$
begin
  return t::date;
exception when others then
  return null;
end $f$;

-- Création du profil à l'inscription ou par un admin (même version que la migration 021).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  a jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  by_admin boolean := coalesce((a ->> 'created_by_admin')::boolean, false);
  wanted text := case when by_admin then coalesce(a ->> 'role', 'alumni') else coalesce(m ->> 'role', 'alumni') end;
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Vérification : doit afficher 12 lignes.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name in ('created_by_admin', 'field_of_study', 'mentor', 'situation', 'employer', 'job_title', 'bio', 'cv',
                      'nationalities', 'other_schools', 'fields_of_study', 'school_country');
