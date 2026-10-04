-- 029 — Modifier une publication ou une annonce.
-- Les admins pouvaient déjà tout modifier (politique « publications review »). L'auteur peut
-- maintenant modifier la sienne ; s'il ne publie pas directement (simple membre), elle repasse
-- « en attente » et un admin la vérifie de nouveau.

drop policy if exists "publications edit own" on public.publications;
create policy "publications edit own" on public.publications for update to authenticated
  using (author_id = auth.uid() and public.is_approved())
  with check (author_id = auth.uid() and (status = 'pending' or public.can_publish()));
