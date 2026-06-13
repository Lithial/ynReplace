import { describe, expect, it } from "vitest";
import { parse } from "./parser";

describe("parse", () => {
  it("returns a single text token for plain text", () => {
    const r = parse("hello world");
    expect(r.tokens).toEqual([{ kind: "text", value: "hello world" }]);
    expect(r.fields).toEqual([]);
  });

  it("parses a field marker and records it in the manifest", () => {
    const r = parse("Hi {name}!");
    expect(r.tokens).toEqual([
      { kind: "text", value: "Hi " },
      { kind: "field", name: "name", casing: "lower", raw: "{name}" },
      { kind: "text", value: "!" },
    ]);
    expect(r.fields).toEqual(["name"]);
  });

  it("normalizes field name to lowercase but keeps casing from the marker", () => {
    const r = parse("{Name} {NAME}");
    expect(r.tokens[0]).toMatchObject({ kind: "field", name: "name", casing: "title" });
    expect(r.tokens[2]).toMatchObject({ kind: "field", name: "name", casing: "upper" });
    expect(r.fields).toEqual(["name"]);
  });

  it("lists distinct fields in first-seen order", () => {
    const r = parse("{name} {hair color} {name}");
    expect(r.fields).toEqual(["name", "hair color"]);
  });

  it("parses pronoun roles", () => {
    const r = parse("{subj} {Obj} {pos} {posp} {self}");
    expect(
      r.tokens.filter((t) => t.kind === "pronoun").map((t) => (t as { role: string }).role),
    ).toEqual(["subj", "obj", "pos", "posp", "self"]);
    expect(r.tokens[2]).toMatchObject({ kind: "pronoun", role: "obj", casing: "title" });
    expect(r.fields).toEqual([]);
  });

  it("parses verb markers with base form and casing", () => {
    const r = parse("{v:be} {V:have}");
    expect(r.tokens[0]).toMatchObject({ kind: "verb", base: "be", casing: "lower" });
    expect(r.tokens[2]).toMatchObject({ kind: "verb", base: "have", casing: "title" });
  });

  it("unescapes \\{ into a literal brace", () => {
    const r = parse("a \\{ b");
    expect(r.tokens).toEqual([{ kind: "text", value: "a { b" }]);
  });

  it("emits a warning for an empty marker and keeps it as literal text", () => {
    const r = parse("x {} y");
    expect(r.warnings).toHaveLength(1);
    expect(r.tokens).toEqual([{ kind: "text", value: "x {} y" }]);
  });

  it("trims whitespace inside markers", () => {
    const r = parse("{ name }");
    expect(r.tokens[0]).toMatchObject({ kind: "field", name: "name" });
  });

  it("warns on an empty verb base and keeps it as literal text", () => {
    const r = parse("a {v:} b");
    expect(r.warnings).toHaveLength(1);
    expect(r.tokens).toEqual([{ kind: "text", value: "a {v:} b" }]);
    expect(r.fields).toEqual([]);
  });
});
