-- 034 — Code de vérification par email avant que la demande parte aux admins.
--
--   • profiles.email_verified : l'adresse est confirmée (le membre a saisi le code reçu par email).
--     Recopiée depuis auth.users.email_confirmed_at par un déclencheur ; un membre ne peut pas la changer.
--   • Les admins ne sont prévenus d'une inscription (notification « à approuver ») qu'une fois l'adresse
--     confirmée, et la page Approbations n'affiche que ces demandes-là.
-- À activer aussi dans Supabase : Authentication → Sign In / Providers → Email → « Confirm email »,
-- et un modèle « Confirm signup » qui contient {{ .Token }} (le code).

alter table public.profiles add column if not exists email_verified boolean not null default false;

-- Comptes existants : confirmés s'ils l'étaient déjà dans Supabase, ou déjà approuvés.
update public.profiles p set email_verified = true
  from auth.users u
 where u.id = p.id and (u.email_confirmed_at is not null or p.approved) and not p.email_verified;

grant select (email_verified) on public.profiles to authenticated;

create or replace function public.sync_email_verified() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email_verified = (new.email_confirmed_at is not null)
   where id = new.id and email_verified is distinct from (new.email_confirmed_at is not null);
  return new;
end $$;
-- Après « on_auth_user_created » (ordre alphabétique) : le profil existe déjà.
drop trigger if exists zz_sync_email_verified on auth.users;
create trigger zz_sync_email_verified after insert or update of email_confirmed_at on auth.users
  for each row execute function public.sync_email_verified();
revoke execute on function public.sync_email_verified() from public, anon, authenticated;

create or replace function public.guard_email_verified() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() and new.email_verified is distinct from old.email_verified then
    raise exception 'Modification non autorisée';
  end if;
  return new;
end $$;
drop trigger if exists guard_email_verified on public.profiles;
create trigger guard_email_verified before update of email_verified on public.profiles
  for each row execute function public.guard_email_verified();
revoke execute on function public.guard_email_verified() from public, anon, authenticated;

-- Les admins apprennent une nouvelle demande quand l'adresse est confirmée (et plus à la création).
create or replace function public.notify_profile_changes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not new.approved and new.email_verified and (tg_op = 'INSERT' or not coalesce(old.email_verified, false)) then
    insert into public.notifications (user_id, kind, template, params, href)
      select id, 'approval', 'pendingOne', jsonb_build_object('name', new.first_name || ' ' || new.last_name), '/admin/approbations'
      from public.profiles where role = 'admin' and approved;
  elsif tg_op = 'UPDATE' and new.approved and not old.approved then
    insert into public.notifications (user_id, kind, template, href) values (new.id, 'approval', 'approved', '/');
  end if;
  return new;
end $$;
drop trigger if exists notify_profile_changes on public.profiles;
create trigger notify_profile_changes after insert or update of approved, email_verified on public.profiles
  for each row execute function public.notify_profile_changes();
revoke execute on function public.notify_profile_changes() from public, anon, authenticated;
