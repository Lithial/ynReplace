import type { PronounSet } from "../engine/types";

export interface Session {
  story: string;
  fields: Record<string, string>;
  pronounSet: PronounSet;
}

const KEY = "ynreplace.session";

function isSession(v: unknown): v is Session {
  return !!v && typeof (v as Session).story === "string";
}

export function loadSession(): Session | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // ignore quota/availability errors
  }
}
