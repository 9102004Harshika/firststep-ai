export function stripHtml(html = '') {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeWhitespace(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

export function normalizeCompany(name = '') {
  return normalizeWhitespace(name)
    .replace(/\b(inc|llc|ltd|limited|pvt|private|corp|corporation)\b\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTitle(title = '') {
  return normalizeWhitespace(title);
}

export function contentHash(parts = []) {
  const crypto = globalThis.crypto;
  const payload = parts.map((p) => normalizeWhitespace(String(p || '')).toLowerCase()).join('|');
  // Simple stable hash without requiring node crypto import in browsers/tests
  let hash = 0;
  for (let i = 0; i < payload.length; i += 1) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash)}:${payload.length}`;
}

export function fingerprintFrom({ company, title, locationRaw }) {
  const c = normalizeCompany(company).toLowerCase();
  const t = normalizeTitle(title).toLowerCase();
  const l = normalizeWhitespace(locationRaw).toLowerCase();
  return `${c}::${t}::${l}`;
}
