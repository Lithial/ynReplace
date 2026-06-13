import { describe, expect, it } from "vitest";
import { isValidPronounSet, PRESET_PRONOUNS, presetById } from "./pronouns";

describe("PRESET_PRONOUNS", () => {
  it("includes she/her, he/him, they/them", () => {
    expect(PRESET_PRONOUNS.map((p) => p.id)).toEqual(["she", "he", "they"]);
  });
  it("marks they/them as plural for verb agreement, others singular", () => {
    expect(presetById("they")?.number).toBe("plural");
    expect(presetById("she")?.number).toBe("singular");
    expect(presetById("he")?.number).toBe("singular");
  });
  it("has all five roles for they/them", () => {
    const they = presetById("they");
    expect(they).toMatchObject({
      subj: "they",
      obj: "them",
      pos: "their",
      posp: "theirs",
      self: "themself",
    });
  });
  it("returns undefined for an unknown id", () => {
    expect(presetById("nope")).toBeUndefined();
  });
});

describe("isValidPronounSet", () => {
  it("accepts a real preset", () => {
    expect(isValidPronounSet(presetById("they"))).toBe(true);
  });
  it("rejects objects missing role strings", () => {
    expect(isValidPronounSet({ id: "x", label: "x", number: "plural" })).toBe(false);
  });
  it("rejects a bad number", () => {
    expect(
      isValidPronounSet({
        id: "x",
        label: "x",
        subj: "a",
        obj: "b",
        pos: "c",
        posp: "d",
        self: "e",
        number: "dual",
      }),
    ).toBe(false);
  });
  it("rejects non-objects", () => {
    expect(isValidPronounSet(null)).toBe(false);
    expect(isValidPronounSet("they")).toBe(false);
  });
});
