-- 017 — Les universités d'échange (et autres universités du profil) comptent dans les chiffres publics
-- (nombre d'universités, liste des universités). Nécessite les migrations 012 et 016.

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
  -- Every university: the main one plus the other ones (exchange semester, second degree).
  studied as (
    select school from grads where school is not null and school <> ''
    union all
    select x ->> 'name'
    from public.profiles p, jsonb_array_elements(case when jsonb_typeof(p.other_schools) = 'array' then p.other_schools else '[]'::jsonb end) x
    where p.approved and p.role in ('alumni', 'admin') and coalesce(x ->> 'name', '') <> ''
  ),
  studied_keys as (
    select school, coalesce((select target from aliases where alias = public.place_key(school)), public.place_key(school)) as school_key
    from studied
  ),
  schools as (
    -- One row per place; the label is the spelling used most often.
    select school_key, count(*) as n,
           (array_agg(school order by school))[1] as any_label,
           mode() within group (order by school) as label
    from studied_keys where school_key is not null
    group by school_key
  ),
  -- Nationalities of all approved members (a person with two counts for both).
  nats as (
    select n as code, count(*) as n
    from public.profiles p, unnest(coalesce(p.nationalities, '{}')) as n
    where p.approved
    group by n
  )
  select jsonb_build_object(
    'alumni', (select count(*) from grads),
    'countries', (select count(distinct country) from grads where country is not null and country <> ''),
    'promos', (select count(distinct promo) from grads where promo is not null),
    'universities', (select count(*) from schools),
    'nationalities', (select count(*) from nats),
    'byNationality', coalesce((select jsonb_agg(jsonb_build_object('code', code, 'n', n) order by n desc) from nats), '[]'::jsonb),
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
