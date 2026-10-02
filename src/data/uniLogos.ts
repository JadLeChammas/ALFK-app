import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { placeKey, resolvePlace } from './placeKey';
import { findUniLogo } from './uniLogoLookup';

/**
 * University logos, found automatically so that a university typed by a new member gets its logo
 * without anyone adding it (lookup rules: data/uniLogoLookup.ts).
 * Caching, to keep the load off every server involved:
 *   1. memory, for the page;
 *   2. the browser (localStorage), 30 days, « no logo » included;
 *   3. on the site, /api/uni-logo, cached by Vercel's CDN for 30 days and shared by all visitors —
 *      OpenAlex is then asked about once per university per month.
 * Local development has no /api: it asks OpenAlex directly, at most 3 requests at a time.
 */

const CACHE_KEY = 'lfk.unilogo.v1';
const TTL = 30 * 24 * 3600 * 1000;
const API = Platform.OS === 'web' ? '' : (process.env.EXPO_PUBLIC_API_URL ?? 'https://www.alfk.org');
type Entry = { url: string | null; t: number };

const memory = new Map<string, Entry>();
const pending = new Map<string, Promise<string | null>>();
let loaded = false;

function readCache() {
  if (loaded || Platform.OS !== 'web') return;
  loaded = true;
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, Entry>;
    for (const [k, v] of Object.entries(raw)) if (Date.now() - v.t < TTL) memory.set(k, v);
  } catch {}
}
function writeCache() {
  if (Platform.OS !== 'web') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(memory)));
  } catch {}
}

// Small concurrency limiter for direct OpenAlex requests (development only).
let running = 0;
const queue: (() => void)[] = [];
async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (running >= 3) await new Promise<void>((r) => queue.push(r));
  running++;
  try {
    return await task();
  } finally {
    running--;
    queue.shift()?.();
  }
}

async function lookup(name: string): Promise<string | null> {
  const res = await fetch(`${API}/api/uni-logo?name=${encodeURIComponent(name)}`).catch(() => null);
  if (res && (res.headers.get('content-type') ?? '').includes('json')) {
    if (res.status === 503) throw new Error('retry later');
    if (res.ok) return ((await res.json()) as { url: string | null }).url;
  }
  // No API here (local development): ask OpenAlex directly.
  return limited(() => findUniLogo(name));
}

export function loadUniLogo(name: string): Promise<string | null> {
  readCache();
  const key = resolvePlace(name, {}) || placeKey(name);
  const hit = memory.get(key);
  if (hit) return Promise.resolve(hit.url);
  let p = pending.get(key);
  if (!p) {
    p = lookup(name)
      .then((u) => {
        memory.set(key, { url: u, t: Date.now() });
        writeCache();
        return u;
      })
      .catch(() => null) // offline or rate-limited: not cached, tried again on the next visit
      .finally(() => pending.delete(key));
    pending.set(key, p);
  }
  return p;
}

/** The logo URL of a university, or null while unknown / when none was found. */
export function useUniLogo(name?: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!name) return;
    let alive = true;
    loadUniLogo(name).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [name]);
  return url;
}
