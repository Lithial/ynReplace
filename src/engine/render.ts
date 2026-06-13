import { applyCasing } from "./casing";
import { conjugate } from "./conjugate";
import type { ParseResult, RenderResult, Values } from "./types";

export function render(parsed: ParseResult, values: Values): RenderResult {
  const missing: string[] = [];
  let text = "";

  for (const token of parsed.tokens) {
    switch (token.kind) {
      case "text":
        text += token.value;
        break;
      case "field": {
        const value = values.fields[token.name];
        if (value === undefined || value === "") {
          if (!missing.includes(token.name)) missing.push(token.name);
          text += token.raw;
        } else {
          text += applyCasing(value, token.casing);
        }
        break;
      }
      case "pronoun":
        text += applyCasing(values.pronounSet[token.role], token.casing);
        break;
      case "verb":
        text += applyCasing(conjugate(token.base, values.pronounSet.number), token.casing);
        break;
    }
  }

  return { text, missing };
}
