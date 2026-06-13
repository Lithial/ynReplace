import type { Casing } from "./types";

export function detectCasing(literal: string): Casing {
  const letters = literal.replace(/[^a-zA-Z]/g, "");
  if (letters.length === 0) return "lower";
  const isUpper = letters === letters.toUpperCase();
  if (isUpper && letters.length > 1) return "upper";
  const first = literal.match(/[a-zA-Z]/);
  if (first && first[0] === first[0].toUpperCase()) return "title";
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
