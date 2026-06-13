import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StepBar } from "./StepBar";

describe("StepBar", () => {
  it("marks the current step and lets you jump to another", async () => {
    const onChange = vi.fn();
    render(<StepBar current={1} onChange={onChange} />);
    expect(screen.getByRole("button", { name: /Values/ })).toHaveAttribute("aria-current", "true");
    await userEvent.click(screen.getByRole("button", { name: /Read/ }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
