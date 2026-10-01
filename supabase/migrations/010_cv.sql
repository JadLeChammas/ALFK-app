-- 010 — CV façon LinkedIn sur le profil, et CV en PDF joint.
-- Le CV (titre, formation, expériences, projets, langues…) est un champ JSON du profil : il suit
-- les mêmes règles de lecture que le profil (membres approuvés) et d'écriture (le membre lui-même).

alter table public.profiles add column if not exists cv jsonb;

-- CV joints en PDF : bucket privé, liens signés. Le membre dépose dans son dossier ; les membres
-- approuvés peuvent les lire.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 10485760, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cvs upload own folder" on storage.objects;
create policy "cvs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "cvs read members" on storage.objects;
create policy "cvs read members" on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and public.is_approved());
drop policy if exists "cvs delete own or admin" on storage.objects;
create policy "cvs delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
