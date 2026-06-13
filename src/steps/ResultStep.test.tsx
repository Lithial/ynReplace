import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PronounSet } from "../engine";
import { parse, presetById } from "../engine";
import { ResultStep } from "./ResultStep";

const they = presetById("they") as PronounSet;

describe("ResultStep", () => {
  it("renders the personalized story live", () => {
    const parsed = parse("{Name} {v:be} here.");
    render(<ResultStep parsed={parsed} fields={{ name: "Robin" }} pronounSet={they} />);
    expect(screen.getByTestId("result")).toHaveTextContent("Robin are here.");
  });

  it("shows a copy button and a download link", () => {
    const parsed = parse("{name}");
    render(<ResultStep parsed={parsed} fields={{ name: "Robin" }} pronounSet={they} />);
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download/i })).toBeInTheDocument();
  });

  it("warns when fields are missing", () => {
    const parsed = parse("{name} {item}");
    render(<ResultStep parsed={parsed} fields={{ name: "Robin" }} pronounSet={they} />);
    expect(screen.getByText(/unfilled fields/i)).toHaveTextContent("item");
  });
});
