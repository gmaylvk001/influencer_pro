// Platforms and Niches change rarely (admin adds one occasionally) but are
// read on almost every page load (signup forms, filters, cards). A simple
// process-memory cache with a short TTL cuts that down to one DB hit every
// few minutes instead of one per request. Call invalidate() after any
// create/update/delete so edits show up immediately instead of waiting for
// the TTL to expire.

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const store = new Map();

export async function cached(key, loader) {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return hit.value;
  }
  const value = await loader();
  store.set(key, { value, at: Date.now() });
  return value;
}

export function invalidate(key) {
  store.delete(key);
}
