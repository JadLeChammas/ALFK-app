-- 020 — Figures without double counting, the same in the app and on the public site.
--
--   • public.resolve_place(name, aliases): the rule of resolvePlace() in src/data/places.ts — the
--     normalised key, then the admins' merges and the built-in equivalents (IEP Paris → Sciences Po,
--     HEC → HEC Paris…), following up to 5 hops. Before, the public figures only applied one hop of
--     admin merges and no built-in equivalents, so visitors could see more universities than members.
--   • public_overview(): a person counts once per university (main university + other ones, even when
--     the same place is entered twice or under two merged spellings) and once per nationality.
--     Totals keep their meaning: alumni (approved alumni and admins), host countries (where alumni
--     live or studied, Kuwait included), Promos LFK, universities, and nationalities of the whole
--     community (all approved members).

create or replace function public.resolve_place(name text, aliases jsonb) returns text
language plpgsql immutable as $$
declare
  k text := public.place_key(name);
  nxt text;
  builtin constant jsonb := '{"institut superieur electronique paris": "isep", "isep paris": "isep", "institut etudes politiques paris": "sciences po", "iep paris": "sciences po", "sciencespo": "sciences po", "sciences po paris": "sciences po", "ecole polytechnique federale lausanne": "epfl", "hautes etudes commerciales paris": "hec paris", "ecole hautes etudes commerciales paris": "hec paris", "hec": "hec paris", "essec": "essec business school", "ecole superieure sciences economiques commerciales": "essec business school", "institut national sciences appliquees lyon": "insa lyon", "aub": "american university beirut", "auk": "american university kuwait", "usj": "universite saint joseph", "universite saint joseph beyrouth": "universite saint joseph", "gulf university science technology": "gust", "ku": "kuwait university", "universite koweit": "kuwait university", "ucl": "university college london", "kcl": "king s college london", "kings college london": "king s college london", "nyu": "new york university", "mcgill": "mcgill university", "universite mcgill": "mcgill university", "udem": "universite montreal", "ulb": "universite libre bruxelles", "universite catholique louvain": "uclouvain", "ecole polytechnique paris": "ecole polytechnique", "x polytechnique": "ecole polytechnique", "sorbonne": "sorbonne universite", "paris sorbonne": "sorbonne universite", "universite paris 1": "paris 1 pantheon sorbonne", "pantheon sorbonne": "paris 1 pantheon sorbonne", "amu": "aix marseille universite", "unige": "universite geneve", "university geneva": "universite geneve", "columbia": "columbia university", "university edinburgh": "university edinburgh", "edinburgh": "university edinburgh"}'::jsonb;
begin
  for i in 1..5 loop
    exit when k is null;
    nxt := coalesce(aliases ->> k, builtin ->> k);
    exit when nxt is null or nxt = k;
    k := nxt;
  end loop;
  return k;
end $$;

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
