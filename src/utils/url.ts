/**
 * URL utilities to guarantee safe, accurate external redirection
 * for affiliate and uploaded product links.
 */

export function normalizeProductLink(rawUrl: string): string {
  if (!rawUrl) return '#';
  const trimmed = rawUrl.trim();
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*?:/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function getDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(normalizeProductLink(url));
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'Seller Store';
  }
}

/**
 * Attaches a user's custom affiliate tag or campaign reference to the target URL
 */
export function attachAffiliateTag(rawUrl: string, tag?: string): string {
  const normalized = normalizeProductLink(rawUrl);
  if (!tag || !tag.trim()) return normalized;
  try {
    const url = new URL(normalized);
    const cleanTag = tag.trim();
    if (cleanTag.includes('=')) {
      const parts = cleanTag.split('=');
      if (parts[0] && parts[1]) {
        url.searchParams.set(parts[0], parts[1]);
      }
    } else {
      // Default common affiliate parameters
      url.searchParams.set('tag', cleanTag);
      url.searchParams.set('ref', cleanTag);
    }
    return url.toString();
  } catch {
    return normalized;
  }
}

/**
 * Triggers safe immediate redirection in a new tab.
 * Implements fallbacks to avoid browser popup blockers.
 */
export function openExternalLink(rawUrl: string): boolean {
  const targetUrl = normalizeProductLink(rawUrl);
  if (!targetUrl || targetUrl === '#') return false;

  try {
    // 1. Direct programmatic anchor click (strongest browser compatibility for new tab)
    const linkEl = document.createElement('a');
    linkEl.href = targetUrl;
    linkEl.target = '_blank';
    linkEl.rel = 'noopener noreferrer';
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);
    return true;
  } catch (e1) {
    try {
      // 2. Fallback to window.open
      const opened = window.open(targetUrl, '_blank', 'noopener,noreferrer');
      if (opened) return true;
    } catch (e2) {
      console.warn('Fallback redirect trigger:', e2);
    }
  }

  return false;
}
