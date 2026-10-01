# Amicale LFK — application

Le réseau privé des anciens du Lycée Français de Koweït. Une seule base de code pour
**iPhone, Android et Web** (Expo SDK 57 + Expo Router).

Architecture, pages et design system : voir [DESIGN.md](DESIGN.md).

## Lancer le projet

```bash
npm install
npm run web        # navigateur — http://localhost:8081
npm run android    # émulateur / appareil Android (Expo Go)
npm run ios        # simulateur iOS (macOS) ou Expo Go
```

## Comptes de démonstration

Les données sont pour l'instant une **démo locale** (`src/data/seed.ts`), enregistrée sur
l'appareil. Sur l'écran de connexion, les boutons « Comptes de démonstration » ouvrent :

| Compte | E-mail | Accès |
|---|---|---|
| Admin | `jad@amicale-lfk.demo` | Espace membre + tableau de bord admin |
| Alumni | `sarah.martin@amicale-lfk.demo` | Espace membre |
| Élève | `nour.haddad@amicale-lfk.demo` | Espace membre |
| Direction | `direction@amicale-lfk.demo` | Proviseur (Membre d'honneur) : espace membre + publier, créer des événements, statistiques |
| En attente | `attente@amicale-lfk.demo` | Écran « compte en attente » |

Mot de passe : `demo1234`. Paramètres → Zone sensible → « Réinitialiser les données de démo »
remet tout à zéro.

## Mise en ligne : Supabase (base de données) + Vercel (site)

Sans configuration, l'app tourne en **démo locale**. Avec les variables Supabase, elle utilise la vraie base.

### 1. Supabase
1. *SQL Editor* → *New query* → coller [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
2. Puis, dans l'ordre, chaque fichier de [`supabase/migrations/`](supabase/migrations) → **Run**
   (`002_numeros_et_coordonnees.sql` : numéro Alumni, code Bureau, date de naissance et téléphone obligatoires ;
   `003_justificatif_annonces_calendrier.sql` : justificatif de scolarité, annonces vérifiées, orientation,
   calendrier, membres d'honneur, communauté WhatsApp ;
   `004_pages_publiques.sql` : chiffres, bureau et partenaires des pages publiques, sans exposer les profils ;
   `005_situation_etudes_travail.sql` : « étudiant » ou « en activité », entreprise et poste).
   Facultatif : faire pareil avec [`supabase/seed.sql`](supabase/seed.sql) (promos, événements et publications d'exemple).
2. *Authentication → URL Configuration* : **Site URL** = l'adresse Vercel (ex. `https://alfk-app.vercel.app`),
   et ajouter `https://alfk-app.vercel.app/**` dans **Redirect URLs** (liens de réinitialisation du mot de passe).
3. *Authentication → Sign In / Providers → Email* : « Confirm email » peut être désactivé, puisque chaque
   compte est de toute façon validé par un admin.
4. *Project Settings → API Keys* : noter la **Publishable key** et la **Secret key** (la secrète ne se partage jamais).

### 2. Vercel
1. *Add New → Project* → importer le repo **ALFK-app** (la config est dans [`vercel.json`](vercel.json)).
2. *Environment Variables* :

| Nom | Valeur |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Project URL Supabase |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SECRET_KEY` | Secret key (serveur uniquement : fonctions [`api/`](api/admin.ts)) |

3. **Deploy**.

### 3. Premier administrateur
S'inscrire sur le site, puis dans Supabase → *SQL Editor* :
```sql
update public.profiles set role = 'admin', approved = true where email = 'votre@email.com';
```
Ensuite, tout se gère depuis l'espace admin de l'app.

### En local avec Supabase
Copier `.env.example` en `.env.local` et remplir les deux variables `EXPO_PUBLIC_…`.
Les actions admin qui passent par `api/` (créer un membre, réinitialiser un mot de passe, supprimer un
compte) ne fonctionnent qu'une fois déployées sur Vercel.

## Vérifications

```bash
npx tsc --noEmit
npx expo lint
```

## Prochaine étape

Brancher un vrai backend (Supabase : Auth, Postgres avec règles d'accès, stockage des photos)
à la place de `src/data/store.tsx`, sans changer les écrans.
