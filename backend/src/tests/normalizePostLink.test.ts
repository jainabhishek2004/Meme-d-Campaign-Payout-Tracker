import { normalizePostLink } from '../utils/normalizePostLink';

describe('normalizePostLink', () => {
  it('removes Instagram host aliases, trailing slashes, fragments, and tracking params', () => {
    expect(normalizePostLink('https://www.instagram.com/reel/AbC123/?igsh=share#top'))
      .toBe('https://instagram.com/reel/AbC123');
    expect(normalizePostLink('http://instagram.com/reel/AbC123'))
      .toBe('https://instagram.com/reel/AbC123');
  });

  it('maps YouTube short links and Shorts URLs to the same video identity', () => {
    expect(normalizePostLink('https://youtu.be/video_123?si=tracking'))
      .toBe('https://youtube.com/watch?v=video_123');
    expect(normalizePostLink('https://www.youtube.com/shorts/video_123?feature=share'))
      .toBe('https://youtube.com/watch?v=video_123');
  });

  it('removes common tracking params while preserving functional params elsewhere', () => {
    expect(normalizePostLink('https://example.com/post?utm_source=share&id=42&fbclid=abc'))
      .toBe('https://example.com/post?id=42');
  });

  it('rejects invalid URLs and non-HTTP protocols', () => {
    expect(() => normalizePostLink('not a URL')).toThrow();
    expect(() => normalizePostLink('javascript:alert(1)')).toThrow();
  });
});
