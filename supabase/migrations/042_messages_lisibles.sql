-- 042 — Vue « messages_lisibles » : les messages privés avec le nom de l'expéditeur et du destinataire,
-- pour les lire dans Supabase (Table Editor → messages_lisibles) au lieu des identifiants.
--
-- Réservée au tableau de bord Supabase : ni les visiteurs ni les membres connectés ne peuvent la lire
-- (et security_invoker applique de toute façon les règles d'accès des tables d'origine).

create or replace view public.messages_lisibles with (security_invoker = true) as
select
  m.created_at as date,
  coalesce(s.first_name || ' ' || upper(s.last_name), '(compte supprimé)') as expediteur,
  coalesce(r.first_name || ' ' || upper(r.last_name), '(compte supprimé)') as destinataire,
  m.text as message,
  m.conversation_id,
  m.sender_id,
  r.id as recipient_id,
  m.id
from public.messages m
join public.conversations c on c.id = m.conversation_id
left join public.profiles s on s.id = m.sender_id
left join public.profiles r on r.id = (
  select x from unnest(c.members) as x where x is distinct from m.sender_id limit 1
)
order by m.created_at desc;

revoke all on public.messages_lisibles from public, anon, authenticated;
