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

/** Roles a visitor can pick when signing up; honorary membership is granted by an admin only. */
export const SELF_SIGNUP_ROLES: Role[] = ['alumni', 'eleve'];
