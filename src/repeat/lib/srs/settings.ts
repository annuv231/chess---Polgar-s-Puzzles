export type AppSettings = {
  version: 1;
  dailyNewLimit: number;
};

const SETTINGS_KEY = "chessreps:settings:v1";

const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  dailyNewLimit: 20,
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as AppSettings;
    if (parsed.version !== 1) return DEFAULT_SETTINGS;
    return {
      version: 1,
      dailyNewLimit: Math.max(1, Math.min(100, parsed.dailyNewLimit ?? 20)),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export { DEFAULT_SETTINGS };
