-- 041 — Restriction silencieuse.
--
-- Le bureau prévient lui-même le membre : l'application ne lui dit rien. Les refus de la base
-- (migration 040) gardent donc un message neutre, sans le mot « restreint » — c'est ce message
-- qui s'afficherait si une écriture arrivait jusqu'à la base.

create or replace function public.block_restricted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_restricted() then
    raise exception 'Action non autorisée' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public.block_restricted() from public, anon, authenticated;

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
    raise exception 'Modification non autorisée';
  end if;
  if new.proof_path is distinct from old.proof_path
     and new.proof_path is not null
     and split_part(new.proof_path, '/', 1) <> auth.uid()::text then
    raise exception 'Justificatif invalide';
  end if;
  return new;
end $$;
