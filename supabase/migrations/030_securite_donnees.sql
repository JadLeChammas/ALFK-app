-- 030 — Sécurité des données (audit d'octobre 2026).
--
-- 1. Coordonnées privées : une fonction rend e-mail, téléphone et date de naissance des membres selon
--    leurs réglages de confidentialité (show_email / show_phone / show_birthday), et les champs internes
--    (justificatif, code Bureau, consentement aux actualités) au membre lui-même et aux admins seulement.
--    L'application lit désormais ces champs par là ; la migration 031 retire ensuite la lecture directe
--    de ces colonnes (jusque-là, tout membre approuvé pouvait les lire par l'API, même masquées).
-- 2. Fonctions : les fonctions de déclencheur ne sont plus appelables par l'API, les fonctions d'aide
--    des règles d'accès plus par les visiteurs non connectés, et chaque fonction a un search_path fixe.
-- 3. Saisies : longueurs maximales et formats vérifiés par la base (formulaire de contact, profils,
--    messages, publications…), noms sans < ni >, photo de profil uniquement depuis le stockage du site.
-- 4. Fichiers : le bucket public « media » n'accepte plus que des images (10 Mo max, pas de SVG) et
--    « mail-attachments » que des documents courants (PDF, images, Office, texte) — jamais de HTML,
--    de script ni d'exécutable.

-- ——— 1. Coordonnées privées ———

create or replace function public.member_private_fields(only_id uuid default null)
returns table (
  id uuid,
  email text,
  phone text,
  birth_date date,
  bureau_code text,
  proof_path text,
  proof_name text,
  proof_mime text,
  proof_uploaded_at timestamptz,
  marketing_opt_in boolean,
  signup_notified boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select auth.uid() as uid, public.is_admin() as adm, public.is_approved() as ok)
  select
    p.id,
    case when p.id = me.uid or me.adm or p.show_email then p.email end,
    case when p.id = me.uid or me.adm or p.show_phone then p.phone end,
    case when p.id = me.uid or me.adm or p.show_birthday then p.birth_date end,
    case when p.id = me.uid or me.adm then p.bureau_code end,
    case when p.id = me.uid or me.adm then p.proof_path end,
    case when p.id = me.uid or me.adm then p.proof_name end,
    case when p.id = me.uid or me.adm then p.proof_mime end,
    case when p.id = me.uid or me.adm then p.proof_uploaded_at end,
    case when p.id = me.uid or me.adm then p.marketing_opt_in end,
    case when p.id = me.uid or me.adm then p.signup_notified end
  from public.profiles p, me
  -- the same rows as the « profiles read » policy
  where me.uid is not null
    and (p.id = me.uid or me.adm or (me.ok and p.approved))
    and (only_id is null or p.id = only_id);
$$;

revoke execute on function public.member_private_fields(uuid) from public, anon;
grant execute on function public.member_private_fields(uuid) to authenticated, service_role;

-- ——— 2. Fonctions ———

-- Déclencheurs : appelés par la base, jamais par l'API (le droit EXECUTE n'est vérifié qu'à la création
-- du déclencheur, ils continuent donc de fonctionner).
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

-- Aides des règles d'accès : toutes les règles qui les utilisent sont « to authenticated ».
revoke execute on function
  public.is_admin(), public.is_approved(), public.my_role(), public.can_publish(), public.can_view_events(),
  public.in_circle(), public.can_message(uuid, uuid), public.is_question_author(uuid)
  from public, anon;
grant execute on function
  public.is_admin(), public.is_approved(), public.my_role(), public.can_publish(), public.can_view_events(),
  public.in_circle(), public.can_message(uuid, uuid), public.is_question_author(uuid)
  to authenticated, service_role;

alter function public.guard_conversation_update() set search_path = public;
alter function public.check_completion() set search_path = public;
alter function public.try_date(text) set search_path = public;
alter function public.is_valid_phone(text) set search_path = public;
alter function public.is_valid_birth_date(date) set search_path = public;
alter function public.place_key(text) set search_path = public;
alter function public.resolve_place(text, jsonb) set search_path = public;

-- ——— 3. Saisies ———

-- Formulaire de contact (ouvert aux visiteurs) : tailles raisonnables, e-mail valide, et un message
-- arrive toujours « non lu ».
alter table public.contacts
  add constraint contacts_name_len check (char_length(name) between 1 and 120),
  add constraint contacts_email_format check (char_length(email) <= 254 and email ~ '^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$'),
  add constraint contacts_subject_len check (subject is null or char_length(subject) <= 200),
  add constraint contacts_message_len check (char_length(message) between 1 and 5000);

drop policy if exists "contacts submit" on public.contacts;
create policy "contacts submit" on public.contacts for insert to anon, authenticated
  with check (coalesce(read, false) = false);

alter table public.profiles
  add constraint profiles_names_check check (
    char_length(first_name) <= 80 and char_length(last_name) <= 80
    and first_name !~ '[<>]' and last_name !~ '[<>]'
  ),
  add constraint profiles_text_len check (
    coalesce(char_length(bio), 0) <= 1000
    and coalesce(char_length(city), 0) <= 120
    and coalesce(char_length(country), 0) <= 120
    and coalesce(char_length(school), 0) <= 200
    and coalesce(char_length(school_country), 0) <= 120
    and coalesce(char_length(employer), 0) <= 200
    and coalesce(char_length(job_title), 0) <= 200
    and coalesce(char_length(field_of_study), 0) <= 200
    and coalesce(char_length(fonction), 0) <= 120
    and coalesce(octet_length(cv::text), 0) <= 100000
    and coalesce(octet_length(other_schools::text), 0) <= 20000
  ),
  -- Photo de profil : un fichier du bucket « media » de ce projet, pas une adresse extérieure (pixel
  -- espion, contenu non vérifié).
  add constraint profiles_avatar_storage check (
    avatar is null or avatar ~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/media/'
  );

alter table public.messages add constraint messages_text_len check (char_length(text) between 1 and 5000);
alter table public.circle_messages add constraint circle_messages_text_len check (char_length(text) between 1 and 5000);
alter table public.answers add constraint answers_text_len check (char_length(text) between 1 and 5000);
alter table public.questions add constraint questions_text_len check (char_length(text) between 1 and 2000);
alter table public.publications add constraint publications_len check (
  char_length(title) <= 300 and coalesce(char_length(excerpt), 0) <= 2000 and coalesce(char_length(body), 0) <= 50000
);
alter table public.events add constraint events_len check (
  char_length(title) <= 300 and coalesce(char_length(description), 0) <= 10000 and coalesce(char_length(location), 0) <= 300
);

-- ——— 4. Fichiers ———

update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
 where id = 'media';

update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array[
         'application/pdf',
         'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
         'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet',
         'application/vnd.oasis.opendocument.presentation',
         'text/plain', 'text/csv', 'text/calendar'
       ]
 where id = 'mail-attachments';
