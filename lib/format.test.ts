import { expect, it } from "vitest";
import { formatDate } from "./format";

it("YYYY-MM-DD を YYYY/MM/DD で表示する", () => {
  expect(formatDate("2026-11-01")).toBe("2026/11/01");
});
