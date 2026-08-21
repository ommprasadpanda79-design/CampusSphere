import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Logo from "./Logo.jsx";

describe("Logo", () => {
  it("renders the product name", () => {
    render(<Logo />);
    expect(screen.getByLabelText("CampusSphere")).toHaveTextContent("CampusSphere");
  });
});

