import { describe, expect, it } from "vitest";
import { isRealDate, isValidDateString, isValidUtcDateTime } from "./date";

describe("isValidDateString", () => {
  it.each(["2024-02-29", "2026-11-01", "2026-12-31", "0001-01-01", "0004-02-29"])(
    "%s は正常",
    (v) => expect(isValidDateString(v)).toBe(true),
  );

  it.each([
    "2023-02-29",
    "2026-02-30",
    "2026-13-01",
    "2026-00-10",
    "2026-04-31",
    "2026-01-00",
    "0050-02-29", // 1950 年として誤判定しない（50 年はうるう年でない）
    "0100-02-29", // 100 年はうるう年でない
    "2026-1-1",
    "2026/01/01",
    "20260101",
    " 2026-01-01",
    "",
  ])("%s は不正", (v) => expect(isValidDateString(v)).toBe(false));
});

describe("isRealDate（年 0〜99）", () => {
  it("0〜99 年を 1900 年代に読み替えない", () => {
    expect(isRealDate(4, 2, 29)).toBe(true);
    expect(isRealDate(50, 2, 29)).toBe(false);
    expect(isRealDate(96, 2, 29)).toBe(true);
    expect(isRealDate(0, 2, 29)).toBe(true); // 0 年は 400 の倍数
  });
});

describe("isValidUtcDateTime", () => {
  it.each([
    "2026-11-01T03:17:13.000Z",
    "2026-11-01T03:17:13Z",
    "2026-11-01T23:59:59.9Z",
    "2024-02-29T00:00:00.000Z",
  ])("%s は正常", (v) => expect(isValidUtcDateTime(v)).toBe(true));

  it.each([
    "2026-11-01T03:17:13+09:00",
    "2026-11-01T03:17:13",
    "2026/11/01",
    "2026-11-01",
    "2026-13-01T00:00:00.000Z",
    "2026-02-30T00:00:00.000Z",
    "2026-11-01T24:00:00.000Z",
    "2026-11-01T23:60:00.000Z",
    "2026-11-01T23:59:60.000Z",
    "2026-11-01T03:17:13.0000Z",
    "not a date",
  ])("%s は不正", (v) => expect(isValidUtcDateTime(v)).toBe(false));
});
