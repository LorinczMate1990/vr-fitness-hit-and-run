export interface BodySettings {
  armLength: number;          // total arm length in meters (b = armLength / 2)
  shoulderHorizontal: number; // horizontal distance from eyes to shoulder in meters
  shoulderVertical: number;   // vertical distance from eyes to shoulder in meters
}

const STORAGE_KEY = "vr-training-body-settings";

const DEFAULTS: BodySettings = {
  armLength: 0.50,
  shoulderHorizontal: 0.15,
  shoulderVertical: 0.35,
};

export function loadBodySettings(): BodySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      armLength: Number(parsed.armLength) || DEFAULTS.armLength,
      shoulderHorizontal:
        Number(parsed.shoulderHorizontal) || DEFAULTS.shoulderHorizontal,
      shoulderVertical:
        Number(parsed.shoulderVertical) || DEFAULTS.shoulderVertical,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveBodySettings(settings: BodySettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
