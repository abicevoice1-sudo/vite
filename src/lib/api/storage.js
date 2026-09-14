// ─── Storage adapter — the ONLY module that touches localStorage directly ────
// Swap this file for an HTTP implementation to point the app at a real server.
// All keys are namespaced `sh_*`. Values are JSON. Quota failures are silent.
const PREFIX = 'sh_';

export function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota exceeded — non-fatal */
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
