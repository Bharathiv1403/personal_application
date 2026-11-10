/**
 * Normalizes a user-entered URL by ensuring an http:// or https:// protocol prefix.
 * Rejects non-http schemes (e.g. javascript:, data:) and returns undefined for empty inputs.
 */
export function normalizeHttpUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return undefined;
  }

  const cleaned = trimmed.replace(/^\/+/, '');
  if (!cleaned) return undefined;

  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }

  return `https://${cleaned}`;
}

