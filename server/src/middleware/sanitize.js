/** Strip keys starting with `$` or containing `.` to prevent NoSQL operator injection. */
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (
        k.startsWith('$') ||
        k.includes('.') ||
        k.includes('[') ||
        k.includes(']')
      ) {
        continue;
      }
      out[k] = clean(v);
    }
    return out;
  }
  return value;
}

export function sanitize(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  if (req.query && typeof req.query === 'object') req.query = clean(req.query);
  if (req.params && typeof req.params === 'object') req.params = clean(req.params);
  next();
}

export { clean as sanitizeValue };
