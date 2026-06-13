import type { PronounSet } from "../engine";

export interface Session {
  story: string;
  fields: Record<string, string>;
  pronounSet: PronounSet;
}

const STORAGE_KEY = "ynreplace_session";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore storage errors (e.g. private browsing quota exceeded)
  }
}
