-- 053 — Autorisation parentale pour les inscrits de moins de 15 ans.
-- En France, un mineur consent seul au traitement de ses données à partir de 15 ans (RGPD art. 8,
-- loi Informatique et Libertés art. 45). Un élève de moins de 15 ans peut s'inscrire, mais il joint une
-- autorisation signée par un parent ; son compte n'est validé qu'avec elle.
--   • profiles.parental_* : le fichier (espace privé « proofs », dossier du membre), comme le justificatif ;
--     lisible seulement par le membre lui-même et les admins (member_private_fields).
--   • Un membre ne peut enregistrer qu'un fichier de son propre dossier.
-- Nécessite les migrations 030 et 052.

alter table public.profiles
  add column if not exists parental_path text,
  add column if not exists parental_name text,
  add column if not exists parental_mime text,
  add column if not exists parental_uploaded_at timestamptz;

-- Les colonnes privées : seulement par cette fonction (comme le justificatif, migration 030).
drop function if exists public.member_private_fields(uuid);
create or replace function public.member_private_fields(only_id uuid default null)
returns table (
  id uuid,
  email text,
  phone text,
  birth_date date,
  bureau_code text,
  proof_path text,
  proof_name text,
  proof_mime text,
  proof_uploaded_at timestamptz,
  parental_path text,
  parental_name text,
  parental_mime text,
  parental_uploaded_at timestamptz,
  marketing_opt_in boolean,
  signup_notified boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select auth.uid() as uid, public.is_admin() as adm, public.is_approved() as ok)
  select
    p.id,
    case when p.id = me.uid or me.adm or p.show_email then p.email end,
    case when p.id = me.uid or me.adm or p.show_phone then p.phone end,
    case when p.id = me.uid or me.adm or p.show_birthday then p.birth_date end,
    case when p.id = me.uid or me.adm then p.bureau_code end,
    case when p.id = me.uid or me.adm then p.proof_path end,
    case when p.id = me.uid or me.adm then p.proof_name end,
    case when p.id = me.uid or me.adm then p.proof_mime end,
    case when p.id = me.uid or me.adm then p.proof_uploaded_at end,
    case when p.id = me.uid or me.adm then p.parental_path end,
    case when p.id = me.uid or me.adm then p.parental_name end,
    case when p.id = me.uid or me.adm then p.parental_mime end,
    case when p.id = me.uid or me.adm then p.parental_uploaded_at end,
    case when p.id = me.uid or me.adm then p.marketing_opt_in end,
    case when p.id = me.uid or me.adm then p.signup_notified end
  from public.profiles p, me
  -- the same rows as the « profiles read » policy
  where me.uid is not null
    and (p.id = me.uid or me.adm or (me.ok and p.approved))
    and (only_id is null or p.id = only_id);
$$;
revoke execute on function public.member_private_fields(uuid) from public, anon;
grant execute on function public.member_private_fields(uuid) to authenticated, service_role;

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
  if new.parental_path is distinct from old.parental_path
     and new.parental_path is not null
     and split_part(new.parental_path, '/', 1) <> auth.uid()::text then
    raise exception 'Autorisation parentale invalide';
  end if;
  return new;
end $$;

-- Vérification : les quatre nouvelles colonnes.
select column_name from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name like 'parental%' order by column_name;
