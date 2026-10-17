
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

  const params = [...url.searchParams.entries()]
    .filter(([key]) => !/^utm_/i.test(key) && !['fbclid', 'gclid', 'igshid', 'si', 'feature'].includes(key.toLowerCase()))
    .sort(([keyA, valueA], [keyB, valueB]) => keyA.localeCompare(keyB) || valueA.localeCompare(valueB));
  const query = new URLSearchParams(params).toString();
  const port = url.port ? `:${url.port}` : '';

  return `https://${hostname}${port}${path}${query ? `?${query}` : ''}`;
}
