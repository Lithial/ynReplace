import { isValidPronounSet } from "../engine";
import type { PronounSet } from "../engine/types";

export interface Session {
  story: string;
  fields: Record<string, string>;
  pronounSet: PronounSet;
}

const KEY = "ynreplace.session";

function isSession(v: unknown): v is Session {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  if (typeof s.story !== "string") return false;
  if (!s.fields || typeof s.fields !== "object") return false;
  if (!Object.values(s.fields as Record<string, unknown>).every((x) => typeof x === "string"))
    return false;
  return isValidPronounSet(s.pronounSet);
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
