-- 033 — Clubs : un alumni propose un club, un admin l'approuve, le créateur le gère.
--
--   • clubs        : nom, description, image ; « pending » (proposé) → « approved » ou « rejected » (admins).
--   • club_members : membres d'un club ; « pending » = demande d'adhésion, « active » = membre ;
--                    rôle « manager » (responsable, peut nommer des co-responsables) ou « member ».
--   • club_posts   : discussion de groupe (« message », tous les membres) et annonces (« announcement »,
--                    les responsables) — visibles par les membres du club et les admins.
-- Visible par les alumni et les admins approuvés (pas les élèves ni les membres d'honneur pour l'instant :
-- changer can_see_clubs() suffira). Nécessite les migrations précédentes (030 notamment).

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 2000),
  cover text check (cover is null or cover ~ '^https://'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.club_members (
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('manager', 'member')),
  status text not null default 'pending' check (status in ('pending', 'active')),
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create table if not exists public.club_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  kind text not null default 'message' check (kind in ('message', 'announcement')),
  text text not null check (char_length(text) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists club_posts_club on public.club_posts (club_id, created_at);

alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_posts enable row level security;

-- ——— Aides ———
create or replace function public.can_see_clubs() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('alumni', 'admin'), false)
$$;
create or replace function public.is_club_member(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.club_members where club_id = c and user_id = auth.uid() and status = 'active')
$$;
create or replace function public.is_club_manager(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.club_members where club_id = c and user_id = auth.uid() and status = 'active' and role = 'manager')
$$;
revoke execute on function public.can_see_clubs(), public.is_club_member(uuid), public.is_club_manager(uuid) from public, anon;
grant execute on function public.can_see_clubs(), public.is_club_member(uuid), public.is_club_manager(uuid) to authenticated;

-- Le créateur devient responsable de son club dès la proposition.
create or replace function public.club_creator_is_manager() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into public.club_members (club_id, user_id, role, status) values (new.id, new.created_by, 'manager', 'active')
    on conflict (club_id, user_id) do update set role = 'manager', status = 'active';
  end if;
  return new;
end $$;
drop trigger if exists club_creator_is_manager on public.clubs;
create trigger club_creator_is_manager after insert on public.clubs for each row execute function public.club_creator_is_manager();
revoke execute on function public.club_creator_is_manager() from public, anon, authenticated;

-- Seuls les admins décident du statut ; personne ne change le créateur.
create or replace function public.guard_club_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and (new.status is distinct from old.status or new.created_by is distinct from old.created_by) then
    raise exception 'Modification non autorisée';
  end if;
  return new;
end $$;
drop trigger if exists guard_club_update on public.clubs;
create trigger guard_club_update before update on public.clubs for each row execute function public.guard_club_update();
revoke execute on function public.guard_club_update() from public, anon, authenticated;

-- ——— Règles d'accès ———
drop policy if exists "clubs read" on public.clubs;
create policy "clubs read" on public.clubs for select to authenticated
  using (public.can_see_clubs() and (status = 'approved' or created_by = auth.uid() or public.is_admin()));
drop policy if exists "clubs propose" on public.clubs;
create policy "clubs propose" on public.clubs for insert to authenticated
  with check (public.can_see_clubs() and created_by = auth.uid() and status = 'pending');
drop policy if exists "clubs edit" on public.clubs;
create policy "clubs edit" on public.clubs for update to authenticated
  using (public.is_admin() or public.is_club_manager(id)) with check (public.is_admin() or public.is_club_manager(id));
drop policy if exists "clubs delete" on public.clubs;
create policy "clubs delete" on public.clubs for delete to authenticated
  using (public.is_admin() or public.is_club_manager(id));

drop policy if exists "club members read" on public.club_members;
create policy "club members read" on public.club_members for select to authenticated using (public.can_see_clubs());
drop policy if exists "club members join" on public.club_members;
create policy "club members join" on public.club_members for insert to authenticated
  with check (
    public.can_see_clubs() and (
      (user_id = auth.uid() and role = 'member' and status = 'pending'
        and exists (select 1 from public.clubs c where c.id = club_id and c.status = 'approved'))
      or public.is_club_manager(club_id) or public.is_admin()
    )
  );
drop policy if exists "club members manage" on public.club_members;
create policy "club members manage" on public.club_members for update to authenticated
  using (public.is_club_manager(club_id) or public.is_admin()) with check (public.is_club_manager(club_id) or public.is_admin());
drop policy if exists "club members leave" on public.club_members;
create policy "club members leave" on public.club_members for delete to authenticated
  using (user_id = auth.uid() or public.is_club_manager(club_id) or public.is_admin());

drop policy if exists "club posts read" on public.club_posts;
create policy "club posts read" on public.club_posts for select to authenticated
  using (public.is_club_member(club_id) or public.is_admin());
drop policy if exists "club posts write" on public.club_posts;
create policy "club posts write" on public.club_posts for insert to authenticated
  with check (author_id = auth.uid() and public.is_club_member(club_id) and (kind = 'message' or public.is_club_manager(club_id)));
drop policy if exists "club posts delete" on public.club_posts;
create policy "club posts delete" on public.club_posts for delete to authenticated
  using (author_id = auth.uid() or public.is_club_manager(club_id) or public.is_admin());

grant select, insert, update, delete on public.clubs, public.club_members to authenticated;
grant select, insert, delete on public.club_posts to authenticated;
grant all on public.clubs, public.club_members, public.club_posts to service_role;

do $$ begin
  begin alter publication supabase_realtime add table public.club_posts; exception when duplicate_object then null; end;
end $$;
