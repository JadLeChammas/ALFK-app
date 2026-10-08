# 🥚 Easter eggs de l'Amicale LFK

Des surprises cachées dans le site. Chut, ne le dites pas à tout le monde 🤫

| # | Easter egg | Comment le dévoiler |
|---|---|---|
| 1 | **Mode rétro (années 2000)** : Comic Sans, couleurs Windows 98, bannière qui défile, panneau « EN CONSTRUCTION », compteur de visites | Taper **5 fois de suite sur le logo**, taper « **2003** » dans la recherche ou l'Annuaire (téléphone), ou faire le **code Konami** au clavier : ↑ ↑ ↓ ↓ ← → ← → B A. Pour sortir : le bouton « Quitter le mode rétro » ou 5 taps de plus. |
| 2 | **Langue Pirate et bonnet de pirate** : le logo devient un bonnet de pirate et tout le site parle Pirate | Taper **7 fois de suite sur le logo**. 7 taps de plus pour revenir à votre langue. |
| 3 | **Générique de fin** : les noms du bureau et des contributeurs défilent comme à la fin d'un film | Cliquer sur le **©** en bas de page (footer des pages publiques, ou « © Amicale LFK » en bas des pages membres). Toucher l'écran pour fermer. Les admins modifient le générique dans **Tableau de bord → Générique** (titre, sections, noms, phrases de fin, avec aperçu). |
| 4 | **Anniversaire** : des ballons s'envolent sur le profil et le nom scintille en doré ✨ dans l'annuaire | Automatique **le jour de votre anniversaire**. Visible par les autres seulement si vous avez choisi d'afficher votre anniversaire. |
| 5 | **Jour du bac** : bannière « Bon courage aux Terminales ! » | Automatique le jour d'une date du calendrier dont le titre contient « **Bac** » (un admin ajoute par exemple « Bac : épreuve de philosophie » à la bonne date). |
| 6 | **Développeurs légendaires** : une fiche spéciale avec un badge 🏆 | Rechercher le nom complet « **Jad El Chammas** » ou « **Anwar Al Bitar** » dans la recherche (Ctrl K / la loupe) ou dans l'Annuaire. |
| 6 bis | **Ambassadeur légendaire** : une fiche spéciale avec un badge 🎖️ | Rechercher le nom complet « **Adriano Sfeir** » dans la recherche (Ctrl K / la loupe) ou dans l'Annuaire. |
| 6 ter | **Pirate légendaire** : une fiche spéciale, avec un chapeau de pirate sur sa photo 🏴‍☠️ | Rechercher le nom complet « **Tatiana El Hajj** » dans la recherche (Ctrl K / la loupe) ou dans l'Annuaire. |
| 7 | **Mode futuriste « ALFK 2077 »** : couleurs néon (cyan et violet), polices futuristes, grille lumineuse, ligne de balayage et badge « SYSTÈME 2077 » | Au clavier : **↓ ↓ ↑ ↑ → ← → ← Y Z**. Sur téléphone : taper « **2077** » dans la recherche ou l'Annuaire. Même code (ou bouton « Quitter 2077 ») pour revenir. |
| 8 | **Mode Minitel (bac 1990)** 📟 : tout passe en vert phosphore sur fond noir, police pixelisée, photos teintées en vert, et le bruit d'un modem qui se connecte au « 3615 ALFK » | Taper « **minitel** » dans la recherche ou l'Annuaire. Le retaper pour revenir. |
| 9 | **Le site à l'envers** 🙃 : tout le site se retourne pendant 10 secondes, « comme en Australie » | Taper « **australie** » dans la recherche ou l'Annuaire. |

Les badges des légendes (🏆, 🎖️, 🏴‍☠️) sont aussi visibles sur leur profil : leur propre page et leur fiche membre.

## Pour les développeurs

- Le code des easter eggs est dans `src/lib/eggs.ts` (mots-clés, taps sur le logo) et `src/components/EasterEggs.tsx` (générique, ballons, bannière du bac, fiches des légendes).
- Le mode rétro est dans `src/components/RetroLayer.tsx`, le bonnet de pirate dans `src/components/ui/Logo.tsx`. Une carte au trésor (le globe en Pirate) existe dans `src/components/fx/Globe.tsx` mais est désactivée pour l'instant (`TREASURE_MAP = false`).
- Le générique est modifiable par les admins (`/admin/generique`), enregistré dans `app_settings` (clé `credits`, lisible par les visiteurs grâce à la migration 011). Le texte par défaut est dans `src/data/credits.ts` ; les membres du bureau sont lus automatiquement.
