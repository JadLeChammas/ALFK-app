import { CITY_BY_COUNTRY, UNIVERSITIES } from './countries';
import { DIAL_CODES, FIRST_ALUMNI_NUMBER, hasAlumniNumber, LFK_SCHOOL } from './members';
import type { Db, EventPhoto, Gender, Message, Role, User } from './types';

/** Demo password for every seeded account. */
export const DEMO_PASSWORD = 'demo1234';
export const DEMO_ACCOUNTS = {
  admin: 'jad@amicale-lfk.demo',
  member: 'sarah.martin@amicale-lfk.demo',
  eleve: 'nour.haddad@amicale-lfk.demo',
  pending: 'attente@amicale-lfk.demo',
  direction: 'direction@amicale-lfk.demo',
};

const img = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;
export const IMAGES = {
  party: img('1492684223066-81342ee5ff30'),
  conference: img('1540575467063-178a50c2df87'),
  gala: img('1511795409834-ef04bbd61622'),
  graduation: img('1523580494863-6f3031224c94'),
  friends: img('1529156069898-49953e39b3ac'),
  crowd: img('1517457373958-b7bdd4587205'),
  sport: img('1461896836934-ffe607ba8211'),
  japan: img('1493976040374-85c8e12f0c0e'),
  paris: img('1502602898657-3e91760cbb34'),
  students: img('1522202176988-66273c2fd55f'),
  meeting: img('1552664730-d307ca884978'),
  concert: img('1514525253161-7a46d19cd819'),
  concert2: img('1506157786151-b8491531f063'),
  lights: img('1519671482749-fd09be7ccebf'),
  stage: img('1459749411175-04bf5292ceea'),
  halloween: img('1509557965875-b88c97052f0e'),
  kuwait: img('1578895101408-1a36b834405b'),
  campus: img('1541339907198-e08756dedf3f'),
  festival: img('1470229722913-7c0e2dbbafd3'),
  team: img('1504384308090-c894fdcc538d'),
  dinner: img('1528605248644-14dd04022da1'),
  group: img('1543269865-cbf427effbad'),
  cheers: img('1511632765486-a01980e01a18'),
  party2: img('1527529482837-4698179dc6ce'),
  dj: img('1470225620780-dba8ba36b745'),
  work: img('1531482615713-2afd69097998'),
  lecture: img('1524178232363-1fb2b075b655'),
  night: img('1498243691581-b145c3f54a5a'),
  sunset: img('1475721027785-f74eccf877e2'),
};

const portrait = (g: Gender, n: number) =>
  `https://randomuser.me/api/portraits/${g === 'F' ? 'women' : 'men'}/${n % 99}.jpg`;

// Deterministic pseudo-random generator so the demo is identical on every device.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString();
const ymd = (d: Date) => d.toISOString().slice(0, 10);

const F_NAMES = ['Sarah', 'Léa', 'Chloé', 'Emma', 'Camille', 'Julie', 'Yasmine', 'Nour', 'Lina', 'Maya', 'Rania', 'Inès', 'Clara', 'Zeina', 'Hala', 'Manon', 'Alice', 'Dana', 'Lara', 'Mariam'];
const M_NAMES = ['Thomas', 'Lucas', 'Adrien', 'Nicolas', 'Antoine', 'Karim', 'Omar', 'Youssef', 'Hugo', 'Louis', 'Ali', 'Rami', 'Marc', 'Élie', 'Julien', 'Samir', 'Hadi', 'Paul', 'Tarek', 'Fadi'];
const LAST = ['Martin', 'Bernard', 'Dubois', 'Petit', 'Moreau', 'Lefèvre', 'Rousseau', 'Morel', 'Durand', 'Haddad', 'Khoury', 'Nassar', 'Saleh', 'Mansour', 'Farah', 'Aoun', 'Girard', 'Fontaine', 'Chevalier', 'Hamdan', 'Karam', 'Rizk', 'Laurent', 'Gauthier'];

const COUNTRY_WEIGHTS: [string, number][] = [
  ['FR', 40], ['KW', 12], ['GB', 8], ['CA', 8], ['LB', 6], ['US', 5], ['CH', 4], ['BE', 4],
  ['AE', 4], ['ES', 2], ['JP', 1], ['EG', 2], ['MA', 2], ['BR', 1], ['AU', 1],
];

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

const FIELD_BY_SCHOOL: [RegExp, string][] = [
  [/polytechnique|insa|epfl|mohammed vi/i, 'ingenierie'],
  [/sciences po|sorbonne abu|nyu abu/i, 'sciencesPo'],
  [/essec|hec|business|ie university|economi/i, 'economie'],
  [/panth|droit|law|genève/i, 'droit'],
  [/king's|columbia|new york|boston|mcgill|montréal|sydney|waseda|university college/i, 'sciences'],
  [/beirut|saint-joseph|kuwait|gust|cité|aix|bruxelles|louvain|paulo|égypte/i, 'medecine'],
  [/sorbonne|lyon|bordeaux|toulouse|lille|strasbourg/i, 'lettres'],
  [/architect|beaux-arts|design|arts/i, 'arts'],
];
const fieldFor = (school: string) => FIELD_BY_SCHOOL.find(([re]) => re.test(school))?.[1] ?? 'autre';

export function createSeed(now = new Date()): Db {
  const r = rng(20261003);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const weighted = () => {
    const total = COUNTRY_WEIGHTS.reduce((a, [, w]) => a + w, 0);
    let x = r() * total;
    for (const [c, w] of COUNTRY_WEIGHTS) {
      if ((x -= w) < 0) return c;
    }
    return 'FR';
  };
  const birthdayIn = (days: number, year: number) => {
    const d = new Date(now.getTime() + days * DAY);
    return `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const ago = (days: number) => iso(new Date(now.getTime() - days * DAY));
  const at = (days: number, h: number, m = 0) => {
    const d = new Date(now.getTime() + days * DAY);
    d.setHours(h, m, 0, 0);
    return iso(d);
  };
  const privacy = { showEmail: true, showPhone: false, showBirthday: true };
  const users: User[] = [];
  let seq = 0;
  const add = (u: Partial<User> & Pick<User, 'firstName' | 'lastName' | 'gender' | 'role'>) => {
    const id = `u${++seq}`;
    const user: User = {
      id,
      email: `${slug(u.firstName)}.${slug(u.lastName)}@amicale-lfk.demo`,
      password: DEMO_PASSWORD,
      approved: true,
      createdAt: ago(Math.floor(r() * 700) + 5),
      lastActiveAt: ago(r() * 20),
      privacy,
      ...u,
    };
    users.push(user);
    return user;
  };

  // Named members used across the demo.
  const jad = add({
    firstName: 'Jad', lastName: 'El Chammas', gender: 'M', role: 'admin', fonction: 'Président', promo: 2020, school: 'INSA Lyon',
    city: 'Paris', country: 'FR', phone: '+33 612345678', birthDate: '2002-03-12', avatar: portrait('M', 32),
    email: DEMO_ACCOUNTS.admin, createdAt: ago(720), lastActiveAt: ago(0),
    bio: "Ingénieur en informatique, j'anime la plateforme de l'Amicale.",
  });
  const sarah = add({ firstName: 'Sarah', lastName: 'Martin', gender: 'F', role: 'alumni', promo: 2020, school: 'Sciences Po', city: 'Paris', country: 'FR', birthDate: birthdayIn(2, 2002), avatar: portrait('F', 44), email: DEMO_ACCOUNTS.member, lastActiveAt: ago(0.1) });
  const thomas = add({ firstName: 'Thomas', lastName: 'Petit', gender: 'M', role: 'alumni', promo: 2020, school: 'HEC Montréal', city: 'Montréal', country: 'CA', birthDate: birthdayIn(5, 2002), avatar: portrait('M', 45), lastActiveAt: ago(0.3) });
  const lea = add({ firstName: 'Léa', lastName: 'Durand', gender: 'F', role: 'alumni', promo: 2021, school: 'INSA Lyon', city: 'Lyon', country: 'FR', birthDate: birthdayIn(8, 2003), avatar: portrait('F', 65) });
  const antoine = add({ firstName: 'Antoine', lastName: 'Bernard', gender: 'M', role: 'alumni', promo: 2019, school: 'ESSEC Business School', city: 'Paris', country: 'FR', birthDate: birthdayIn(12, 2001), avatar: portrait('M', 22) });
  const camille = add({ firstName: 'Camille', lastName: 'Rousseau', gender: 'F', role: 'alumni', promo: 2019, school: "King's College London", city: 'Londres', country: 'GB', birthDate: '2001-06-02', avatar: portrait('F', 68) });
  const adrien = add({ firstName: 'Adrien', lastName: 'Lefèvre', gender: 'M', role: 'alumni', promo: 2019, school: 'École polytechnique', city: 'Paris', country: 'FR', birthDate: '2001-01-20', avatar: portrait('M', 52) });
  const nicolas = add({ firstName: 'Nicolas', lastName: 'Morel', gender: 'M', role: 'alumni', promo: 2019, school: 'Columbia University', city: 'New York', country: 'US', birthDate: '2001-11-30', avatar: portrait('M', 11) });
  add({ firstName: 'Emma', lastName: 'Moreau', gender: 'F', role: 'alumni', promo: 2020, school: 'INSA Lyon', city: 'Lyon', country: 'FR', birthDate: birthdayIn(19, 2002), avatar: portrait('F', 17) });
  add({ firstName: 'Lucas', lastName: 'Bernard', gender: 'M', role: 'alumni', promo: 2020, school: 'ESSEC Business School', city: 'Paris', country: 'FR', birthDate: '2002-07-14', avatar: portrait('M', 75) });
  add({ firstName: 'Chloé', lastName: 'Dubois', gender: 'F', role: 'alumni', promo: 2020, school: 'École polytechnique', city: 'Paris', country: 'FR', birthDate: '2002-05-09', avatar: portrait('F', 26) });
  add({ firstName: 'Julie', lastName: 'Martin', gender: 'F', role: 'alumni', promo: 2019, school: 'Sciences Po', city: 'Paris', country: 'FR', birthDate: '2001-09-01', avatar: portrait('F', 50) });
  const nour = add({ firstName: 'Nour', lastName: 'Haddad', gender: 'F', role: 'eleve', promo: 2027, school: 'Lycée Français du Koweït', city: 'Koweït City', country: 'KW', birthDate: birthdayIn(24, 2009), avatar: portrait('F', 90), email: DEMO_ACCOUNTS.eleve });
  const karim = add({ firstName: 'Karim', lastName: 'Nassar', gender: 'M', role: 'admin', promo: 2016, school: 'American University of Beirut', city: 'Koweït City', country: 'KW', birthDate: '1998-04-18', avatar: portrait('M', 8) });
  // School leadership — honorary members (see data/permissions.ts).
  const proviseur = add({
    firstName: 'Philippe', lastName: 'Garnier', gender: 'M', role: 'honneur', fonction: 'Proviseur', school: 'Lycée Français du Koweït',
    city: 'Koweït City', country: 'KW', birthDate: '1968-02-11', avatar: portrait('M', 67), email: DEMO_ACCOUNTS.direction,
    bio: "Proviseur du Lycée Français du Koweït. Heureux de suivre le parcours de nos anciens élèves à travers le monde.",
  });
  add({ firstName: 'Samira', lastName: 'Aoun', gender: 'F', role: 'honneur', fonction: 'Assistante de direction', school: 'Lycée Français du Koweït', city: 'Koweït City', country: 'KW', birthDate: '1976-08-03', avatar: portrait('F', 58) });

  // Generated alumni and students.
  for (let i = 0; i < 78; i++) {
    const gender: Gender = r() > 0.5 ? 'F' : 'M';
    const first = gender === 'F' ? pick(F_NAMES) : pick(M_NAMES);
    const last = pick(LAST);
    const isEleve = i % 7 === 0;
    const promo = isEleve ? 2027 + Math.floor(r() * 3) : 2012 + Math.floor(r() * 15);
    const country = isEleve ? 'KW' : weighted();
    const role: Role = isEleve ? 'eleve' : 'alumni';
    const by = (isEleve ? promo - 18 : promo - 18) + (r() > 0.5 ? 1 : 0);
    const birth = new Date(by, Math.floor(r() * 12), 1 + Math.floor(r() * 27));
    add({
      firstName: first,
      lastName: last,
      email: `${slug(first)}.${slug(last)}${i}@amicale-lfk.demo`,
      gender,
      role,
      promo,
      school: isEleve ? 'Lycée Français du Koweït' : pick(UNIVERSITIES[country]),
      city: pick(CITY_BY_COUNTRY[country]),
      country,
      birthDate: ymd(birth),
      avatar: portrait(gender, 1 + Math.floor(r() * 95)),
      createdAt: ago(Math.floor(r() * 720) + 3),
    });
  }

  // Pending sign-ups for the approval queue.
  const pendingPeople: [string, string, Gender, number, string, string][] = [
    ['Rami', 'Khoury', 'M', 2024, 'Université Saint-Joseph', 'LB'],
    ['Inès', 'Fontaine', 'F', 2025, 'Sorbonne Université', 'FR'],
    ['Omar', 'Saleh', 'M', 2023, 'McGill University', 'CA'],
  ];
  for (const [fn, ln, g, promo, school, country] of pendingPeople) {
    add({ firstName: fn, lastName: ln, gender: g, role: 'alumni', promo, school, country, city: CITY_BY_COUNTRY[country][0], approved: false, createdAt: ago(r() * 4), avatar: portrait(g, 30 + promo % 20) });
  }
  add({ firstName: 'Maya', lastName: 'Farah', gender: 'F', role: 'alumni', promo: 2022, school: 'EPFL', country: 'CH', city: 'Lausanne', approved: false, email: DEMO_ACCOUNTS.pending, createdAt: ago(1) });

  // Membership rules (data/members.ts): every member has a phone and a birth date (honorary members may
  // omit them), alumni and admins get an Alumni number in sign-up order, admins a Bureau code.
  const dialFor = (country?: string) => DIAL_CODES.find((c) => c.code === country)?.dial ?? '+965';
  let nextNumber = FIRST_ALUMNI_NUMBER;
  const bureauCodes = ['1001', '1002', '1003'];
  [...users]
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .forEach((u) => {
      if (!u.phone && u.role !== 'honneur') u.phone = `${dialFor(u.country)} ${String(50000000 + Math.floor(r() * 49999999))}`;
      if (!u.birthDate && u.role !== 'honneur') u.birthDate = ymd(new Date((u.promo ?? 2010) - 18, Math.floor(r() * 12), 1 + Math.floor(r() * 27)));
      if (u.role === 'eleve') u.school = LFK_SCHOOL;
      if (hasAlumniNumber(u.role)) u.alumniNumber = String(nextNumber++);
      if (u.role === 'admin') u.bureauCode = bureauCodes.shift();
      if ((u.role === 'alumni' || u.role === 'admin') && u.school) {
        u.fieldOfStudy = fieldFor(u.school);
        u.mentor = r() > 0.25;
      }
      // Pending sign-ups carry their proof of schooling (except the "En attente" demo account).
      if (!u.approved && u.email !== DEMO_ACCOUNTS.pending) {
        u.proof = { path: IMAGES.lecture, name: 'certificat-de-scolarite.jpg', mimeType: 'image/jpeg', uploadedAt: u.createdAt };
      }
    });

  const promos = Array.from({ length: 18 }, (_, i) => 2012 + i).map((year) => ({
    year,
    whatsapp: [2016, 2018, 2019, 2020, 2021, 2027].includes(year) ? `https://chat.whatsapp.com/lfk-promo-${year}` : undefined,
    groupPhoto: year === 2020 ? IMAGES.graduation : year === 2019 ? IMAGES.group : year === 2016 ? IMAGES.friends : undefined,
  }));

  const events: Db['events'] = [
    { id: 'e1', title: 'Soirée de rentrée', date: at(3, 19), location: 'LFK · Paris', category: 'soiree', cover: IMAGES.party, createdBy: jad.id, description: "La traditionnelle soirée de rentrée de l'Amicale du LFK ! L'occasion de se retrouver, de faire de nouvelles rencontres et de lancer cette nouvelle année ensemble. DJ, buffet et surprises au programme." },
    { id: 'e2', title: 'Tournoi sportif inter-promos', date: at(8, 16), location: 'LFK · Koweït', category: 'sport', cover: IMAGES.sport, createdBy: karim.id, description: 'Football, basket et volley : chaque promo monte son équipe. Venez défendre les couleurs de votre année au gymnase du lycée.' },
    { id: 'e3', title: 'Halloween Party', date: at(31, 20), location: 'Salmiya · Koweït', category: 'soiree', cover: IMAGES.halloween, createdBy: karim.id, description: 'Costumes obligatoires, prix pour le plus beau déguisement.' },
    { id: 'e4', title: 'Afterwork LFK Business Club', date: at(45, 18, 30), location: 'Paris 8e', category: 'networking', cover: IMAGES.meeting, createdBy: jad.id, description: 'Premier afterwork du LFK Business Club : rencontres entre alumni entrepreneurs, consultants et ingénieurs.' },
    { id: 'e9', title: "Forum d'orientation", date: at(20, 9), location: 'LFK · Koweït', category: 'culture', cover: IMAGES.lecture, createdBy: proviseur.id, description: "Les anciens élèves présentent leurs universités et leurs parcours aux élèves de Première et de Terminale. Alumni, inscrivez-vous auprès de la direction pour tenir un stand !" },
    { id: 'e5', title: 'Dîner de gala', date: at(73, 20), location: 'Koweït City', category: 'culture', cover: IMAGES.gala, createdBy: karim.id, description: "Le grand dîner annuel de l'Amicale, en présence de la direction du lycée et des membres d'honneur." },
    { id: 'e6', title: "Retrouvailles d'été", date: at(-72, 19), location: 'Paris 11e', category: 'soiree', cover: IMAGES.cheers, createdBy: jad.id, description: "Les alumni de passage à Paris se sont retrouvés pour une soirée d'été sur les quais." },
    { id: 'e7', title: 'Remise des diplômes 2026', date: at(-97, 18), location: 'LFK · Koweït', category: 'culture', cover: IMAGES.graduation, createdBy: karim.id, description: 'Bienvenue dans le réseau à la promo 2026 !' },
    { id: 'e8', title: 'Voyage au Japon', date: at(-160, 9), location: 'Tokyo · Kyoto', category: 'culture', cover: IMAGES.japan, createdBy: jad.id, description: 'Dix jours entre Tokyo et Kyoto avec 24 membres de l’Amicale.' },
  ];

  const galleryPool = [IMAGES.party2, IMAGES.dj, IMAGES.lights, IMAGES.concert, IMAGES.concert2, IMAGES.cheers, IMAGES.friends, IMAGES.crowd, IMAGES.night, IMAGES.stage, IMAGES.festival, IMAGES.group, IMAGES.sunset, IMAGES.dinner];
  const photos: EventPhoto[] = [];
  const uploaders = users.filter((u) => u.approved).map((u) => u.id);
  const addGallery = (eventId: string, count: number, offset: number, extra: string[] = []) => {
    const pool = [...extra, ...galleryPool];
    for (let i = 0; i < count; i++) {
      photos.push({ id: `p${photos.length + 1}`, eventId, uri: pool[(i + offset) % pool.length], uploadedBy: uploaders[(i * 7 + offset) % uploaders.length], createdAt: ago(60 - i) });
    }
  };
  addGallery('e6', 14, 0);
  addGallery('e7', 6, 3, [IMAGES.graduation, IMAGES.campus, IMAGES.lecture]);
  addGallery('e8', 7, 1, [IMAGES.japan, IMAGES.sunset]);
  addGallery('e1', 5, 4); // last year's edition photos already shared

  const publications: Db['publications'] = [
    { id: 'pub7', status: 'published', title: "Forum d'orientation : les anciens au rendez-vous", category: 'annonce', date: ago(1), cover: IMAGES.lecture, authorId: proviseur.id, excerpt: 'La direction du lycée invite les alumni à partager leur parcours avec nos élèves.', body: "Chers anciens élèves,\n\nLe forum d'orientation du lycée aura lieu dans quelques semaines. Vos témoignages sont précieux pour nos élèves de Première et de Terminale qui préparent leurs choix d'études.\n\nSi vous souhaitez présenter votre université ou votre métier, contactez-nous via la messagerie de la plateforme.\n\nMerci pour votre fidélité au lycée." },
    { id: 'pub1', status: 'published', title: 'Rentrée 2026 : le mot du président', category: 'actualite', date: ago(2), cover: IMAGES.campus, authorId: jad.id, excerpt: "Une nouvelle année commence pour l'Amicale : nouveaux projets, nouvelle plateforme et beaucoup d'événements.", body: "Chères et chers membres,\n\nCette rentrée marque une étape importante pour l'Amicale du LFK : notre nouvelle plateforme réunit enfin toute la communauté au même endroit, sur téléphone comme sur ordinateur.\n\nCette année, nous voulons renforcer les liens entre les promos, accompagner les élèves dans leurs choix d'orientation grâce à Repère, et multiplier les rencontres, à Koweït comme à l'étranger.\n\nMerci à toutes celles et ceux qui font vivre ce réseau. À très vite lors de la soirée de rentrée !" },
    { id: 'pub2', status: 'published', title: 'Retour sur le voyage au Japon', category: 'article', date: ago(10), cover: IMAGES.japan, authorId: karim.id, excerpt: "24 membres, 10 jours, deux villes : récit d'un voyage qui a marqué l'année.", body: "De Shibuya aux temples de Kyoto, le voyage organisé par l'Amicale a réuni des membres de sept promos différentes.\n\nAu programme : visites, rencontres avec des alumni installés à Tokyo, et beaucoup de souvenirs à retrouver dans la galerie de l'événement." },
    { id: 'pub3', status: 'published', title: 'Nouvelle association : LFK Business Club', category: 'annonce', date: ago(15), cover: IMAGES.work, authorId: jad.id, excerpt: 'Un club pour connecter les alumni entrepreneurs, dirigeants et jeunes diplômés.', body: "Le LFK Business Club réunira chaque trimestre les alumni autour de conférences, d'afterworks et de mentorat.\n\nPremier rendez-vous : l'afterwork parisien, à retrouver dans les événements." },
    { id: 'pub4', status: 'published', title: 'Les 10 ans de la promo 2016', category: 'article', date: ago(20), cover: IMAGES.friends, authorId: karim.id, excerpt: 'Dix ans après le bac, la promo 2016 s’est retrouvée au complet.', body: 'Retrouvailles, souvenirs de classe et photos d’époque : la promo 2016 a fêté ses 10 ans en grand.' },
    { id: 'pub5', status: 'published', title: "Appel à candidatures — Conseil d'administration", category: 'annonce', date: ago(25), cover: IMAGES.lecture, authorId: jad.id, excerpt: "Vous souhaitez vous investir dans l'Amicale ? Les candidatures sont ouvertes.", body: "Le conseil d'administration de l'Amicale renouvelle trois postes cette année. Envoyez votre candidature via la page contact avant la fin du mois." },
    { id: 'pub6', status: 'published', title: 'Bourses d’études 2027', category: 'annonce', date: ago(34), cover: IMAGES.students, authorId: karim.id, excerpt: 'L’Amicale soutient les élèves de Terminale dans leurs projets d’études supérieures.', body: 'Trois bourses seront attribuées aux élèves de Terminale. Dossier à déposer auprès du bureau de l’Amicale.' },
  ];

  // A member's announcement waiting for an admin (publications are moderated).
  publications.push({
    id: 'pub8', status: 'pending', title: 'Colocation à Paris pour la rentrée', category: 'annonce', date: ago(0.3), cover: IMAGES.paris, authorId: sarah.id,
    excerpt: 'Je cherche un ou une colocataire parmi les alumni pour un appartement dans le 11e.',
    body: 'Bonjour à tous,\n\nJe cherche un ou une colocataire pour un deux-pièces dans le 11e arrondissement, à partir de novembre.\n\nÉcrivez-moi via la messagerie de la plateforme !',
  });

  const conversations: Db['conversations'] = [];
  const messages: Message[] = [];
  const convo = (a: string, b: string, lines: [string, string, number][], readByA = true) => {
    const id = `c${conversations.length + 1}`;
    const lastAt = lines.length ? ago(lines[lines.length - 1][2]) : ago(1);
    conversations.push({ id, members: [a, b], lastRead: { [b]: lastAt, [a]: readByA ? lastAt : ago(30) } });
    lines.forEach(([from, text, daysAgo], i) => messages.push({ id: `${id}m${i}`, conversationId: id, senderId: from, text, createdAt: ago(daysAgo) }));
    return id;
  };
  convo(jad.id, sarah.id, [
    [sarah.id, 'Salut Jad ! Comment ça va ?', 0.08],
    [jad.id, 'Ça va bien et toi ? 😊', 0.07],
    [sarah.id, 'Super ! Tu viens à l’événement samedi ?', 0.05],
    [sarah.id, 'On pourrait y aller ensemble avec la promo 2020 🎉', 0.02],
  ], false);
  convo(jad.id, thomas.id, [
    [jad.id, 'Tu es toujours à Montréal ?', 1.2],
    [thomas.id, 'Oui ! On se voit quand tu passes ?', 1.1],
  ], false);
  convo(jad.id, camille.id, [
    [camille.id, 'Merci pour l’invitation au Business Club !', 3],
    [jad.id, 'Avec plaisir, ta présentation va être top.', 2.9],
    [camille.id, 'Super !', 2.8],
  ]);
  convo(jad.id, adrien.id, [[adrien.id, 'Merci pour la photo !', 5]]);
  convo(jad.id, lea.id, [[jad.id, 'Bon anniversaire en avance 🎂', 6], [lea.id, 'À bientôt !', 6]]);
  convo(jad.id, nicolas.id, [[nicolas.id, 'Oui, pas de souci !', 8]]);
  convo(sarah.id, nour.id, [[nour.id, 'Bonjour ! Je voulais vous demander des conseils pour Sciences Po 🙏', 2], [sarah.id, 'Avec plaisir, on s’appelle cette semaine ?', 1.8]]);
  const reported = convo(antoine.id, adrien.id, [
    [antoine.id, 'Tu as vu le message sur le groupe ?', 4],
    [adrien.id, 'Arrête de m’envoyer ces liens publicitaires stp.', 3.9],
    [antoine.id, 'Promo -50% sur ma formation crypto, dernier jour !!!', 3.8],
  ]);
  conversations.find((c) => c.id === reported)!.report = { by: adrien.id, reason: 'Messages publicitaires répétés', at: ago(3.7) };

  const contacts: Db['contacts'] = [
    { id: 'ct1', name: 'Marie Lambert', email: 'marie.lambert@example.com', subject: 'Adhésion d’un ancien parent', message: 'Bonjour, mon fils a quitté le LFK en 2014 avant le bac. Peut-il rejoindre l’Amicale ?', createdAt: ago(0.4), read: false },
    { id: 'ct2', name: 'Institut français du Koweït', email: 'contact@example.org', subject: 'Partenariat culturel', message: 'Nous souhaiterions organiser une soirée cinéma avec votre association.', createdAt: ago(1.5), read: false },
    { id: 'ct3', name: 'Paul Girard', email: 'paul.girard@example.com', subject: 'Mot de passe', message: 'Je n’ai plus accès à mon adresse e-mail, pouvez-vous m’aider ?', createdAt: ago(6), read: true },
  ];

  const logs: Db['logs'] = [
    { id: 'l1', actorId: karim.id, action: 'approve', target: 'Emma Moreau', createdAt: ago(3) },
    { id: 'l2', actorId: jad.id, action: 'create_event', target: 'Soirée de rentrée', createdAt: ago(9) },
    { id: 'l3', actorId: jad.id, action: 'reset_password', target: 'Paul Girard', createdAt: ago(5.8) },
    { id: 'l4', actorId: karim.id, action: 'change_role', target: 'Samira Aoun', meta: { role: 'honneur' }, createdAt: ago(12) },
    { id: 'l5', actorId: jad.id, action: 'create_publication', target: 'Rentrée 2026 : le mot du président', createdAt: ago(2) },
  ];

  const notifications: Db['notifications'] = [
    { id: 'n1', userId: jad.id, kind: 'message', template: 'message', params: { name: 'Sarah Martin' }, href: '/messages', createdAt: ago(0.02), read: false },
    { id: 'n2', userId: jad.id, kind: 'approval', template: 'pendingMany', params: { n: 4 }, href: '/admin/approbations', createdAt: ago(0.5), read: false },
    { id: 'n3', userId: jad.id, kind: 'birthday', template: 'birthday', params: { name: 'Sarah Martin', n: 2 }, href: `/membre/${sarah.id}`, createdAt: ago(1), read: false },
    { id: 'n4', userId: jad.id, kind: 'photo', template: 'photos', params: { n: 3, title: 'Retrouvailles d’été' }, href: '/evenements/e6', createdAt: ago(3), read: true },
    { id: 'n5', userId: jad.id, kind: 'publication', template: 'publication', params: { title: 'Retour sur le voyage au Japon' }, href: '/publications/pub2', createdAt: ago(10), read: true },
  ];

  // Honorary institutions. The SCAC (French Embassy) is added by an admin once it has agreed.
  const institutions: Db['institutions'] = [
    { id: 'inst-lfk', order: 1, name: 'Lycée Français du Koweït', logo: 'lfk', website: 'https://www.lfkoweit.edu.kw',
      description: "L'établissement où tout a commencé : l'Amicale réunit ses anciens élèves et reste liée à sa direction, à ses équipes et à ses élèves." },
  ];

  // Key dates shown in the calendar every year (AEFE and LFK dates are added by admins).
  const keyDates: Db['keyDates'] = [
    { id: 'kd1', title: 'Fête nationale du Koweït', month: 2, day: 25, category: 'koweit' },
    { id: 'kd2', title: 'Jour de la Libération du Koweït', month: 2, day: 26, category: 'koweit' },
    { id: 'kd3', title: 'Journée internationale de la Francophonie', month: 3, day: 20, category: 'francophonie' },
    { id: 'kd4', title: 'Victoire du 8 mai 1945', month: 5, day: 8, category: 'france' },
    { id: 'kd5', title: 'Fête nationale française', month: 7, day: 14, category: 'france' },
    { id: 'kd6', title: 'Armistice du 11 novembre 1918', month: 11, day: 11, category: 'france' },
  ];

  return {
    nextAlumniNumber: nextNumber, users, promos, events, photos, publications, conversations, messages, contacts, logs, notifications,
    institutions, keyDates, settings: { whatsappCommunity: 'https://chat.whatsapp.com/lfk-communaute' },
  };
}
