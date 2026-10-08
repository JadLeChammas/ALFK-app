-- 052 — L'espace des membres d'honneur (section « MH » du menu).
--
--   • profiles.mh_access : un admin qui a « Accès à l'espace MH » (case à cocher dans Admin → Membres).
--     Au départ : John El Hajj et Jad El Chammas. Les autres admins n'ont plus accès au Cercle
--     d'honneur (discussion de groupe, publications privées), mais gèrent toujours les MH.
--   • in_circle() : les membres d'honneur + les admins qui ont mh_access.
--   • circle_posts : les publications privées de l'espace MH (lues et écrites par le Cercle seulement).
--   • Un membre d'honneur renseigne lui-même sa fonction (première connexion, puis son profil) ;
--     seul un admin change mh_access.
-- Élèves ↔ MH : déjà interdit dans les deux sens (can_message, migration 040) — rien à changer.
-- Nécessite les migrations 021, 040 et 041.

-- ─── Accès des admins ────────────────────────────────────────────────────────
alter table public.profiles add column if not exists mh_access boolean not null default false;
grant select (mh_access) on public.profiles to authenticated;

update public.profiles
   set mh_access = true
 where role = 'admin'
   and lower(regexp_replace(first_name || ' ' || last_name, '[\s-]+', ' ', 'g')) in ('john el hajj', 'jad el chammas');

create or replace function public.in_circle() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select p.approved and (p.role = 'honneur' or (p.role = 'admin' and p.mh_access))
    from public.profiles p where p.id = auth.uid()
  ), false)
$$;

-- Supprimer un message du salon : son auteur, ou un admin du Cercle.
drop policy if exists "circle delete" on public.circle_messages;
create policy "circle delete" on public.circle_messages for delete to authenticated
  using (author_id = auth.uid() or (public.is_admin() and public.in_circle()));

-- ─── Publications privées ────────────────────────────────────────────────────
create table if not exists public.circle_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 8000),
  image text check (image is null or image ~ '^https://'),
  created_at timestamptz not null default now()
);
alter table public.circle_posts enable row level security;

drop policy if exists "circle posts read" on public.circle_posts;
create policy "circle posts read" on public.circle_posts for select to authenticated using (public.in_circle());
drop policy if exists "circle posts write" on public.circle_posts;
create policy "circle posts write" on public.circle_posts for insert to authenticated
  with check (public.in_circle() and author_id = auth.uid());
drop policy if exists "circle posts delete" on public.circle_posts;
create policy "circle posts delete" on public.circle_posts for delete to authenticated
  using (author_id = auth.uid() or (public.is_admin() and public.in_circle()));
grant select, insert, delete on public.circle_posts to authenticated;

-- Un compte restreint n'écrit rien (comme partout, migration 040).
drop trigger if exists block_restricted on public.circle_posts;
create trigger block_restricted before insert on public.circle_posts for each row execute function public.block_restricted();

-- ─── Profils : la fonction des MH, mh_access réservé aux admins ──────────────
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  settings constant text[] := array['last_active_at', 'locale', 'marketing_opt_in', 'show_email', 'show_phone', 'show_birthday', 'signup_notified', 'email_verified'];
begin
  if new.restricted and new.role = 'admin' then
    raise exception 'admin_restricted: un administrateur ne peut pas être restreint';
  end if;
  if auth.uid() is null or public.is_admin() then
    if new.restricted is distinct from old.restricted then
      new.restricted_at := case when new.restricted then now() end;
    end if;
    return new;
  end if;
  if new.role is distinct from old.role
     or new.approved is distinct from old.approved
     or new.gender is distinct from old.gender
     -- A member of honour fills in their own title (« Proviseur »…); for everyone else the admins set it.
     or (new.fonction is distinct from old.fonction and old.role <> 'honneur')
     or new.email is distinct from old.email
     or new.alumni_number is distinct from old.alumni_number
     or new.bureau_code is distinct from old.bureau_code
     or new.created_by_admin is distinct from old.created_by_admin
     or new.restricted is distinct from old.restricted
     or new.restricted_at is distinct from old.restricted_at
     or new.mh_access is distinct from old.mh_access
     or new.id is distinct from old.id then
    raise exception 'Modification non autorisée';
  end if;
  if old.restricted and (to_jsonb(new) - settings) is distinct from (to_jsonb(old) - settings) then
    raise exception 'Modification non autorisée';
  end if;
  if new.proof_path is distinct from old.proof_path
     and new.proof_path is not null
     and split_part(new.proof_path, '/', 1) <> auth.uid()::text then
    raise exception 'Justificatif invalide';
  end if;
  return new;
end $$;

-- Vérification : les admins qui ont accès à l'espace MH (doit afficher John El Hajj et Jad El Chammas).
select first_name, last_name, mh_access from public.profiles where role = 'admin' order by mh_access desc, last_name;
