-- 013 — Page « Le LFK » (histoire et fun facts), modifiable par les admins.
-- Enregistrée dans app_settings (clé « lfkStory ») ; les visiteurs non connectés peuvent la lire,
-- comme le générique de fin (migration 011).

drop policy if exists "settings public credits" on public.app_settings;
drop policy if exists "settings public pages" on public.app_settings;
create policy "settings public pages" on public.app_settings for select to anon, authenticated
  using (key in ('credits', 'lfkStory'));
grant select on public.app_settings to anon;
