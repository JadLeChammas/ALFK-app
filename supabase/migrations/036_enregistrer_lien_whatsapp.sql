-- 036 — Les admins enregistrent le lien WhatsApp d'une promo via set_promo_whatsapp().
--
-- Depuis la 035, la colonne promos.whatsapp ne se lit plus directement : un « upsert » sur la table
-- échouait (« permission denied for table promos »). Cette fonction fait l'écriture, réservée aux admins.

create or replace function public.set_promo_whatsapp(p_year int, p_url text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.promos (year, whatsapp) values (p_year, nullif(trim(p_url), ''))
  on conflict (year) do update set whatsapp = excluded.whatsapp;
end
$$;
revoke execute on function public.set_promo_whatsapp(int, text) from public, anon;
grant execute on function public.set_promo_whatsapp(int, text) to authenticated;
