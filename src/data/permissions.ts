import type { Role, User } from './types';

/**
 * What each role may do beyond reading member content.
 *
 * - admin: runs the Amicale (approvals, accounts, moderation, contact inbox, audit log).
 * - honneur: the school's leadership (proviseur, assistant·e de direction) — publishes and creates
 *   events, sees read-only network statistics, but never manages accounts or moderation.
 */
export type Permission = 'viewEvents' | 'publish' | 'createEvent' | 'viewStats' | 'manage';

const GRANTS: Record<Role, Permission[]> = {
  admin: ['viewEvents', 'publish', 'createEvent', 'viewStats', 'manage'],
  honneur: ['viewEvents', 'publish', 'createEvent', 'viewStats'],
  alumni: ['viewEvents'],
  // Current students: alumni events and their galleries are not open to them.
  eleve: [],
};

/** Anonymous questions: current students ask, alumni answer (admins do both, to test and moderate). */
export const canAsk = (user: Pick<User, 'role'> | null | undefined) => !!user && (user.role === 'eleve' || user.role === 'admin');
export const canAnswer = (user: Pick<User, 'role'> | null | undefined) => !!user && (user.role === 'alumni' || user.role === 'admin');

export const can = (user: Pick<User, 'role'> | null | undefined, perm: Permission) => !!user && GRANTS[user.role].includes(perm);

/**
 * Private messaging is disabled between school leadership and current students (minors),
 * in both directions.
 */
export const canMessage = (a: Pick<User, 'role'> | null | undefined, b: Pick<User, 'role'> | null | undefined) => {
  if (!a || !b) return false;
  const pair = new Set([a.role, b.role]);
  return !(pair.has('honneur') && pair.has('eleve'));
};

/** Roles a visitor can pick when signing up; honorary members' accounts are created by an admin. */
export const SELF_SIGNUP_ROLES: Role[] = ['alumni', 'eleve'];

/** The honorary members' circle (their page and group discussion): honorary members and admins. */
/** Clubs (page « Clubs »): alumni and admins for now — students and honorary members later, if wanted. */
export const canSeeClubs = (user: Pick<User, 'role' | 'approved'> | null | undefined) => !!user && user.approved && (user.role === 'alumni' || user.role === 'admin');

export const inCircle = (user: Pick<User, 'role'> | null | undefined) => !!user && (user.role === 'honneur' || user.role === 'admin');
