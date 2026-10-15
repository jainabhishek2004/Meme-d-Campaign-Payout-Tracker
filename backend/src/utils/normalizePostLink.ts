/**
 * Produces a stable identity for common Instagram and YouTube post URLs.
 * Common tracking parameters and fragments are discarded so they cannot
 * create a second submission for the same post.
 */
export function normalizePostLink(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error('postLink must be a valid HTTP or HTTPS URL');
  }

  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    throw new Error('postLink must be a valid HTTP or HTTPS URL');
  }

  const hostname = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (hostname === 'instagram.com') {
    // Instagram post identity is in the path; query parameters are tracking data.
    return `https://instagram.com${path}`;
  }

  if (hostname === 'youtu.be') {
    const videoId = path.split('/').filter(Boolean)[0];
    if (videoId) return `https://youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  }

  if (hostname === 'youtube.com') {
    const videoId = url.searchParams.get('v') ||
      path.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1];
    if (videoId) return `https://youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  }

  // Retain functional query parameters for other URL formats, but drop common
  // analytics/tracking fields and sort the remainder for stable comparison.
  const params = [...url.searchParams.entries()]
    .filter(([key]) => !/^utm_/i.test(key) && !['fbclid', 'gclid', 'igshid', 'si', 'feature'].includes(key.toLowerCase()))
    .sort(([keyA, valueA], [keyB, valueB]) => keyA.localeCompare(keyB) || valueA.localeCompare(valueB));
  const query = new URLSearchParams(params).toString();
  const port = url.port ? `:${url.port}` : '';

  return `https://${hostname}${port}${path}${query ? `?${query}` : ''}`;
}
