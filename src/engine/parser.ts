import { detectCasing } from "./casing";
import type { ParseResult, ParseWarning, PronounRole, Token } from "./types";

const PRONOUN_ROLES: PronounRole[] = ["subj", "obj", "pos", "posp", "self"];
// Note: the flat [^}]* does not support nested braces (e.g. {a{b}}); this is a known limitation.
const MARKER = /\\\{|\{([^}]*)\}/g;

type MarkerResult =
  | { kind: "token"; token: Token }
  | { kind: "warning"; warning: ParseWarning; literal: string };

// Reserved role names (subj/obj/pos/posp/self) are always pronouns and cannot be used as custom field names.
function isPronounRole(value: string): value is PronounRole {
  return PRONOUN_ROLES.includes(value as PronounRole);
}

function parseVerbToken(inner: string, raw: string): Token | null {
  const verb = inner.match(/^([vV]):(.+)$/);
  if (!verb) return null;
  return {
    kind: "verb",
    base: verb[2].trim().toLowerCase(),
    casing: verb[1] === "V" ? "title" : "lower",
    raw,
  };
}

function classifyMarker(inner: string, raw: string, fields: string[]): MarkerResult {
  if (inner.length === 0) {
    return { kind: "warning", warning: { raw, message: "Empty marker" }, literal: raw };
  }

  const verbToken = parseVerbToken(inner, raw);
  if (verbToken) return { kind: "token", token: verbToken };

  if (/^[vV]:\s*$/.test(inner)) {
    return { kind: "warning", warning: { raw, message: "Empty verb base" }, literal: raw };
  }

  const lower = inner.toLowerCase();
  if (isPronounRole(lower)) {
    return {
      kind: "token",
      token: { kind: "pronoun", role: lower, casing: detectCasing(inner), raw },
    };
  }

  if (!fields.includes(lower)) fields.push(lower);
  return { kind: "token", token: { kind: "field", name: lower, casing: detectCasing(inner), raw } };
}

export function parse(text: string): ParseResult {
  const tokens: Token[] = [];
  const fields: string[] = [];
  const warnings: ParseWarning[] = [];
  let lastIndex = 0;
  let buffer = "";

  const flush = () => {
    if (buffer.length > 0) {
      tokens.push({ kind: "text", value: buffer });
      buffer = "";
    }
  };

  for (const match of text.matchAll(MARKER)) {
    const index = match.index ?? 0;
    buffer += text.slice(lastIndex, index);
    lastIndex = index + match[0].length;

    if (match[0] === "\\{") {
      buffer += "{";
      continue;
    }

    const inner = (match[1] ?? "").trim();
    const result = classifyMarker(inner, match[0], fields);

    if (result.kind === "warning") {
      warnings.push(result.warning);
      buffer += result.literal;
    } else {
      flush();
      tokens.push(result.token);
    }
  }

  buffer += text.slice(lastIndex);
  flush();

  return { tokens, fields, warnings };
}
