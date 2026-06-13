import type { PronounSet } from "./types";

export const PRESET_PRONOUNS: PronounSet[] = [
  {
    id: "she",
    label: "she/her",
    subj: "she",
    obj: "her",
    pos: "her",
    posp: "hers",
    self: "herself",
    number: "singular",
  },
  {
    id: "he",
    label: "he/him",
    subj: "he",
    obj: "him",
    pos: "his",
    posp: "his",
    self: "himself",
    number: "singular",
  },
  {
    id: "they",
    label: "they/them",
    subj: "they",
    obj: "them",
    pos: "their",
    posp: "theirs",
    self: "themself",
    number: "plural",
  },
];

export function presetById(id: string): PronounSet | undefined {
  return PRESET_PRONOUNS.find((p) => p.id === id);
}
