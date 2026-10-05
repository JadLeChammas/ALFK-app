-- 040 — Comptes restreints (Admin → Membres : un bouton par membre).
--
-- Un compte restreint reste connecté et lit tout (actualités, événements, annuaire…) mais n'écrit
-- plus rien : ni message, ni publication, ni événement, ni photo, ni club, ni cercle, ni question
-- ou réponse, ni fichier, ni modification de profil (sauf ses réglages). Et personne ne peut lui
-- écrire. Seuls les admins posent ou lèvent la restriction ; un admin ne peut pas être restreint.

alter table public.profiles
  add column if not exists restricted boolean not null default false,
  add column if not exists restricted_at timestamptz;

-- Lisible par les membres : l'application masque ainsi le bouton « Message » vers ce compte.
grant select (restricted) on public.profiles to authenticated;

create or replace function public.is_restricted()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select restricted from public.profiles where id = auth.uid()), false)
$$;
revoke execute on function public.is_restricted() from public, anon;
grant execute on function public.is_restricted() to authenticated, service_role;

-- Messagerie : fermée dans les deux sens dès qu'un des deux comptes est restreint (conversations
-- existantes comprises, la règle « messages send » passe par can_message).
create or replace function public.can_message(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (select approved and not restricted from public.profiles where id = a) and
    (select approved and not restricted from public.profiles where id = b) and
    not exists (
      select 1 from public.profiles p1, public.profiles p2
      where p1.id = a and p2.id = b
        and ((p1.role = 'honneur' and p2.role = 'eleve') or (p1.role = 'eleve' and p2.role = 'honneur'))
    )
$$;

-- Profils : seuls les admins posent / lèvent la restriction ; un compte restreint ne change que
-- ses réglages (activité, langue, confidentialité, actualités).
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
     or new.fonction is distinct from old.fonction
     or new.email is distinct from old.email
     or new.alumni_number is distinct from old.alumni_number
     or new.bureau_code is distinct from old.bureau_code
     or new.created_by_admin is distinct from old.created_by_admin
     or new.restricted is distinct from old.restricted
     or new.restricted_at is distinct from old.restricted_at
     or new.id is distinct from old.id then
    raise exception 'Modification non autorisée';
  end if;
  if old.restricted and (to_jsonb(new) - settings) is distinct from (to_jsonb(old) - settings) then
    raise exception 'restricted: compte en lecture seule';
  end if;
  if new.proof_path is distinct from old.proof_path
     and new.proof_path is not null
     and split_part(new.proof_path, '/', 1) <> auth.uid()::text then
    raise exception 'Justificatif invalide';
  end if;
  return new;
end $$;

-- Toute écriture d'un compte restreint est refusée (publications, événements, photos, clubs,
-- cercle, questions et réponses). Les suppressions de ses propres contenus restent possibles.
create or replace function public.block_restricted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_restricted() then
    raise exception 'restricted: compte en lecture seule' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public.block_restricted() from public, anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['messages', 'conversations', 'circle_messages', 'club_members', 'club_posts', 'clubs', 'event_photos', 'events', 'publications', 'answers', 'questions', 'question_authors'] loop
    execute format('drop trigger if exists block_restricted on public.%I', t);
    execute format('create trigger block_restricted before insert on public.%I for each row execute function public.block_restricted()', t);
  end loop;
  -- edits of their own posts, events and clubs too
  foreach t in array array['publications', 'events', 'clubs', 'club_posts', 'club_members'] loop
    execute format('drop trigger if exists block_restricted_update on public.%I', t);
    execute format('create trigger block_restricted_update before update on public.%I for each row execute function public.block_restricted()', t);
  end loop;
end $$;

-- Fichiers : ni photo ni CV pour un compte restreint.
drop policy if exists "media upload own folder" on storage.objects;
create policy "media upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_approved() and not public.is_restricted() and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "cvs upload own folder" on storage.objects;
create policy "cvs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and not public.is_restricted() and (storage.foldername(name))[1] = auth.uid()::text);
