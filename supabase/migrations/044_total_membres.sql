-- 044 — Chiffres publics : le total des membres, « dont X anciens élèves et Y élèves » (accueil et page
-- d'accueil publique). public_overview() reprise de la 037, avec deux chiffres en plus : members (tous
-- les comptes validés) et pupils (les élèves du lycée). Nécessite la migration 037.

create or replace function public.public_overview() returns jsonb
language sql stable security definer set search_path = public as $$
  with settings as (
    select coalesce((select value::jsonb from public.app_settings where key = 'placeAliases'), '{}'::jsonb) as aliases
  ),
  alumni as (
    select * from public.profiles where approved and role in ('alumni', 'admin')
  ),
  -- Every university of every former student: the main one plus the other ones (exchange semester,
  -- second degree), resolved to one key per place, kept once per person.
  studied as (
    select distinct on (a.id, public.resolve_place(e.school, s.aliases))
           a.id, e.school, public.resolve_place(e.school, s.aliases) as school_key
    from alumni a
    cross join settings s
    cross join lateral (
      select a.school as school, 0 as pos
      union all
      select x ->> 'name', 1
      from jsonb_array_elements(case when jsonb_typeof(a.other_schools) = 'array' then a.other_schools else '[]'::jsonb end) x
    ) e
    where coalesce(e.school, '') <> '' and public.resolve_place(e.school, s.aliases) is not null
    order by a.id, public.resolve_place(e.school, s.aliases), e.pos
  ),
  schools as (
    -- One row per place, n = number of people; the label is the spelling used most often.
    select school_key, count(*) as n, mode() within group (order by school) as label
    from studied
    group by school_key
  ),
  -- Host countries: where each former student lives, plus the countries of their other universities
  -- (exchange semester…), each country once per person.
  hosts as (
    select distinct a.id, c as country
    from alumni a,
         lateral (
           select a.country as c
           union
           select x ->> 'country' from jsonb_array_elements(case when jsonb_typeof(a.other_schools) = 'array' then a.other_schools else '[]'::jsonb end) x
         ) cs
    where c is not null and c <> ''
  ),
  -- Nationalities of all approved members, each person once per nationality.
  nats as (
    select n as code, count(distinct p.id) as n
    from public.profiles p, unnest(coalesce(p.nationalities, '{}')) as n
    where p.approved and coalesce(n, '') <> ''
    group by n
  )
  select jsonb_build_object(
    'alumni', (select count(*) from alumni),
    'members', (select count(*) from public.profiles where approved),
    'pupils', (select count(*) from public.profiles where approved and role = 'eleve'),
    'countries', (select count(distinct country) from hosts),
    'promos', (select count(distinct promo) from alumni where promo is not null),
    'universities', (select count(*) from schools),
    'nationalities', (select count(*) from nats),
    'byNationality', coalesce((select jsonb_agg(jsonb_build_object('code', code, 'n', n) order by n desc) from nats), '[]'::jsonb),
    'destinations', coalesce((
      select jsonb_agg(jsonb_build_object('code', country, 'n', n) order by n desc)
      from (select country, count(*) as n from hosts group by country) c
    ), '[]'::jsonb),
    'schools', coalesce((
      select jsonb_agg(label order by n desc, label)
      from (select * from schools order by n desc, label limit 30) s
    ), '[]'::jsonb),
    'bureau', coalesce((
      select jsonb_agg(jsonb_build_object('name', first_name || ' ' || last_name, 'role', role, 'fonction', fonction, 'avatar', avatar)
                       order by role, bureau_code nulls last, last_name)
      from public.profiles
      where approved and role in ('admin', 'honneur')
    ), '[]'::jsonb),
    'institutions', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'description', description, 'logo', logo,
                                          'website', website, 'sort_order', sort_order) order by sort_order)
      from public.institutions
      where not hidden
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.public_overview() from public;
grant execute on function public.public_overview() to anon, authenticated;
