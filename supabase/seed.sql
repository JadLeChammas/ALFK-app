-- ============================================================================
-- Données de départ (facultatif) — à exécuter APRÈS schema.sql.
-- Ajoute des promos, quelques événements et publications pour tester.
-- Supprimables ensuite depuis l'espace admin de l'app.
-- ============================================================================

insert into public.promos (year, whatsapp) select y, null from generate_series(2012, 2029) y
on conflict (year) do nothing;

insert into public.events (title, date, location, category, description, cover) values
  ('Soirée de rentrée', now() + interval '3 days', 'LFK · Paris', 'soiree',
   'La traditionnelle soirée de rentrée de l''Amicale du LFK ! L''occasion de se retrouver et de lancer cette nouvelle année ensemble.',
   'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=70'),
  ('Tournoi sportif inter-promos', now() + interval '8 days', 'LFK · Koweït', 'sport',
   'Football, basket et volley : chaque promo monte son équipe.',
   'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=70'),
  ('Forum d''orientation', now() + interval '20 days', 'LFK · Koweït', 'culture',
   'Les anciens élèves présentent leurs universités et leurs parcours aux élèves de Première et de Terminale.',
   'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=70'),
  ('Dîner de gala', now() + interval '73 days', 'Koweït City', 'culture',
   'Le grand dîner annuel de l''Amicale, en présence de la direction du lycée.',
   'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=70');

insert into public.publications (title, category, date, cover, excerpt, body) values
  ('Bienvenue sur la nouvelle plateforme', 'actualite', now(),
   'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=70',
   'L''Amicale du LFK a enfin sa plateforme privée, sur téléphone comme sur ordinateur.',
   E'Chères et chers membres,\n\nNotre nouvelle plateforme réunit toute la communauté au même endroit : annuaire par promo, Repère, événements, publications et messagerie privée.\n\nÀ très vite !'),
  ('Nouvelle association : LFK Business Club', 'annonce', now() - interval '5 days',
   'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=70',
   'Un club pour connecter les alumni entrepreneurs, dirigeants et jeunes diplômés.',
   E'Le LFK Business Club réunira chaque trimestre les alumni autour de conférences, d''afterworks et de mentorat.');
