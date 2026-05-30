type StoredRunnerEntry<T> = {
  expiresAt: number;
  value: T;
};

const RUNNER_STORAGE_PREFIX = "uifive-runner-state:";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function getNamespacedKey(key: string): string {
  return key.startsWith(RUNNER_STORAGE_PREFIX)
    ? key
    : `${RUNNER_STORAGE_PREFIX}${key}`;
}

function isExpired(expiresAt: number): boolean {
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
}

export function readRunnerState<T>(key: string): T | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const namespacedKey = getNamespacedKey(key);

  try {
    const raw = storage.getItem(namespacedKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredRunnerEntry<T>;
    if (!parsed || isExpired(parsed.expiresAt)) {
      storage.removeItem(namespacedKey);
      return null;
    }

    return parsed.value;
  } catch {
    try {
      storage.removeItem(namespacedKey);
    } catch {
      // Ignore cleanup errors.
    }

    return null;
  }
}

export function writeRunnerState<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const namespacedKey = getNamespacedKey(key);
  const entry: StoredRunnerEntry<T> = {
    expiresAt: Date.now() + Math.max(1, ttlMs),
    value,
  };

  try {
    storage.setItem(namespacedKey, JSON.stringify(entry));
  } catch {
    // Ignore quota and access errors.
  }
}

export function clearRunnerState(key: string): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(getNamespacedKey(key));
  } catch {
    // Ignore cleanup errors.
  }
}
