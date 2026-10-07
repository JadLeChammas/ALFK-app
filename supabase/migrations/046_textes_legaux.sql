-- 046 — Textes légaux (CGU, politique de confidentialité, mentions légales) rédigés et publiés par
-- les admins depuis Admin → Textes légaux. Gardés dans app_settings (clé « legalTexts ») ; les
-- visiteurs non connectés doivent pouvoir les lire.

drop policy if exists "settings public pages" on public.app_settings;
create policy "settings public pages" on public.app_settings for select to anon, authenticated
  using (key in ('credits', 'lfkStory', 'showDemo', 'schoolLeaders', 'legalTexts'));
grant select on public.app_settings to anon;
