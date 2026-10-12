-- 055 — Mots interdits : la liste modifiée par les admins (Admin → Mots interdits), gardée dans
-- app_settings (clé « bannedWords » : les mots ajoutés et retirés). Les visiteurs la lisent aussi, pour
-- que les pages publiques (actualités) masquent les mêmes mots. Les textes eux-mêmes ne changent pas :
-- les mots sont masqués « ***** » à l'affichage.

drop policy if exists "settings public pages" on public.app_settings;
create policy "settings public pages" on public.app_settings for select to anon, authenticated
  using (key in ('credits', 'lfkStory', 'showDemo', 'schoolLeaders', 'legalTexts', 'bannedWords'));
grant select on public.app_settings to anon;
