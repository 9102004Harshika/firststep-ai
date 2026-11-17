export function notFoundHandler(_req, res) {
  res.status(404).json({ ok: false, error: 'Not found' });
}

function sanitizeErrorMessage(message = '') {
  return String(message)
    .replace(/mongodb(\+srv)?:\/\/[^\s'"]+/gi, 'mongodb://***')
    .replace(/(api[_-]?key|secret|password|token)[=:]\s*[^\s'"]+/gi, '$1=***');
}

export function errorHandler(err, _req, res, _next) {
  console.error('[api]', sanitizeErrorMessage(err?.message || String(err)));
  const status = err.status || err.statusCode || 500;
  const raw = err.message || 'Internal server error';
  res.status(status).json({
    ok: false,
    error: status >= 500 ? 'Internal server error' : sanitizeErrorMessage(raw),
  });
}
