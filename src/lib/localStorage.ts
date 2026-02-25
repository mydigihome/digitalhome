export function loadStoredJson<T>(key: string, fallback: T): T {
  const backupKey = `${key}__backup`;

  const parse = (raw: string | null): T | null => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  const primary = parse(localStorage.getItem(key));
  if (primary !== null) return primary;

  const backup = parse(localStorage.getItem(backupKey));
  if (backup !== null) {
    try {
      localStorage.setItem(key, JSON.stringify(backup));
    } catch {
      // no-op: restoration best effort only
    }
    return backup;
  }

  return fallback;
}

export function saveStoredJson<T>(key: string, value: T): boolean {
  const backupKey = `${key}__backup`;
  const payload = JSON.stringify(value);

  try {
    localStorage.setItem(key, payload);
    localStorage.setItem(backupKey, payload);
    return true;
  } catch (error) {
    console.warn(`Failed to save localStorage key: ${key}`, error);
    return false;
  }
}
