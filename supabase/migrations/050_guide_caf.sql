-- 050 — Guide « Arriver en France », étape CAF : « y compris étrangers » retiré, et le texte rectifié
-- (selon le logement, l'aide est l'APL ou l'ALS ; elle n'est versée qu'à partir du mois qui suit
-- l'entrée dans le logement). Français et anglais. Ne touche l'étape que si son texte français est
-- encore celui d'origine (sinon, rien ne change).

update public.app_settings
set value = (
  select jsonb_agg(
           case when g->>'id' = 'guide-fr' then jsonb_set(g, '{steps}', (
             select jsonb_agg(
                      case when s->>'id' = 'g-caf'
                             and s->>'body' = 'Les étudiants, y compris étrangers, peuvent avoir droit à l’APL. Faites la demande en ligne dès votre entrée dans le logement : l’aide n’est pas rétroactive.'
                           then s || jsonb_build_object(
                             'body', 'Selon votre logement et vos ressources, vous pouvez avoir droit à une aide au logement de la CAF (APL ou ALS). Faites la demande en ligne sur caf.fr dès votre entrée dans le logement : l’aide n’est pas rétroactive et n’est versée qu’à partir du mois qui suit votre arrivée.',
                             'bodyEn', 'Depending on your accommodation and income, you may be entitled to housing benefit from the CAF (APL or ALS). Apply online on caf.fr as soon as you move in: the benefit is not backdated and is only paid from the month after you move in.')
                           else s end
                      order by so)
             from jsonb_array_elements(g->'steps') with ordinality as st(s, so)))
           else g end
           order by go)
  from jsonb_array_elements(value::jsonb) with ordinality as gs(g, go)
)::text
where key = 'guides';

-- Vérification : le nouveau texte de l'étape CAF.
select s->>'body' as caf
from public.app_settings, jsonb_array_elements(value::jsonb) g, jsonb_array_elements(g->'steps') s
where key = 'guides' and g->>'id' = 'guide-fr' and s->>'id' = 'g-caf';
