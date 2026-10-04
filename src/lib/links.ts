import { Linking, Platform } from 'react-native';

/**
 * Links typed by members or admins (CV, partners, guides, WhatsApp groups, calendar…) are opened only
 * when they are real web, e-mail or phone links: a « javascript: », « data: » or « file: » address
 * would run code or open local content in the site's name. Returns the clean address, or null.
 * Without a scheme, « www.example.com » becomes « https://www.example.com ».
 */
export function safeUrl(raw: string | null | undefined): string | null {
  const s = (raw ?? '').trim();
  if (!s || /[\u0000-\u001F\u007F]/.test(s)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol === 'https:' || u.protocol === 'http:') return u.hostname.includes('.') ? u.href : null;
    if (u.protocol === 'mailto:' || u.protocol === 'tel:') return u.href;
    return null;
  } catch {
    return null;
  }
}

/** Opens an outside link safely (new tab on the web, without access back to the site). */
export function openExternal(raw: string | null | undefined) {
  const url = safeUrl(raw);
  if (!url) return;
  if (Platform.OS === 'web' && /^https?:/.test(url)) window.open(url, '_blank', 'noopener,noreferrer');
  else Linking.openURL(url).catch(() => {});
}
