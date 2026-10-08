-- 049 — Stockage des fichiers : les quatre espaces (buckets) et leurs règles, au même endroit et dans
-- leur état final. Ne change rien à ce qui marche aujourd'hui ; met en forme ce qui était éparpillé
-- (002 à 040) et ce qui n'existait que dans le tableau de bord Supabase (l'espace « media »).
-- Peut être relancée sans risque. Nécessite les migrations 030 et 040 (is_restricted).
--
--   media             public  — photos de profil, couvertures, galeries, logos des partenaires.
--                               Chacun écrit dans son dossier « <son id>/… » ; lecture par lien.
--   proofs            privé   — justificatifs de scolarité : le membre dépose, seuls les admins lisent.
--   cvs               privé   — CV en PDF : le membre dépose, les membres validés lisent.
--   mail-attachments  privé   — pièces jointes des e-mails du bureau : admins seulement.
-- 10 Mo maximum par fichier partout, et seulement les types que l'application accepte
-- (src/lib/fileSafety.ts).

-- ─── Les espaces ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']),
  ('proofs', 'proofs', false, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf']),
  ('cvs', 'cvs', false, 10485760,
   array['application/pdf']),
  ('mail-attachments', 'mail-attachments', false, 10485760,
   array[
     'application/pdf',
     'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
     'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
     'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
     'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet',
     'application/vnd.oasis.opendocument.presentation',
     'text/plain', 'text/csv', 'text/calendar'
   ])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ─── media ───────────────────────────────────────────────────────────────────
-- Dépôt : membre validé, compte non restreint, dans son propre dossier.
drop policy if exists "media upload own folder" on storage.objects;
create policy "media upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_approved() and not public.is_restricted()
              and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "media delete own or admin" on storage.objects;
create policy "media delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ─── proofs ──────────────────────────────────────────────────────────────────
drop policy if exists "proofs upload own folder" on storage.objects;
create policy "proofs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "proofs read own or admin" on storage.objects;
create policy "proofs read own or admin" on storage.objects for select to authenticated
  using (bucket_id = 'proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists "proofs delete admin" on storage.objects;
create policy "proofs delete admin" on storage.objects for delete to authenticated
  using (bucket_id = 'proofs' and public.is_admin());

-- ─── cvs ─────────────────────────────────────────────────────────────────────
drop policy if exists "cvs upload own folder" on storage.objects;
create policy "cvs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and not public.is_restricted() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "cvs read members" on storage.objects;
create policy "cvs read members" on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and public.is_approved());
drop policy if exists "cvs delete own or admin" on storage.objects;
create policy "cvs delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ─── mail-attachments ────────────────────────────────────────────────────────
drop policy if exists "mail attachments admin insert" on storage.objects;
create policy "mail attachments admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'mail-attachments' and public.is_admin());
drop policy if exists "mail attachments admin read" on storage.objects;
create policy "mail attachments admin read" on storage.objects for select to authenticated
  using (bucket_id = 'mail-attachments' and public.is_admin());
drop policy if exists "mail attachments admin delete" on storage.objects;
create policy "mail attachments admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'mail-attachments' and public.is_admin());

-- Vérification : les quatre espaces, avec leur visibilité et leur limite.
select id, public, file_size_limit, array_length(allowed_mime_types, 1) as types_acceptes
from storage.buckets where id in ('media', 'proofs', 'cvs', 'mail-attachments') order by id;
