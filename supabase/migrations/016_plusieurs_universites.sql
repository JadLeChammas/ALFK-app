-- 016 — Plusieurs universités par profil (échange, double diplôme…), en plus de l'université principale.
-- Liste JSON : [{ "name": "...", "country": "XX", "exchange": true }]. Aussi demandée à l'inscription.
-- Nécessite les migrations 012 et 015.

alter table public.profiles add column if not exists other_schools jsonb;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  a jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  by_admin boolean := coalesce((a ->> 'created_by_admin')::boolean, false);
  wanted text := case when by_admin then coalesce(a ->> 'role', 'alumni') else coalesce(m ->> 'role', 'alumni') end;
  final_role text;
  sit text := nullif(m ->> 'situation', '');
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
                               situation, employer, job_title, nationalities, bio, mentor, other_schools)
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
    case when sit = 'working' then nullif(m ->> 'job_title', '') end,
    nats,
    left(nullif(m ->> 'bio', ''), 600),
    -- Answering students' questions is for former students.
    final_role in ('alumni', 'admin') and coalesce(m ->> 'mentor', '') = 'true',
    -- Other universities (exchange, second degree): former students only, at most 5.
    case when final_role in ('alumni', 'admin') and jsonb_typeof(m -> 'other_schools') = 'array' and jsonb_array_length(m -> 'other_schools') > 0
         then (select jsonb_agg(x) from (select x from jsonb_array_elements(m -> 'other_schools') x
                                          where jsonb_typeof(x) = 'object' and coalesce(x ->> 'name', '') <> '' limit 5) s)
    end
  )
  on conflict (id) do nothing;
  return new;
end $$;
