-- 045 — Publications publiques : chaque publication est soit réservée aux membres (par défaut, comme
-- avant), soit publique, affichée aussi à tout le monde sur alfk.org (page « Actualités »).
--
-- La table reste fermée aux visiteurs : ils lisent les publications publiques par
-- public_publications(), qui ne renvoie que celles-ci (publiées), avec le nom et la fonction de
-- l'auteur (rien d'autre de son profil).

alter table public.publications add column if not exists visibility text not null default 'members';
alter table public.publications drop constraint if exists publications_visibility_check;
alter table public.publications add constraint publications_visibility_check check (visibility in ('members', 'public'));

create or replace function public.public_publications()
returns table (id uuid, title text, category text, date timestamptz, cover text, excerpt text, body text,
               author_name text, author_fonction text, author_avatar text)
language sql stable security definer set search_path = public as $$
  select p.id, p.title, p.category, p.date, p.cover, p.excerpt, p.body,
         case when a.id is null then null else a.first_name || ' ' || upper(a.last_name) end,
         a.fonction, a.avatar
    from public.publications p
    left join public.profiles a on a.id = p.author_id
   where p.status = 'published' and p.visibility = 'public'
   order by p.date desc
$$;
revoke all on function public.public_publications() from public;
grant execute on function public.public_publications() to anon, authenticated;
