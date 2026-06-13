import { describe, expect, it } from "vitest";
import { conjugate } from "./conjugate";

describe("conjugate", () => {
  it("conjugates irregular 'be'", () => {
    expect(conjugate("be", "singular")).toBe("is");
    expect(conjugate("be", "plural")).toBe("are");
  });
  it("conjugates irregular 'have' and 'do'", () => {
    expect(conjugate("have", "singular")).toBe("has");
    expect(conjugate("have", "plural")).toBe("have");
    expect(conjugate("do", "singular")).toBe("does");
  });
  it("conjugates past-tense 'was'", () => {
    expect(conjugate("was", "singular")).toBe("was");
    expect(conjugate("was", "plural")).toBe("were");
  });
  it("adds -s for regular verbs in the singular", () => {
    expect(conjugate("walk", "singular")).toBe("walks");
    expect(conjugate("walk", "plural")).toBe("walk");
  });
  it("adds -es after sibilant endings", () => {
    expect(conjugate("kiss", "singular")).toBe("kisses");
    expect(conjugate("focus", "singular")).toBe("focuses");
    expect(conjugate("watch", "singular")).toBe("watches");
  });
  it("turns consonant+y into -ies", () => {
    expect(conjugate("carry", "singular")).toBe("carries");
  });
  it("keeps vowel+y as +s", () => {
    expect(conjugate("play", "singular")).toBe("plays");
  });
});
