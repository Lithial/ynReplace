import type { PronounSet } from "../engine/types";

export interface Profile {
  id: string;
  name: string;
  fields: Record<string, string>;
  pronounSet: PronounSet;
}

const KEY = "ynreplace.profiles";

export function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Profile[]) : [];
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: Profile[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profiles));
  } catch {
    // localStorage unavailable/full — degrade silently to in-memory only.
  }
}

export function exportProfile(profile: Profile): string {
  return JSON.stringify(profile, null, 2);
}

export function importProfile(json: string): Profile {
  const parsed = JSON.parse(json);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.name !== "string" ||
    typeof parsed.fields !== "object" ||
    typeof parsed.pronounSet !== "object"
  ) {
    throw new Error("Invalid profile JSON");
  }
  return parsed as Profile;
}
