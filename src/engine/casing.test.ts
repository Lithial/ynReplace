import { describe, expect, it } from "vitest";
import { applyCasing, detectCasing } from "./casing";

describe("detectCasing", () => {
  it("lowercases by default", () => {
    expect(detectCasing("subj")).toBe("lower");
    expect(detectCasing("hair color")).toBe("lower");
  });
  it("detects title case from a leading capital", () => {
    expect(detectCasing("Subj")).toBe("title");
    expect(detectCasing("Hair color")).toBe("title");
  });
  it("detects upper case when all letters are capital and length > 1", () => {
    expect(detectCasing("NAME")).toBe("upper");
  });
  it("treats a single capital letter as title, not upper", () => {
    expect(detectCasing("I")).toBe("title");
  });
  it("detects title case for non-ASCII leading capitals", () => {
    expect(detectCasing("Émile")).toBe("title");
  });
  it("detects upper case for all-caps non-ASCII", () => {
    expect(detectCasing("ÜBER")).toBe("upper");
  });
  it("treats caseless scripts (e.g. CJK) as lower", () => {
    expect(detectCasing("名前")).toBe("lower");
  });
});

describe("applyCasing", () => {
  it("lower leaves the value untouched (respects user input)", () => {
    expect(applyCasing("they", "lower")).toBe("they");
    expect(applyCasing("Robin", "lower")).toBe("Robin");
  });
  it("title capitalizes the first character only", () => {
    expect(applyCasing("they", "title")).toBe("They");
    expect(applyCasing("robin", "title")).toBe("Robin");
  });
  it("upper uppercases the whole value", () => {
    expect(applyCasing("they", "upper")).toBe("THEY");
  });
  it("handles empty strings safely", () => {
    expect(applyCasing("", "title")).toBe("");
  });
  it("title-cases a non-ASCII first letter", () => {
    expect(applyCasing("émile", "title")).toBe("Émile");
  });
});
