export type Role = 'alumni' | 'eleve' | 'honneur' | 'admin';
export type Situation = 'student' | 'working';
export type Gender = 'F' | 'M';
export type ContinentKey = 'europe' | 'asia' | 'africa' | 'north_america' | 'south_america' | 'oceania';
export type EventCategory = 'soiree' | 'sport' | 'culture' | 'networking';
export type PublicationCategory = 'actualite' | 'article' | 'annonce';

export type Privacy = {
  showEmail: boolean;
  showPhone: boolean;
  showBirthday: boolean;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Demo only — the real backend (Supabase Auth) never exposes passwords. */
  password: string;
  gender: Gender;
  role: Role;
  approved: boolean;
  promo?: number;
  /** University: where a student studies now, or where someone working graduated (optional then). */
  school?: string;
  /** Alumni and admins: still studying, or already working. City and country are where they are now. */
  situation?: Situation;
  /** When working: company or organisation, and position. */
  employer?: string;
  jobTitle?: string;
  /** Position shown for school leadership, e.g. « Proviseur ». Set by an admin. */
  fonction?: string;
  /** 5 digits, 11111 onwards, assigned once to alumni and admins, never reused (see data/members.ts). */
  alumniNumber?: string;
  /** 4 digits, Bureau members (admins) only, typed by an admin, unique. */
  bureauCode?: string;
  /** Proof of schooling sent at sign-up (private: only admins can open it). Required before approval. */
  proof?: { path: string; name: string; mimeType?: string; uploadedAt: string };
  /** Accounts created by an admin need no proof. */
  createdByAdmin?: boolean;
  /** Field of study, for the Orientation space (see data/fields.ts). */
  fieldOfStudy?: string;
  /** Accepts being contacted by current students about their studies (Orientation). */
  mentor?: boolean;
  city?: string;
  country?: string; // ISO code, see countries.ts
  phone?: string; // "+965 12345678" — required except for honorary members
  birthDate?: string; // YYYY-MM-DD — required except for honorary members
  avatar?: string;
  bio?: string;
  createdAt: string;
  lastActiveAt: string;
  privacy: Privacy;
  /** Nationalities (ISO codes, several allowed — see data/nationalities.ts). */
  nationalities?: string[];
  /** LinkedIn-style CV, visible to members (see components/cv). */
  cv?: Cv;
};

export type Promo = { year: number; whatsapp?: string; groupPhoto?: string };

export type LfkEvent = {
  id: string;
  title: string;
  date: string; // ISO
  location: string;
  category: EventCategory;
  description: string;
  cover: string;
  createdBy: string;
};

export type EventPhoto = { id: string; eventId: string; uri: string; uploadedBy: string; createdAt: string };

export type Publication = {
  id: string;
  title: string;
  category: PublicationCategory;
  date: string;
  cover: string;
  excerpt: string;
  body: string;
  authorId: string;
  /** Members' submissions wait for an admin before being published. */
  status: PublicationStatus;
};

export type PublicationStatus = 'pending' | 'published' | 'rejected';

/** Honorary members that are institutions (LFK, SCAC…), shown on the Membres d'honneur page. */
export type Institution = { id: string; name: string; description: string; logo?: string; website?: string; order: number };

export type KeyDateCategory = 'francophonie' | 'aefe' | 'lfk' | 'france' | 'koweit' | 'amicale' | 'demarches';
/**
 * A yearly date (month/day) shown in the calendar; `year` set = a one-off date. With `endMonth`/`endDay`
 * it is a period (e.g. Parcoursup wishes); `url` points to the official page.
 */
export type KeyDate = { id: string; title: string; month: number; day: number; year?: number; category: KeyDateCategory; endMonth?: number; endDay?: number; url?: string };

/** `placeAliases`: admin merges of universities / companies, JSON { alias key: place key } (see data/places.ts). */
/** `guides`: the country guides edited by admins, JSON (see data/guide.ts); `guideFrance` is the older France-only one. */
/** `credits`: the end credits edited by admins, JSON (see data/credits.ts). */
export type AppSettings = { whatsappCommunity?: string; placeAliases?: string; guideFrance?: string; guides?: string; credits?: string; lfkStory?: string; showDemo?: string };

export type Conversation = {
  id: string;
  members: [string, string];
  lastRead: Record<string, string>;
  report?: { by: string; reason: string; at: string; resolved?: boolean };
};

export type Message = { id: string; conversationId: string; senderId: string; text: string; createdAt: string };

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type AdminLogAction =
  | 'approve'
  | 'refuse'
  | 'create_user'
  | 'change_role'
  | 'reset_password'
  | 'delete_user'
  | 'create_event'
  | 'delete_event'
  | 'delete_photo'
  | 'create_publication'
  | 'delete_publication'
  | 'open_reported_conversation'
  | 'resolve_report'
  | 'approve_publication'
  | 'reject_publication'
  | 'approve_question'
  | 'reject_question';

export type AdminLog = { id: string; actorId: string; action: AdminLogAction; target: string; meta?: { role?: Role }; createdAt: string };

export type NotificationTemplate = 'message' | 'pendingOne' | 'pendingMany' | 'approved' | 'birthday' | 'photos' | 'publication' | 'publicationApproved' | 'publicationRejected' | 'publicationToReview' | 'questionToReview' | 'questionPublished' | 'questionRejected' | 'questionNew' | 'questionAnswered';

export type AppNotification = {
  id: string;
  userId: string;
  kind: 'message' | 'event' | 'publication' | 'birthday' | 'approval' | 'photo' | 'question';
  /** Rendered in the viewer's language — see `notifications.t` in the i18n dictionaries. */
  template: NotificationTemplate;
  params?: Record<string, string | number>;
  href?: string;
  createdAt: string;
  read: boolean;
};

/** One line of a CV section. Dates are 'YYYY-MM'; no end = still going. */
export type CvEntry = { id: string; title: string; org?: string; place?: string; start?: string; end?: string; description?: string; url?: string };
/** 1 notions · 2 intermediate · 3 fluent · 4 bilingual · 5 native. */
export type CvLanguage = { name: string; level: 1 | 2 | 3 | 4 | 5 };
export type Cv = {
  headline?: string;
  education?: CvEntry[];
  experience?: CvEntry[];
  projects?: CvEntry[];
  associations?: CvEntry[];
  skills?: string[];
  languages?: CvLanguage[];
  interests?: string[];
  linkedin?: string;
  website?: string;
  /** A CV the member uploaded as a PDF (private bucket « cvs », members only). */
  file?: { path: string; name: string; uploadedAt: string };
};
export type CvSection = 'education' | 'experience' | 'projects' | 'associations';

export type QuestionTopic = 'etudes' | 'orientation' | 'pays' | 'metier' | 'vie' | 'autre';
export type QuestionStatus = 'pending' | 'published' | 'rejected';
/**
 * An anonymous question from a student. `authorId` is only known to admins and to the author
 * (separate table on Supabase): never show it to anyone else.
 */
export type Question = { id: string; text: string; topic: QuestionTopic; status: QuestionStatus; createdAt: string; publishedAt?: string; authorId?: string };
/** Answers are signed by the alumni who write them. */
export type Answer = { id: string; questionId: string; authorId?: string; text: string; createdAt: string };

export type Db = {
  /** Demo only: next Alumni number to hand out (numbers are never reused). */
  nextAlumniNumber?: number;
  users: User[];
  promos: Promo[];
  events: LfkEvent[];
  photos: EventPhoto[];
  publications: Publication[];
  conversations: Conversation[];
  messages: Message[];
  contacts: ContactMessage[];
  logs: AdminLog[];
  notifications: AppNotification[];
  institutions: Institution[];
  keyDates: KeyDate[];
  questions: Question[];
  answers: Answer[];
  settings: AppSettings;
};

export type Session = { userId: string; recovery?: boolean } | null;
