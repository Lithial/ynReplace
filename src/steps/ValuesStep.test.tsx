import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PronounSet } from "../engine";
import { presetById } from "../engine";
import { ValuesStep } from "./ValuesStep";

const they = presetById("they") as PronounSet;

function setup(overrides: Partial<Parameters<typeof ValuesStep>[0]> = {}) {
  const props = {
    fields: ["name", "hair color"],
    values: { name: "Robin" } as Record<string, string>,
    onChangeValue: vi.fn(),
    pronounSet: they,
    onChangePronounSet: vi.fn(),
    onNext: vi.fn(),
    ...overrides,
  };
  render(<ValuesStep {...props} />);
  return props;
}

describe("ValuesStep", () => {
  it("renders an input per discovered field", () => {
    setup();
    expect(screen.getByLabelText("name")).toHaveValue("Robin");
    expect(screen.getByLabelText("hair color")).toHaveValue("");
  });

  it("calls onChangeValue when editing a field", async () => {
    const props = setup();
    await userEvent.type(screen.getByLabelText("hair color"), "auburn");
    expect(props.onChangeValue).toHaveBeenCalledWith("hair color", expect.any(String));
  });

  it("flags fields that are still empty", () => {
    setup();
    expect(screen.getByText(/hair color/)).toBeInTheDocument();
    expect(screen.getByText(/still empty/i)).toBeInTheDocument();
  });

  it("switches the pronoun preset", async () => {
    const props = setup();
    await userEvent.selectOptions(screen.getByLabelText(/pronoun/i), "she");
    expect(props.onChangePronounSet).toHaveBeenCalledWith(expect.objectContaining({ id: "she" }));
  });
});
