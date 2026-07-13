type CacheEntry<T> = { data: T; expiresAt: number };

const cache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) return null;
    return entry.data as T;
}

// Liefert auch abgelaufene Einträge — Fallback wenn der Upstream-Fetch fehlschlägt
export function getStale<T>(key: string): T | null {
    const entry = cache.get(key);
    return entry ? (entry.data as T) : null;
}

export function setCached<T>(key: string, data: T, ttlMs: number): void {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
