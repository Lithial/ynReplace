import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { StoryStep } from "./StoryStep";

// Controlled-state harness: mirrors how App wires StoryStep (value + onChange=setState),
// so the test exercises the real controlled-textarea behavior.
function Harness({ onChange }: { onChange?: (s: string) => void }) {
  const [story, setStory] = useState("");
  return (
    <StoryStep
      story={story}
      onChange={(s) => {
        setStory(s);
        onChange?.(s);
      }}
      onNext={vi.fn()}
    />
  );
}

describe("StoryStep", () => {
  it("reflects typed text in the controlled textarea", async () => {
    render(<Harness />);
    const box = screen.getByLabelText(/story/i);
    // In user-event v14, "{{" types a literal "{" and "}" is literal, so "{{name}" types "Hi {name}".
    await userEvent.type(box, "Hi {{name}");
    expect(box).toHaveValue("Hi {name}");
  });

  it("loads the sample story into the textarea on demand", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: /sample/i }));
    const box = screen.getByLabelText(/story/i) as HTMLTextAreaElement;
    expect(box.value).toContain("{Name}");
  });
});
