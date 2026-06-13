import { beforeEach, describe, expect, it } from "vitest";
import { presetById } from "../engine/pronouns";
import type { PronounSet } from "../engine/types";
import { exportProfile, importProfile, loadProfiles, saveProfiles } from "./profiles";

const she = presetById("she") as PronounSet;

beforeEach(() => localStorage.clear());

describe("profiles", () => {
  it("returns an empty list when nothing is stored", () => {
    expect(loadProfiles()).toEqual([]);
  });

  it("round-trips profiles through localStorage", () => {
    const profile = { id: "p1", name: "Robin", fields: { name: "Robin" }, pronounSet: she };
    saveProfiles([profile]);
    expect(loadProfiles()).toEqual([profile]);
  });

  it("exports a profile to JSON and imports it back", () => {
    const profile = { id: "p1", name: "Robin", fields: { name: "Robin" }, pronounSet: she };
    const json = exportProfile(profile);
    const imported = importProfile(json);
    expect(imported).toEqual(profile);
  });

  it("throws on malformed import JSON", () => {
    expect(() => importProfile("{not valid")).toThrow();
    expect(() => importProfile('{"name":"x"}')).toThrow(/profile/i);
  });

  it("rejects an import whose pronounSet is missing roles", () => {
    expect(() =>
      importProfile(
        '{"name":"x","fields":{},"pronounSet":{"id":"x","label":"x","number":"plural"}}',
      ),
    ).toThrow(/profile/i);
  });

  it("ignores corrupt stored data and returns an empty list", () => {
    localStorage.setItem("ynreplace.profiles", "{broken");
    expect(loadProfiles()).toEqual([]);
  });
});
