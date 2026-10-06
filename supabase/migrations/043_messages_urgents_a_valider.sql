-- 043 — Messages urgents « à valider » (photo de profil invalide…) : le message revient à chaque visite
-- du membre tant qu'un admin n'a pas validé la correction.
--
--   • resolved_at : un admin a validé (seuls les admins peuvent le changer, par resolve_urgent_message).
--   • photo_before : la photo du membre à l'envoi, pour que les admins voient quand il en a mis une nouvelle.

alter table public.urgent_messages
  add column if not exists resolved_at timestamptz,
  add column if not exists photo_before text;

create or replace function public.resolve_urgent_message(p_id uuid, p_resolved boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.urgent_messages set resolved_at = case when p_resolved then now() end where id = p_id;
end
$$;
revoke execute on function public.resolve_urgent_message(uuid, boolean) from public, anon;
grant execute on function public.resolve_urgent_message(uuid, boolean) to authenticated;
