-- 011 — Générique de fin modifiable par les admins (easter egg du ©).
-- Il est enregistré dans app_settings (clé « credits ») ; les visiteurs non connectés
-- peuvent lire cette seule ligne pour voir le générique depuis les pages publiques.

drop policy if exists "settings public credits" on public.app_settings;
create policy "settings public credits" on public.app_settings for select to anon, authenticated
  using (key = 'credits');
grant select on public.app_settings to anon;
