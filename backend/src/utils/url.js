export function canonicalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('jobUrl is required');
  }

  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error(`Invalid job URL: ${rawUrl}`);
  }

  url.hash = '';
  const dropParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gh_src',
    'lever-source',
    'source',
    'ref',
  ];
  for (const key of [...url.searchParams.keys()]) {
    if (dropParams.includes(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }

  let path = url.pathname.replace(/\/+$/, '') || '/';
  url.pathname = path;
  url.hostname = url.hostname.toLowerCase();

  return url.toString();
}
