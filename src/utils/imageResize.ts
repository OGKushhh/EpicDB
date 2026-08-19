/**
 * Ported from ScreamDB — appends Epic's image-resize query params so the
 * CDN returns a smaller, lower-quality copy.  This dramatically reduces
 * bandwidth on the Browse and Game Offers pages.
 *
 * Epic's CDN supports: resize=1, w, h, quality=low|medium|high
 */

interface ResizeArgs {
  url: string;
  w?: number;
  h?: number;
  q?: 'low' | 'medium' | 'high';
}

export function getResizedImageUrl({ url, w, h, q }: ResizeArgs): string | null {
  try {
    const u = new URL(url);
    u.searchParams.set('resize', '1');
    if (w) u.searchParams.set('w', String(w));
    if (h) u.searchParams.set('h', String(h));
    if (q) u.searchParams.set('quality', q);
    return u.toString();
  } catch {
    console.error('Failed to resize image URL:', url);
    return null;
  }
}
