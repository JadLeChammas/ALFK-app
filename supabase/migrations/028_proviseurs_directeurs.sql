-- 028 — Frises des proviseurs du lycée et des directeurs du primaire (page Partenaires / membres
-- d'honneur). Gérées par les admins dans app_settings (clé « schoolLeaders ») ; les visiteurs non
-- connectés doivent pouvoir les lire.

drop policy if exists "settings public pages" on public.app_settings;
create policy "settings public pages" on public.app_settings for select to anon, authenticated
  using (key in ('credits', 'lfkStory', 'showDemo', 'schoolLeaders'));
grant select on public.app_settings to anon;
