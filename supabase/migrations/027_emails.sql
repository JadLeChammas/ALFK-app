-- 027 — Emails (Brevo) : automatiques, envoyés par les admins, et actualités.
--
--   • profiles.marketing_opt_in : le membre accepte de recevoir les actualités de l'Amicale
--     (case à l'inscription et dans Paramètres ; lien de désinscription dans chaque email).
--   • profiles.locale : langue des emails (fr ou en).
--   • profiles.signup_notified : l'email « inscription reçue » et l'alerte aux admins sont partis.
--   • Bucket privé « mail-attachments » : les pièces jointes des emails écrits par les admins.
-- Les textes des emails automatiques et la signature sont dans app_settings (emailTemplates,
-- emailSignature), modifiables dans Admin → Emails. L'envoi passe par api/email.ts (clé Brevo
-- dans Vercel, jamais dans le navigateur).

alter table public.profiles add column if not exists marketing_opt_in boolean not null default false;
alter table public.profiles add column if not exists locale text not null default 'fr';
alter table public.profiles drop constraint if exists profiles_locale_check;
alter table public.profiles add constraint profiles_locale_check check (locale in ('fr', 'en'));
alter table public.profiles add column if not exists signup_notified boolean not null default false;

insert into storage.buckets (id, name, public, file_size_limit)
values ('mail-attachments', 'mail-attachments', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists "mail attachments admin insert" on storage.objects;
create policy "mail attachments admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'mail-attachments' and public.is_admin());
drop policy if exists "mail attachments admin read" on storage.objects;
create policy "mail attachments admin read" on storage.objects for select to authenticated
  using (bucket_id = 'mail-attachments' and public.is_admin());
drop policy if exists "mail attachments admin delete" on storage.objects;
create policy "mail attachments admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'mail-attachments' and public.is_admin());
