-- 014 — Bouton « Voir la démo » affiché ou masqué par les admins.
-- Réglage dans app_settings (clé « showDemo » : 'on' | 'off') ; les visiteurs non connectés
-- doivent pouvoir le lire pour savoir s'il faut afficher l'invitation.

drop policy if exists "settings public pages" on public.app_settings;
create policy "settings public pages" on public.app_settings for select to anon, authenticated
  using (key in ('credits', 'lfkStory', 'showDemo'));
grant select on public.app_settings to anon;
