import { describe, expect, it } from "vitest";
import { parse } from "./parser";
import { presetById } from "./pronouns";
import { render } from "./render";
import type { PronounSet, Values } from "./types";

const they = presetById("they") as PronounSet;
const she = presetById("she") as PronounSet;

function values(fields: Record<string, string>, set: PronounSet): Values {
  return { fields, pronounSet: set };
}

describe("render", () => {
  it("renders the worked example for Robin / they-them / auburn", () => {
    const story =
      '{Name} brushed {pos} {hair color} hair back. "{Subj} {v:be} ready," {subj} said to {self}.';
    const r = render(parse(story), values({ name: "Robin", "hair color": "auburn" }, they));
    expect(r.text).toBe(
      'Robin brushed their auburn hair back. "They are ready," they said to themself.',
    );
    expect(r.missing).toEqual([]);
  });

  it("conjugates verbs to singular for she/her", () => {
    const r = render(parse("{Subj} {v:be} here and {subj} {v:walk}."), values({}, she));
    expect(r.text).toBe("She is here and she walks.");
  });

  it("applies casing to pronouns and fields", () => {
    const r = render(parse("{NAME} / {Name} / {name}"), values({ name: "robin" }, she));
    expect(r.text).toBe("ROBIN / Robin / robin");
  });

  it("reports missing fields and leaves the raw marker in place", () => {
    const r = render(parse("Hi {name}, your {item}."), values({ name: "Sam" }, she));
    expect(r.text).toBe("Hi Sam, your {item}.");
    expect(r.missing).toEqual(["item"]);
  });

  it("treats an empty-string field value as missing", () => {
    const r = render(parse("{name}"), values({ name: "" }, she));
    expect(r.missing).toEqual(["name"]);
    expect(r.text).toBe("{name}");
  });
});
