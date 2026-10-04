-- 031 — Profils : les colonnes privées ne se lisent plus directement.
--
-- À appliquer APRÈS le déploiement de l'application qui lit ces champs par member_private_fields()
-- (migration 030) : l'ancienne version demandait « select * » sur profiles et échouerait.
--
-- Les membres connectés lisent les colonnes publiques des profils (règle « profiles read » inchangée) ;
-- e-mail, téléphone, date de naissance, justificatif, code Bureau et consentement aux actualités ne
-- passent plus que par member_private_fields(), qui applique les réglages de confidentialité.
-- Le serveur (clé secrète, service_role) garde l'accès complet ; les mises à jour ne changent pas.

revoke select on public.profiles from anon, authenticated;

grant select (
  id, first_name, last_name, gender, role, approved, promo, school, fonction, city, country, avatar, bio,
  show_email, show_phone, show_birthday, created_at, last_active_at, alumni_number, created_by_admin,
  field_of_study, mentor, situation, employer, job_title, cv, nationalities, other_schools, fields_of_study,
  school_country, grade, needs_completion, locale
) on public.profiles to authenticated;
