-- 032 — Prénoms avec une majuscule (aussi pour les prénoms composés : « Jean-Claude », « Jean Marie »),
-- noms de famille tout en majuscules (« EL CHAMMAS », « VINCENT CHAMMAS AUTREIN »).
-- La règle s'applique aux comptes existants et, par un déclencheur, à chaque inscription ou modification.

create or replace function public.normalize_member_names() returns trigger
language plpgsql as $$
begin
  new.first_name := initcap(btrim(coalesce(new.first_name, '')));
  new.last_name := upper(btrim(coalesce(new.last_name, '')));
  return new;
end $$;

drop trigger if exists aa_normalize_names on public.profiles;
create trigger aa_normalize_names before insert or update of first_name, last_name on public.profiles
  for each row execute function public.normalize_member_names();

-- Comptes déjà enregistrés.
update public.profiles
   set first_name = initcap(btrim(first_name)), last_name = upper(btrim(last_name))
 where first_name is distinct from initcap(btrim(first_name)) or last_name is distinct from upper(btrim(last_name));
