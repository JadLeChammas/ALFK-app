-- ============================================================================
-- Migration 006 — Une université écrite de plusieurs façons ne compte qu'une fois
-- À exécuter une fois, APRÈS 005 : SQL Editor → New query → coller → Run.
-- Réexécutable sans risque.
--
-- Mêmes règles que l'app (src/data/places.ts) pour les chiffres des pages publiques :
--   • majuscules, accents, ponctuation et petits mots (de, d', of, the…) ignorés ;
--   • fusions décidées par un admin (app_settings.placeAliases, JSON { forme : forme retenue }).
-- (La liste intégrée de sigles — ISEP, Sciences Po, AUB… — s'applique dans l'app.)
-- ============================================================================

create or replace function public.place_key(name text) returns text
language sql immutable as $$
  select nullif(array_to_string(array(
    select w from regexp_split_to_table(
      regexp_replace(
        lower(translate(coalesce(name, ''),
          'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñŸÿ',
          'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNnYy')),
        '[^a-z0-9]+', ' ', 'g'),
      ' ') as w
    where w <> '' and w not in ('de', 'du', 'des', 'd', 'la', 'le', 'les', 'l', 'of', 'the', 'at', 'in', 'et', 'and', 'a', 'en', 'y')
  ), ' '), '');
$$;

create or replace function public.public_overview() returns jsonb
language sql stable security definer set search_path = public as $$
  with aliases as (
    select key as alias, value as target
    from jsonb_each_text(coalesce((select value::jsonb from public.app_settings where key = 'placeAliases'), '{}'::jsonb))
  ),
  grads as (
    select country, school, promo,
           coalesce((select target from aliases where alias = public.place_key(school)), public.place_key(school)) as school_key
    from public.profiles
    where approved and role in ('alumni', 'admin')
  ),
  schools as (
    -- One row per place; the label is the spelling used most often.
    select school_key, count(*) as n,
           (array_agg(school order by school))[1] as any_label,
           mode() within group (order by school) as label
    from grads where school_key is not null
    group by school_key
  )
  select jsonb_build_object(
    'alumni', (select count(*) from grads),
    'countries', (select count(distinct country) from grads where country is not null and country <> ''),
    'promos', (select count(distinct promo) from grads where promo is not null),
    'universities', (select count(*) from schools),
    'destinations', coalesce((
      select jsonb_agg(jsonb_build_object('code', country, 'n', n) order by n desc)
      from (select country, count(*) as n from grads where country is not null and country <> '' group by country) c
    ), '[]'::jsonb),
    'schools', coalesce((
      select jsonb_agg(coalesce(label, any_label) order by n desc)
      from (select * from schools order by n desc limit 30) s
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
