import { useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { fullName, useStore } from './store';
import type { PublicationCategory } from './types';

/**
 * The publications marked « Public » (migration 045): shown to everyone on alfk.org (/actualites),
 * signed-in or not. With Supabase they come from public_publications(), which visitors may call; in the
 * demo they are read from the local data. The « Membres » ones never leave the member space.
 */
export type PublicPublication = {
  id: string;
  title: string;
  category: PublicationCategory;
  date: string;
  cover: string;
  excerpt: string;
  body: string;
  authorName?: string;
  authorFonction?: string;
  authorAvatar?: string;
};

type Row = {
  id: string; title: string; category: PublicationCategory; date: string; cover: string; excerpt: string; body: string;
  author_name: string | null; author_fonction: string | null; author_avatar: string | null;
};

export function usePublicPublications(): { list: PublicPublication[]; loading: boolean } {
  const { db } = useStore();
  const [remote, setRemote] = useState<PublicPublication[] | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    void Promise.resolve(supabase.rpc('public_publications')).then(({ data, error }) => {
      if (!alive) return;
      // Before migration 045 the function does not exist: nothing public yet.
      setRemote(
        error
          ? []
          : ((data ?? []) as Row[]).map((r) => ({
              id: r.id, title: r.title, category: r.category, date: r.date, cover: r.cover, excerpt: r.excerpt, body: r.body,
              authorName: r.author_name ?? undefined, authorFonction: r.author_fonction ?? undefined, authorAvatar: r.author_avatar ?? undefined,
            }))
      );
    });
    return () => {
      alive = false;
    };
  }, []);

  const demo = useMemo(() => {
    if (supabase || !db) return [];
    const users = new Map(db.users.map((u) => [u.id, u]));
    return db.publications
      .filter((p) => p.status === 'published' && p.visibility === 'public')
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((p) => {
        const a = users.get(p.authorId);
        return { ...p, authorName: a ? fullName(a) : undefined, authorFonction: a?.fonction, authorAvatar: a?.avatar };
      });
  }, [db]);

  if (!supabase) return { list: demo, loading: false };
  return { list: remote ?? [], loading: remote === null };
}
