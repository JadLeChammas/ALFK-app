import { findUniLogo } from '../src/data/uniLogoLookup';

/**
 * GET /api/uni-logo?name=Sciences%20Po → { url: string | null }
 * The answer is cached by Vercel's CDN for 30 days (and kept 7 more while it refreshes), so the
 * open-data lookup runs about once per university per month for all visitors together; browsers
 * keep it for a day on top of their own 30-day copy (src/data/uniLogos.ts).
 */
export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get('name')?.trim().slice(0, 200);
  if (!name) return Response.json({ error: 'missing_name' }, { status: 400 });
  try {
    const url = await findUniLogo(name);
    return Response.json(
      { url },
      { headers: { 'Cache-Control': 'public, max-age=86400', 'CDN-Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=604800' } }
    );
  } catch {
    // OpenAlex unreachable or rate-limited: say so briefly, never cache it for long.
    return Response.json({ url: null, retry: true }, { status: 503, headers: { 'Cache-Control': 'public, max-age=60' } });
  }
}
