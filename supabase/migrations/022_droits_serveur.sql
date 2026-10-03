-- 022 — Droits du serveur (api/admin.ts : supprimer, refuser ou créer un compte).
--
-- Le projet n'expose pas automatiquement les tables : les droits ont été donnés à anon et
-- authenticated seulement. Le serveur, qui utilise la clé secrète (rôle service_role), ne pouvait
-- donc pas lire public.profiles pour vérifier qu'on est admin : il répondait « forbidden ».
-- service_role contourne déjà la RLS ; il lui manquait seulement ces droits.

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Les tables créées plus tard (par les prochaines migrations) l'auront aussi.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
