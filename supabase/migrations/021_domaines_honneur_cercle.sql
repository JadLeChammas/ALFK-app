-- 021 — Plusieurs domaines d'études, pays de l'université principale, noms de famille en majuscules,
-- inscription des membres d'honneur (sans justificatif de scolarité) et leur discussion de groupe.
-- Nécessite les migrations 016 et 019.

alter table public.profiles add column if not exists fields_of_study text[];
alter table public.profiles add column if not exists school_country text;

-- Les noms de famille déjà enregistrés passent en majuscules.
update public.profiles set last_name = upper(last_name) where last_name <> upper(last_name);

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
    when wanted in ('alumni', 'eleve', 'honneur') then wanted
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
    case when by_admin then nullif(a ->> 'fonction', '') when final_role = 'honneur' then nullif(m ->> 'fonction', '') end,
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

-- Les membres d'honneur n'ont pas de justificatif de scolarité : un admin les approuve sans.
create or replace function public.require_proof_for_approval() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.approved and not coalesce(old.approved, false)
     and new.proof_path is null and not new.created_by_admin and new.role <> 'honneur' then
    raise exception 'Justificatif de scolarité manquant : approbation impossible';
  end if;
  return new;
end $$;

-- ─── Cercle des membres d'honneur : discussion de groupe (membres d'honneur et admins) ───
create table if not exists public.circle_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.circle_messages enable row level security;

create or replace function public.in_circle() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('honneur', 'admin'), false)
$$;

drop policy if exists "circle read" on public.circle_messages;
create policy "circle read" on public.circle_messages for select to authenticated using (public.in_circle());
drop policy if exists "circle write" on public.circle_messages;
create policy "circle write" on public.circle_messages for insert to authenticated
  with check (public.in_circle() and author_id = auth.uid());
drop policy if exists "circle delete" on public.circle_messages;
create policy "circle delete" on public.circle_messages for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());
grant select, insert, delete on public.circle_messages to authenticated;

do $$ begin
  begin alter publication supabase_realtime add table public.circle_messages; exception when duplicate_object then null; end;
end $$;
