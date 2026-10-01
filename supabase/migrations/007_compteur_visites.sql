-- 007 — Compteur de visites (affiché par le mode rétro).
-- Une ligne unique ; les visiteurs ne lisent/écrivent le total que via les deux fonctions ci-dessous.

create table if not exists public.site_counter (
  id boolean primary key default true check (id),
  visits bigint not null default 0
);
insert into public.site_counter (id, visits) values (true, 0) on conflict (id) do nothing;

alter table public.site_counter enable row level security;
-- Aucune policy : pas d'accès direct à la table.

create or replace function public.hit_counter()
returns bigint
language sql
security definer
set search_path = public
as $$
  update public.site_counter set visits = visits + 1 where id returning visits;
$$;

create or replace function public.read_counter()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select visits from public.site_counter where id;
$$;

revoke all on function public.hit_counter() from public;
revoke all on function public.read_counter() from public;
grant execute on function public.hit_counter() to anon, authenticated;
grant execute on function public.read_counter() to anon, authenticated;
