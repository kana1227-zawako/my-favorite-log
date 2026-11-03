import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { StarRatingDisplay, StarRatingInput } from "./StarRating";

function Harness() {
  const [value, setValue] = useState<number | null>(null);
  return (
    <>
      <StarRatingInput value={value} onChange={setValue} />
      <output>{value ?? "none"}</output>
    </>
  );
}

describe("StarRatingInput", () => {
  it("星を選ぶと評価が入り、選択中の星をもう一度押すと解除される", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "星3" }));
    expect(screen.getByRole("status")).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: "星3" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "星5" }));
    expect(screen.getByRole("status")).toHaveTextContent("5");

    await user.click(screen.getByRole("button", { name: "星5" }));
    expect(screen.getByRole("status")).toHaveTextContent("none");
  });
});

describe("StarRatingDisplay", () => {
  it("評価をラベルで示す", () => {
    render(<StarRatingDisplay value={4} />);
    expect(screen.getByRole("img", { name: "評価 4 / 5" })).toBeInTheDocument();
  });
});
