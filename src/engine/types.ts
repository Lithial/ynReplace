export type Casing = "lower" | "title" | "upper";

export type GrammaticalNumber = "singular" | "plural";

export type PronounRole = "subj" | "obj" | "pos" | "posp" | "self";

export type Token =
  | { kind: "text"; value: string }
  | { kind: "field"; name: string; casing: Casing; raw: string }
  | { kind: "pronoun"; role: PronounRole; casing: Casing; raw: string }
  | { kind: "verb"; base: string; casing: Casing; raw: string };

export interface PronounSet {
  id: string;
  label: string;
  subj: string;
  obj: string;
  pos: string;
  posp: string;
  self: string;
  number: GrammaticalNumber;
}

export interface Values {
  fields: Record<string, string>;
  pronounSet: PronounSet;
}

export interface ParseWarning {
  raw: string;
  message: string;
}

export interface ParseResult {
  tokens: Token[];
  fields: string[];
  warnings: ParseWarning[];
}

export interface RenderResult {
  text: string;
  missing: string[];
}
