export type Role = 'alumni' | 'eleve' | 'honneur' | 'admin';
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
  school?: string;
  /** Position shown for school leadership, e.g. « Proviseur ». Set by an admin. */
  fonction?: string;
  /** 5 digits, 11111 onwards, assigned once to alumni and admins, never reused (see data/members.ts). */
  alumniNumber?: string;
  /** 4 digits, Bureau members (admins) only, typed by an admin, unique. */
  bureauCode?: string;
  city?: string;
  country?: string; // ISO code, see countries.ts
  phone?: string; // "+965 12345678" — required except for honorary members
  birthDate?: string; // YYYY-MM-DD — required except for honorary members
  avatar?: string;
  bio?: string;
  createdAt: string;
  lastActiveAt: string;
  privacy: Privacy;
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
};

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
  | 'resolve_report';

export type AdminLog = { id: string; actorId: string; action: AdminLogAction; target: string; meta?: { role?: Role }; createdAt: string };

export type NotificationTemplate = 'message' | 'pendingOne' | 'pendingMany' | 'approved' | 'birthday' | 'photos' | 'publication';

export type AppNotification = {
  id: string;
  userId: string;
  kind: 'message' | 'event' | 'publication' | 'birthday' | 'approval' | 'photo';
  /** Rendered in the viewer's language — see `notifications.t` in the i18n dictionaries. */
  template: NotificationTemplate;
  params?: Record<string, string | number>;
  href?: string;
  createdAt: string;
  read: boolean;
};

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
};

export type Session = { userId: string; recovery?: boolean } | null;
