-- 026 — Classes des élèves et passage à l'année supérieure.
--
--   • profiles.grade : la classe d'un élève (2nde, 1ere, Tle), choisie à l'inscription.
--   • public.promote_students() : le bouton « Passage à l'année supérieure » du tableau de bord admin.
--     Terminale → Alumni (le compte doit être complété avant d'accéder au site), Première →
--     Terminale, Seconde → Première. Admins seulement.
--   • profiles.needs_completion : un nouvel alumni venu de Terminale ; il ne peut l'effacer qu'en
--     remplissant son compte (pays, ville, situation, université ou employeur, domaine d'études).
-- Nécessite la migration 024.

alter table public.profiles add column if not exists grade text;
alter table public.profiles drop constraint if exists profiles_grade_check;
alter table public.profiles add constraint profiles_grade_check check (grade is null or grade in ('2nde', '1ere', 'Tle'));
alter table public.profiles add column if not exists needs_completion boolean not null default false;

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
                               situation, employer, job_title, nationalities, bio, mentor, other_schools, fields_of_study, school_country, grade)
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
    case when final_role in ('alumni', 'admin') then nullif(m ->> 'school_country', '') end,
    -- Students: their class (Seconde, Première, Terminale).
    case when final_role = 'eleve' and m ->> 'grade' in ('2nde', '1ere', 'Tle') then m ->> 'grade' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

create or replace function public.promote_students() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  n_alumni int;
  n_tle int;
  n_first int;
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs';
  end if;
  -- Terminale → Alumni first (so that the Première students moving up are not promoted twice).
  update public.profiles
     set role = 'alumni', grade = null, school = null, school_country = null, situation = null, needs_completion = true
   where role = 'eleve' and grade = 'Tle';
  get diagnostics n_alumni = row_count;
  update public.profiles set grade = 'Tle' where role = 'eleve' and grade = '1ere';
  get diagnostics n_tle = row_count;
  update public.profiles set grade = '1ere' where role = 'eleve' and grade = '2nde';
  get diagnostics n_first = row_count;
  insert into public.admin_logs (actor_id, action, target, meta)
    values (auth.uid(), 'promote_students', '', jsonb_build_object('alumni', n_alumni, 'terminale', n_tle, 'premiere', n_first));
  return jsonb_build_object('alumni', n_alumni, 'terminale', n_tle, 'premiere', n_first);
end $$;

revoke all on function public.promote_students() from public;
grant execute on function public.promote_students() to authenticated;

-- A new alumnus clears « needs_completion » only with a complete account.
create or replace function public.check_completion() returns trigger
language plpgsql as $$
begin
  if old.needs_completion and not new.needs_completion and not public.is_admin() then
    if coalesce(new.country, '') = '' or coalesce(new.city, '') = '' or new.situation is null
       or (new.situation = 'student' and coalesce(new.school, '') = '')
       or (new.situation = 'working' and coalesce(new.employer, '') = '')
       or coalesce(array_length(new.fields_of_study, 1), 0) = 0 then
      raise exception 'Compte incomplet';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists zz_check_completion on public.profiles;
create trigger zz_check_completion before update of needs_completion on public.profiles
  for each row execute function public.check_completion();
