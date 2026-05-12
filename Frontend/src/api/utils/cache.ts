type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const CACHE_PREFIX = "uifive-api-cache:";
const memoryCache = new Map<string, CacheEntry<unknown>>();

function getStorage(storage?: Storage): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return storage ?? window.sessionStorage;
}

function getNamespacedKey(key: string): string {
  return key.startsWith(CACHE_PREFIX) ? key : `${CACHE_PREFIX}${key}`;
}

function isExpired(expiresAt: number): boolean {
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
}

export function readCache<T>(key: string, storage?: Storage): T | null {
  const namespacedKey = getNamespacedKey(key);
  const memoryEntry = memoryCache.get(namespacedKey);

  if (memoryEntry) {
    if (!isExpired(memoryEntry.expiresAt)) {
      return memoryEntry.value as T;
    }

    memoryCache.delete(namespacedKey);
  }

  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return null;
  }

  try {
    const raw = resolvedStorage.getItem(namespacedKey);
    if (!raw) {
      return null;
    }

    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (!entry || isExpired(entry.expiresAt)) {
      resolvedStorage.removeItem(namespacedKey);
      return null;
    }

    memoryCache.set(namespacedKey, entry);
    return entry.value;
  } catch {
    resolvedStorage.removeItem(namespacedKey);
    return null;
  }
}

export function writeCache<T>(
  key: string,
  value: T,
  ttlMs: number,
  storage?: Storage,
): void {
  const namespacedKey = getNamespacedKey(key);
  const entry: CacheEntry<T> = {
    expiresAt: Date.now() + Math.max(1, ttlMs),
    value,
  };

  memoryCache.set(namespacedKey, entry);

  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return;
  }

  try {
    resolvedStorage.setItem(namespacedKey, JSON.stringify(entry));
  } catch {
    // Ignore storage quota / access errors and keep the in-memory cache only.
  }
}

export function invalidateCache(key: string, storage?: Storage): void {
  const namespacedKey = getNamespacedKey(key);
  memoryCache.delete(namespacedKey);

  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return;
  }

  try {
    resolvedStorage.removeItem(namespacedKey);
  } catch {
    // Ignore storage cleanup errors.
  }
}

export function clearCache(prefix: string = CACHE_PREFIX, storage?: Storage): void {
  memoryCache.clear();

  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return;
  }

  const keysToRemove: string[] = [];
  for (let index = 0; index < resolvedStorage.length; index += 1) {
    const key = resolvedStorage.key(index);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    try {
      resolvedStorage.removeItem(key);
    } catch {
      // Ignore cleanup errors.
    }
  }
}

export function clearCachePrefix(
  keyPrefix: string,
  storage?: Storage,
): void {
  const namespacedPrefix = getNamespacedKey(keyPrefix);
  const resolvedStorage = getStorage(storage);

  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(namespacedPrefix)) {
      memoryCache.delete(key);
    }
  }

  if (!resolvedStorage) {
    return;
  }

  const keysToRemove: string[] = [];
  for (let index = 0; index < resolvedStorage.length; index += 1) {
    const key = resolvedStorage.key(index);
    if (key && key.startsWith(namespacedPrefix)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    try {
      resolvedStorage.removeItem(key);
    } catch {
      // Ignore cleanup errors.
    }
  }
}
