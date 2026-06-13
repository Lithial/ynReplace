import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PronounSet } from "../engine";
import { presetById } from "../engine";
import { ProfileBar } from "./ProfileBar";

const she = presetById("she") as PronounSet;

beforeEach(() => localStorage.clear());

describe("ProfileBar", () => {
  it("saves the current values as a named profile and lists it", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("Robin");
    render(<ProfileBar fields={{ name: "Robin" }} pronounSet={she} onApply={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /save current/i }));
    expect(screen.getByRole("option", { name: /Robin/ })).toBeInTheDocument();
  });

  it("applies a selected profile", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("Robin");
    const onApply = vi.fn();
    render(<ProfileBar fields={{ name: "Robin" }} pronounSet={she} onApply={onApply} />);
    await userEvent.click(screen.getByRole("button", { name: /save current/i }));
    await userEvent.selectOptions(
      screen.getByLabelText(/profile/i),
      screen.getByRole("option", { name: /Robin/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: /^apply$/i }));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: { name: "Robin" },
        pronounSet: expect.objectContaining({ id: "she" }),
      }),
    );
  });
});
