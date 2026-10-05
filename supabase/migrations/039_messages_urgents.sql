-- 039 — Messages urgents des admins : une fenêtre qui s'affiche au membre (sur toutes les pages, dès
-- la connexion) jusqu'à ce qu'il clique « J'ai compris ». Raisons toutes prêtes (photo de profil
-- invalide…) et/ou texte libre. Une ligne par destinataire.

create table if not exists public.urgent_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  body text,
  reasons text[] not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);
create index if not exists urgent_messages_user_idx on public.urgent_messages (user_id, created_at);

alter table public.urgent_messages enable row level security;

-- Chacun lit les siens ; les admins lisent tout (pour voir qui a lu).
drop policy if exists "urgent read" on public.urgent_messages;
create policy "urgent read" on public.urgent_messages for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
-- Seuls les admins envoient et retirent.
drop policy if exists "urgent admin insert" on public.urgent_messages;
create policy "urgent admin insert" on public.urgent_messages for insert to authenticated
  with check (public.is_admin());
drop policy if exists "urgent admin delete" on public.urgent_messages;
create policy "urgent admin delete" on public.urgent_messages for delete to authenticated
  using (public.is_admin());
-- Le destinataire marque le sien comme lu (seule la colonne acknowledged_at peut changer).
drop policy if exists "urgent acknowledge" on public.urgent_messages;
create policy "urgent acknowledge" on public.urgent_messages for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, delete on public.urgent_messages to authenticated;
grant update (acknowledged_at) on public.urgent_messages to authenticated;

-- En direct : le message s'affiche sans recharger la page.
do $$ begin
  alter publication supabase_realtime add table public.urgent_messages;
exception when duplicate_object then null; end $$;
