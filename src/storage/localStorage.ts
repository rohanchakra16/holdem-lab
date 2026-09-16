const NAMESPACE = 'poker-trainer:v1:';

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NAMESPACE + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(NAMESPACE + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable (e.g. private browsing) — fail silently, training progress just won't persist.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(NAMESPACE + key);
  } catch {
    /* ignore */
  }
}
