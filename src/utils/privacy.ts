/**
 * Privacy utilities to protect user accounts and identities
 * Ensures private emails and personal account identifiers are never exposed publicly on the web.
 */

export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'Google Account (Protected)';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `*@${domain}`;
  }
  return `${local.slice(0, 2)}••••${local.slice(-1)}@${domain}`;
}

export function sanitizeDisplayName(name?: string | null, fallback = 'Verified Member'): string {
  if (!name || typeof name !== 'string') return fallback;
  const trimmed = name.trim();
  if (
    trimmed.toLowerCase().includes('p14659126') ||
    trimmed.includes('@') ||
    /^[a-z]\d{6,}$/i.test(trimmed)
  ) {
    return fallback;
  }
  return trimmed;
}
