import type { Casing } from "./types";

export function detectCasing(literal: string): Casing {
  const letters = literal.replace(/[^\p{L}]/gu, "");
  if (letters.length === 0) return "lower";
  const hasCase = letters !== letters.toLowerCase();
  if (hasCase && letters.length > 1 && letters === letters.toUpperCase()) return "upper";
  const first = literal.match(/\p{L}/u)?.[0];
  if (first && first !== first.toLowerCase() && first === first.toUpperCase()) return "title";
  return "lower";
}

export function applyCasing(value: string, casing: Casing): string {
  if (value.length === 0) return value;
  switch (casing) {
    case "lower":
      return value;
    case "title":
      return value[0].toUpperCase() + value.slice(1);
    case "upper":
      return value.toUpperCase();
  }
}
