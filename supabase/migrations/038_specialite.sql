-- 038 — Profils : « Spécialité », un texte libre où le membre précise ses études ou son métier
-- (systèmes embarqués, IA, cybersécurité, médecine générale, cardiologie…). Visible des membres connectés.

alter table public.profiles add column if not exists specialty text;
grant select (specialty) on public.profiles to authenticated;
