import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

beforeEach(() => localStorage.clear());

describe("App integration", () => {
  it("threads a story through fields + pronouns to a rendered result", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Step 1: type a marked-up story (user-event v14: {{ => literal {).
    await user.type(
      screen.getByLabelText(/story/i),
      "{{Name} {{v:be} here with {{pos} {{color} bag.",
    );
    await user.click(screen.getByRole("button", { name: /fill in values/i }));

    // Step 2: discovered fields appear; fill them; choose she/her.
    await user.type(screen.getByLabelText("name"), "Robin");
    await user.type(screen.getByLabelText("color"), "red");
    await user.selectOptions(screen.getByLabelText(/pronouns/i), "she");
    await user.click(screen.getByRole("button", { name: /next: read/i }));

    // Step 3: rendered with she/her conjugation + casing.
    expect(screen.getByTestId("result")).toHaveTextContent("Robin is here with her red bag.");
  });

  it("restores autosaved work on reload", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.type(screen.getByLabelText(/story/i), "hello {{name}");
    unmount();

    render(<App />);
    expect(screen.getByLabelText(/story/i)).toHaveValue("hello {name}");
  });
});
