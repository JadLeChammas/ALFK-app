# 🥚 Easter eggs de l'Amicale LFK

Des surprises cachées dans le site. Chut, ne le dites pas à tout le monde 🤫

| # | Easter egg | Comment le dévoiler |
|---|---|---|
| 1 | **Mode rétro (années 2000)** : Comic Sans, couleurs Windows 98, bannière qui défile, panneau « EN CONSTRUCTION », compteur de visites | Taper **5 fois de suite sur le logo**, ou faire le **code Konami** au clavier : ↑ ↑ ↓ ↓ ← → ← → B A. Pour sortir : le bouton « Quitter le mode rétro » ou 5 taps de plus. |
| 2 | **Langue Pirate et bonnet de pirate** : le logo devient un bonnet de pirate et tout le site parle Pirate | Taper **7 fois de suite sur le logo**. 7 taps de plus pour revenir à votre langue. |
| 3 | **Générique de fin** : les noms du bureau et des contributeurs défilent comme à la fin d'un film | Cliquer sur le **©** en bas de page (footer des pages publiques, ou « © Amicale LFK » en bas des pages membres). Toucher l'écran pour fermer. Les admins modifient le générique dans **Tableau de bord → Générique** (titre, sections, noms, phrases de fin, avec aperçu). |
| 4 | **Anniversaire** : des ballons s'envolent sur le profil et le nom scintille en doré ✨ dans l'annuaire | Automatique **le jour de votre anniversaire**. Visible par les autres seulement si vous avez choisi d'afficher votre anniversaire. |
| 5 | **Jour du bac** : bannière « Bon courage aux Terminales ! » | Automatique le jour d'une date du calendrier dont le titre contient « **Bac** » (un admin ajoute par exemple « Bac : épreuve de philosophie » à la bonne date). |
| 6 | **Le globe qui tombe** : le globe chute puis rebondit | Sur téléphone (navigateur), **secouer le téléphone** sur une page avec un globe. Sur iPhone, toucher d'abord le globe une fois pour autoriser les capteurs de mouvement. |
| 7 | **Le chameau** 🐪 : un petit chameau traverse l'écran | Rester **inactif 5 minutes** sans toucher la souris, le clavier ni l'écran. |
| 8 | **Développeur légendaire** : une fiche spéciale avec un badge 🏆 | Rechercher le nom complet « **Jad El Chammas** » dans la recherche (Ctrl K / la loupe) ou dans l'Annuaire. |
| 9 | **Tempête de sable** : quelques secondes de vent de sable sur l'écran | Rechercher « **chameau** », « **50°C** » ou « **shamal** » dans la recherche ou l'Annuaire. |

## Pour les développeurs

- Le code des easter eggs est dans `src/lib/eggs.ts` (mots-clés, taps sur le logo, secousse, inactivité) et `src/components/EasterEggs.tsx` (générique, tempête de sable, chameau, ballons, bannière du bac, fiche du développeur).
- Le mode rétro est dans `src/components/RetroLayer.tsx`, le bonnet de pirate dans `src/components/ui/Logo.tsx`. Une carte au trésor (le globe en Pirate) existe dans `src/components/fx/Globe.tsx` mais est désactivée pour l'instant (`TREASURE_MAP = false`).
- Le générique est modifiable par les admins (`/admin/generique`), enregistré dans `app_settings` (clé `credits`, lisible par les visiteurs grâce à la migration 011). Le texte par défaut est dans `src/data/credits.ts` ; les membres du bureau sont lus automatiquement.
