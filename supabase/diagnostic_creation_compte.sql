-- Diagnostic : pourquoi la création d'un compte échoue (« Database error creating new user »).
--
-- À coller dans le SQL Editor de Supabase. Ce test crée un faux compte de membre d'honneur exactement
-- comme le fait le bouton « Créer le compte », puis ANNULE tout (rollback) : rien n'est enregistré.
-- S'il y a un problème, Supabase affiche ici le vrai message d'erreur (au lieu de « Database error »).
-- S'il n'y en a pas, la dernière requête affiche le profil qui aurait été créé.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test-diagnostic@example.com',
  '{"created_by_admin": true, "role": "honneur", "fonction": "Test", "bureau_code": ""}'::jsonb,
  '{"first_name": "Test", "last_name": "Diagnostic", "gender": "M", "promo": "", "country": "", "city": "", "school": "", "phone": "", "birth_date": ""}'::jsonb,
  now(),
  now()
);

select first_name, last_name, role, approved, fonction from public.profiles where email = 'test-diagnostic@example.com';

rollback;
