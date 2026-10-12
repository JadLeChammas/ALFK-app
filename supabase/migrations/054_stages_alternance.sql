-- 054 — Page « Stage / Alternance » : des annonces « Je propose » et « Je cherche » un stage ou une
-- alternance. Publiées tout de suite ; retirées par leur auteur ou un admin.
--   • Lues et publiées par les alumni, les membres d'honneur et les admins validés.
--   • Les élèves n'y ont pas accès (ni lecture, ni écriture).
--   • Un compte restreint ne publie rien (migration 040).
-- Nécessite les migrations 040 et 052.

create table if not exists public.internships (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('offer', 'request')),
  contract text not null check (contract in ('stage', 'alternance')),
  title text not null check (char_length(title) between 2 and 140),
  field text check (field is null or char_length(field) <= 120),
  company text check (company is null or char_length(company) <= 120),
  city text check (city is null or char_length(city) <= 120),
  country text check (country is null or char_length(country) <= 2),
  duration text check (duration is null or char_length(duration) <= 80),
  start_date text check (start_date is null or char_length(start_date) <= 80),
  description text not null check (char_length(description) between 1 and 5000),
  created_at timestamptz not null default now()
);
alter table public.internships enable row level security;

create or replace function public.can_see_internships() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select approved and role in ('alumni', 'honneur', 'admin') from public.profiles where id = auth.uid()), false)
$$;

drop policy if exists "internships read" on public.internships;
create policy "internships read" on public.internships for select to authenticated using (public.can_see_internships());
drop policy if exists "internships write" on public.internships;
create policy "internships write" on public.internships for insert to authenticated
  with check (public.can_see_internships() and author_id = auth.uid());
drop policy if exists "internships delete" on public.internships;
create policy "internships delete" on public.internships for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());
grant select, insert, delete on public.internships to authenticated;

drop trigger if exists block_restricted on public.internships;
create trigger block_restricted before insert on public.internships for each row execute function public.block_restricted();

-- Vérification : la table existe et elle est vide.
select count(*) as annonces from public.internships;
