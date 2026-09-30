# Amicale LFK — Architecture UX & Design System

Application unique (iPhone · Android · Web) construite avec **Expo SDK 57 + Expo Router**.
Ce document fixe l'architecture, les pages, les composants et le design system avant le code.

---

## 1. Architecture UX — états d'accès

| État | Ce que voit l'utilisateur |
|---|---|
| Non connecté | `/bienvenue` (page d'accueil publique), `/connexion`, `/inscription`, `/mot-de-passe-oublie` + pages légales |
| Connecté, non approuvé | `/en-attente` uniquement (avec l'envoi du justificatif s'il manque) |
| Session de récupération | `/nouveau-mot-de-passe` — prioritaire sur tout le reste |
| Approuvé (Alumni, Élève, Membre d'honneur) | Espace membre complet |
| Approuvé + Admin | Espace membre + `/admin/*` |

Le gating est **structurel** : `Stack.Protected` dans `src/app/_layout.tsx`. Une URL devinée ne
contourne pas le garde (et côté serveur, les politiques RLS Supabase appliquent les mêmes règles).

### Rôles et droits (`src/data/permissions.ts`)

| | Alumni / Élève | Membre d'honneur (direction du lycée) | Admin |
|---|---|---|---|
| Annuaire, Repère, Publications, Messages | ✓ | ✓ | ✓ |
| Événements et galeries photo | Alumni ✓ · Élève — | ✓ | ✓ |
| Publier un article, créer un événement | — | ✓ (gère ses propres contenus) | ✓ |
| Statistiques du réseau (lecture seule, `/statistiques`) | — | ✓ | ✓ (dans le tableau de bord) |
| Approbations, comptes, rôles, modération, contact, journal | — | — | ✓ |

- Le rôle Membre d'honneur est réservé au proviseur et à son assistante : il n'est **pas proposé à
  l'inscription**, seul un Admin l'attribue (avec un champ « Fonction », ex. « Proviseur »).
- Messagerie privée **désactivée entre la direction et les élèves** (mineurs), dans les deux sens.

### Règles d'inscription et numéros (`src/data/members.ts`, migration `002`)

| | Alumni | Élève | Membre d'honneur | Admin (Bureau) |
|---|---|---|---|---|
| Date de naissance (JJ/MM/AAAA) et téléphone (+indicatif) | obligatoires | obligatoires | facultatifs | obligatoires |
| Numéro Alumni (5 chiffres, 11111…, jamais réattribué) | à l'inscription | non — attribué s'il devient Alumni | aucun | oui |
| Code Bureau (4 chiffres, unique, saisi par un admin) | — | — | — | oui |
| Établissement | libre | « Lycée Français du Koweït », imposé | libre | libre |
| Visible dans Repère | oui | non | non | oui |

Ces règles sont vérifiées dans l'app **et** par la base (triggers `apply_member_rules`,
`guard_profile_update`) : modifier les données envoyées ne permet pas de les contourner.
Les numéros ne sont affichés qu'à la personne concernée et aux admins.
« Promo » s'écrit partout « Promo LFK ».

### Justificatif, annonces vérifiées et nouvelles rubriques (migration `003`)

- **Justificatif de scolarité au LFK obligatoire à l'inscription** (étape 3 : bulletin, certificat,
  attestation ou simple photo, image ou PDF, 10 Mo max). Fichier privé (bucket `proofs`), visible
  seulement par son auteur et les admins (liens signés de 10 min). Un admin ne peut pas approuver un
  compte sans justificatif, sauf un compte qu'il a créé lui-même — règle vérifiée aussi par la base.
- **Publications** : admins et direction publient directement ; les autres membres « proposent une
  annonce », publiée seulement après vérification par un admin (file « Annonces à vérifier » dans
  Publications et Admin → Contenus, notifications à l'auteur).
- **Orientation** (`/orientation`) : les anciens par domaine d'études, établissement ou pays ; un ancien
  peut se déclarer « disponible pour conseiller les lycéens » depuis son profil.
- **Calendrier** (`/calendrier`) : dates clés (Francophonie, AEFE, LFK, France, Koweït, Amicale — les
  admins en ajoutent), anniversaires des membres, événements pour ceux qui y ont accès.
- **WhatsApp** (`/whatsapp`) : lien de la communauté (annonces, modifiable par un admin) + groupe de sa
  Promo LFK et tous les groupes (Alumni et admins ; les élèves ne voient que la communauté).
- **Membres d'honneur** (`/membres-honneur`) : institutions (le LFK au départ) et direction du lycée.
  Une institution — par exemple le SCAC de l'Ambassade de France — n'est ajoutée par un admin
  **qu'avec son accord écrit**, y compris pour son logo. Langues : FR, EN, DE, ES, IT, PT, AR (de droite à gauche), JA, ZH.

## 2. Plan des routes

```
src/app/
  _layout.tsx                 Providers + gardes d'accès
  (auth)/bienvenue · connexion · inscription · mot-de-passe-oublie
  en-attente.tsx              Compte en attente d'approbation
  nouveau-mot-de-passe.tsx    Session de récupération
  (app)/_layout.tsx           Shell : sidebar (desktop) / bottom nav (mobile)
    index.tsx                 Accueil / dashboard
    annuaire/index · promo/[annee]
    membre/[id].tsx           Fiche membre
    repere.tsx                Continent → Pays → Universités
    orientation.tsx           Anciens par domaine d'études / établissement
    calendrier.tsx            Dates clés + anniversaires + événements
    whatsapp.tsx              Communauté + groupes de Promo LFK
    membres-honneur.tsx       Institutions + direction du lycée
    evenements/index · [id]   Liste + page immersive avec galerie
    publications/index · [id]
    messages/index · [id]     Inbox + conversation
    profil/index · modifier   Profil + édition
    statistiques.tsx          Statistiques (direction + admins)
    parametres.tsx            Apparence, langue, compte, confidentialité, sécurité
    notifications.tsx
    admin/index · membres · approbations · contenus · contact · journal
  mentions-legales.tsx · plan-du-site.tsx · +not-found.tsx
```

## 3. Navigation

- **Desktop (≥ 1024 px)** : sidebar fixe 248 px — logo, sections (Accueil, Annuaire, Repère,
  Orientation, Calendrier, Événements, Publications, Messages), groupe « Communauté » (WhatsApp,
  Membres d'honneur), puis Paramètres, Notifications et la carte avatar qui ouvre « Mon profil ».
  Section « Administration » visible seulement pour les admins.
- **Tablette (768–1023 px)** : sidebar compacte (icônes seules, 76 px).
- **Mobile (< 768 px)** : la barre de gauche devient la barre du bas — Accueil · Annuaire · Repère ·
  Actus · Messages · **Plus** (feuille avec Événements, Orientation, Calendrier, WhatsApp, Membres
  d'honneur ; sans Événements pour les élèves).
  Le profil s'ouvre avec l'avatar en haut à droite ; Paramètres, Admin et Statistiques sont dans le profil. Repère, Publications, Paramètres, Admin sont accessibles depuis l'Accueil
  (actions rapides) et le Profil (menu).
- **Header** : salutation + date/rôle à gauche ; recherche globale, notifications, avatar à droite.
  La recherche globale couvre membres, promos, pays, événements et publications.

## 4. Design system

### Couleurs (tokens dans `src/theme/tokens.ts`)
Drapeaux : images (`components/ui/Flag.tsx`) — les emojis drapeaux ne s'affichent pas sous Windows.

Identité tirée du logo (argent / noir profond) + le bleu historique du LFK.

| Token | Clair | Sombre | Usage |
|---|---|---|---|
| `bg` | `#F6F7FB` | `#0B0D12` | Fond d'application |
| `surface` | `#FFFFFF` | `#14171F` | Cards |
| `surfaceAlt` | `#F0F2F7` | `#1B1F29` | Inputs, zones secondaires |
| `border` | `#E6E8EF` | `#262B36` | Bordures fines |
| `text` | `#0E1320` | `#EEF0F5` | Texte principal (blanc cassé en sombre) |
| `textMuted` | `#5B6275` | `#9AA1B2` | Texte secondaire |
| `primary` | `#2E45D6` | `#6C7FFF` | Bleu LFK — actions, sélection |
| `primarySoft` | `#E9ECFF` | `#1C2250` | Fonds d'accent |
| `ink` | `#111726` | `#EEF0F5` | Bouton fort / sidebar active |
| `silver` | `#A7ADBA` | `#C9CED8` | Détails « métal » du logo |

Couleurs de statut : `success #12A150`, `warning #E0A100`, `danger #E5484D`, `info #0EA5E9`.
Catégories d'événements : Soirée (violet), Sport (vert), Culture (ambre), Networking (bleu).
Rôles : Alumni (bleu), Élève (vert), Membre d'honneur (ambre), Admin (ink).

### Typographie — Plus Jakarta Sans
Display 34/800 · H1 28/800 · H2 20/700 · H3 16/700 · Body 15/500 · Small 13/500 · Caption 11/700 capitales espacées.

### Forme & espace
- Espacements : 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48
- Rayons : input 14 · card 20 · hero 28 · pill 999
- Ombres très légères en clair ; en sombre, élévation par surface plus claire + bordure.
- Transitions 150–250 ms (pressed/hover : opacité + échelle 0.98).

### Composants réutilisables (`src/components/ui`)
`Screen` · `PageHeader` · `Card` · `SectionHeader` · `Button` (primary / secondary / ghost / danger, pill)
· `IconButton` · `Input` · `SearchBar` · `Avatar` · `Badge` · `RoleBadge` · `Chip`/`Segmented`
· `ListRow` · `EmptyState` · `StatCard` · `BarChart` · `Donut` · `DateBadge` · `Lightbox`
· `ConfirmDialog` · `Toast`.
Composants métier : `MemberCard`, `EventCard`, `PublicationCard`, `ConversationRow`, `WorldDots`.

## 5. Données
`src/data/store.tsx` expose toutes les opérations (auth, membres, événements, galerie, messages,
admin…) via `useStore().actions`. L'implémentation actuelle est une **démo locale** (données de
`src/data/seed.ts`, persistées sur l'appareil) pour itérer sur l'UI. Prochaine étape : la
remplacer par Supabase (Auth, Postgres + RLS, Storage) sans changer les écrans.

Comptes de démo (mot de passe `demo1234`) : boutons sur l'écran de connexion.

## 6. i18n & thème
- `src/i18n` : dictionnaires FR (par défaut) / EN, extensibles.
- `src/theme` : `ThemeProvider` avec préférence Clair / Sombre / Système, persistée ; tout
  l'app lit les tokens via `useTheme()`.
