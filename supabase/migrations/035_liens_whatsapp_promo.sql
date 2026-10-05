-- 035 — Chaque membre ne voit que le lien WhatsApp de SA promo ; les admins voient tous les liens.
--
-- La colonne promos.whatsapp ne se lit plus directement : promo_whatsapp_links() renvoie le lien de
-- la promo du membre connecté (tous les liens pour un admin). Les admins modifient les liens comme avant.

revoke select on public.promos from authenticated;
grant select (year, group_photo) on public.promos to authenticated;

create or replace function public.promo_whatsapp_links() returns table (year int, whatsapp text)
language sql stable security definer set search_path = public as $$
  select p.year, p.whatsapp
    from public.promos p
   where p.whatsapp is not null
     and (public.is_admin()
          or p.year = (select promo from public.profiles where id = auth.uid() and approved))
$$;
revoke execute on function public.promo_whatsapp_links() from public, anon;
grant execute on function public.promo_whatsapp_links() to authenticated;
