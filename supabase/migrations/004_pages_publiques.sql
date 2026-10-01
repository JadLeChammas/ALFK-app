-- ============================================================================
-- Migration 004 — Données des pages publiques (accueil, L'Amicale, Le bureau, Partenaires)
-- À exécuter une fois, APRÈS 003 : SQL Editor → New query → coller → Run.
-- Réexécutable sans risque.
--
-- Les visiteurs sans compte ne lisent aucune table directement. Une seule fonction leur
-- renvoie :
--   • des totaux (anciens élèves, pays, Promos LFK, universités) et les pays / universités
--     les plus représentés — jamais un profil, un e-mail ou un téléphone ;
--   • le Bureau (admins) et les membres d'honneur : nom, fonction et photo uniquement ;
--   • les partenaires (institutions).
-- ============================================================================

create or replace function public.public_overview() returns jsonb
language sql stable security definer set search_path = public as $$
  with grads as (
    select country, school, promo
    from public.profiles
    where approved and role in ('alumni', 'admin')
  )
  select jsonb_build_object(
    'alumni', (select count(*) from grads),
    'countries', (select count(distinct country) from grads where country is not null and country <> ''),
    'promos', (select count(distinct promo) from grads where promo is not null),
    'universities', (select count(distinct school) from grads where school is not null and school <> ''),
    'destinations', coalesce((
      select jsonb_agg(jsonb_build_object('code', country, 'n', n) order by n desc)
      from (select country, count(*) as n from grads where country is not null and country <> '' group by country) c
    ), '[]'::jsonb),
    'schools', coalesce((
      select jsonb_agg(school order by n desc)
      from (select school, count(*) as n from grads where school is not null and school <> ''
            group by school order by n desc limit 30) s
    ), '[]'::jsonb),
    'bureau', coalesce((
      select jsonb_agg(jsonb_build_object('name', first_name || ' ' || last_name, 'role', role, 'fonction', fonction, 'avatar', avatar)
                       order by role, last_name)
      from public.profiles
      where approved and role in ('admin', 'honneur')
    ), '[]'::jsonb),
    'institutions', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'description', description, 'logo', logo,
                                          'website', website, 'sort_order', sort_order) order by sort_order)
      from public.institutions
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.public_overview() from public;
grant execute on function public.public_overview() to anon, authenticated;
