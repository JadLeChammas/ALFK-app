-- 008 — Calendrier des démarches (Parcoursup, concours, candidatures).
-- Une date peut devenir une période (date de fin) et porter un lien officiel ; nouvelle catégorie « demarches ».

alter table public.key_dates add column if not exists end_month int check (end_month is null or end_month between 1 and 12);
alter table public.key_dates add column if not exists end_day int check (end_day is null or end_day between 1 and 31);
alter table public.key_dates add column if not exists url text;

alter table public.key_dates drop constraint if exists key_dates_category_check;
alter table public.key_dates add constraint key_dates_category_check
  check (category in ('francophonie', 'aefe', 'lfk', 'france', 'koweit', 'amicale', 'demarches'));
