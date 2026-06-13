import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StoryStep } from "./StoryStep";

describe("StoryStep", () => {
  it("edits the story text", async () => {
    const onChange = vi.fn();
    render(<StoryStep story="" onChange={onChange} onNext={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/story/i), "Hi {{name}}");
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toContain("name");
  });

  it("loads the sample story on demand", async () => {
    const onChange = vi.fn();
    render(<StoryStep story="" onChange={onChange} onNext={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /sample/i }));
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining("{Name}"));
  });
});
