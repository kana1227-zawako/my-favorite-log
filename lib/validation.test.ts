import { describe, expect, it } from "vitest";
import { validateRecords } from "./validation";

const base = {
  id: "a1",
  category: "映画",
  title: "君の名は",
  createdAt: "2026-11-01T03:17:13.000Z",
};

const valid = (records: unknown) => validateRecords(records).ok;

describe("validateRecords: 正常系", () => {
  it("空配列", () => expect(valid([])).toBe(true));
  it("必須項目のみ", () => expect(valid([base])).toBe(true));
  it("全項目あり", () =>
    expect(
      valid([
        {
          ...base,
          experienceDate: "2026-10-31",
          comment: "よかった",
          rating: 5,
          tags: ["感動", "家族"],
        },
      ]),
    ).toBe(true));
  it("tags: [] は正常", () => expect(valid([{ ...base, tags: [] }])).toBe(true));
  it("余分な項目は破損ではない", () =>
    expect(valid([{ ...base, memo: "x", extra: { a: 1 } }])).toBe(true));
  it("3カテゴリすべて", () =>
    expect(
      valid([
        { ...base, id: "1", category: "映画" },
        { ...base, id: "2", category: "読書" },
        { ...base, id: "3", category: "お出かけ" },
      ]),
    ).toBe(true));
  it('"Movie" と "movie" は重複ではない', () =>
    expect(valid([{ ...base, tags: ["Movie", "movie"] }])).toBe(true));
  it('途中の空白は除去しない（"旅行" と "旅 行" は別タグ）', () =>
    expect(valid([{ ...base, tags: ["旅行", "旅 行"] }])).toBe(true));
  it("rating 1 と 5 は正常", () => {
    expect(valid([{ ...base, rating: 1 }])).toBe(true);
    expect(valid([{ ...base, rating: 5 }])).toBe(true);
  });
});

describe("validateRecords: 破損系", () => {
  const without = (key: string) => {
    const copy: Record<string, unknown> = { ...base };
    delete copy[key];
    return copy;
  };

  it.each<[string, unknown]>([
    ["オブジェクト", { 0: base }],
    ["文字列", "[]"],
    ["null", null],
    ["数値", 1],
  ])("配列でない: %s", (_, data) => expect(valid(data)).toBe(false));

  it.each<[string, unknown]>([
    ["null", null],
    ["配列", [base]],
    ["文字列", "x"],
  ])("要素がオブジェクトでない: %s", (_, item) =>
    expect(valid([item])).toBe(false));

  it.each(["id", "category", "title", "createdAt"])("必須 %s がない", (key) =>
    expect(valid([without(key)])).toBe(false));

  it.each<[string, unknown]>([
    ["id", 1],
    ["category", null],
    ["title", ["x"]],
    ["createdAt", 1730000000000],
  ])("必須 %s の型が違う", (key, v) =>
    expect(valid([{ ...base, [key]: v }])).toBe(false));

  it.each(["", "   ", "　", " 　 "])("id が空白のみ: %j", (v) =>
    expect(valid([{ ...base, id: v }])).toBe(false));
  it.each(["", "   ", "　", "\t\n"])("title が空白のみ: %j", (v) =>
    expect(valid([{ ...base, title: v }])).toBe(false));

  it.each(["すべて", "movie", "", "映画 "])("カテゴリ外: %j", (v) =>
    expect(valid([{ ...base, category: v }])).toBe(false));

  it.each([
    "2026-11-01T03:17:13+09:00",
    "2026/11/01",
    "2026-13-01T00:00:00.000Z",
    "2026-11-01T24:00:00.000Z",
    "",
  ])("createdAt が不正: %s", (v) =>
    expect(valid([{ ...base, createdAt: v }])).toBe(false));

  it.each<unknown>(["2026-02-30", "2026-1-1", "2026/01/01", "", 20260101])(
    "体験日が不正: %j",
    (v) => expect(valid([{ ...base, experienceDate: v }])).toBe(false),
  );

  it.each<unknown>(["", "  ", "　", 1])("comment が不正: %j", (v) =>
    expect(valid([{ ...base, comment: v }])).toBe(false));

  it.each<unknown>([0, 6, 3.5, "3", Number.NaN, -1, Infinity])(
    "rating が不正: %j",
    (v) => expect(valid([{ ...base, rating: v }])).toBe(false),
  );

  it.each<[string, unknown]>([
    ["配列でない", "旅行"],
    ["非文字列の要素", ["旅行", 1]],
    ["null の要素", [null]],
    ["空文字", [""]],
    ["半角空白のみ", [" "]],
    ["全角空白のみ", ["　"]],
    ["完全一致の重複", ["旅行", "旅行"]],
    ["前に半角空白がある重複", ["旅行", " 旅行"]],
    ["後ろに半角空白がある重複", ["旅行", "旅行 "]],
    ["全角空白がある重複", ["旅行", "　旅行"]],
  ])("tags が不正: %s", (_, v) =>
    expect(valid([{ ...base, tags: v }])).toBe(false));

  it.each(["experienceDate", "comment", "rating", "tags"])(
    "任意項目 %s が null / undefined",
    (key) => {
      expect(valid([{ ...base, [key]: null }])).toBe(false);
      expect(valid([{ ...base, [key]: undefined }])).toBe(false);
    },
  );

  it("id が重複", () =>
    expect(valid([base, { ...base, title: "別" }])).toBe(false));

  it("1件でも破損があれば全体が破損", () =>
    expect(valid([base, { ...base, id: "b", rating: 0 }])).toBe(false));
});

describe("validateRecords: 元データを変更しない", () => {
  it("tags の trim 判定で元の値を書き換えない", () => {
    const record = { ...base, tags: [" 旅行 ", "カフェ"] };
    const result = validateRecords([record]);
    expect(result.ok).toBe(true);
    expect(record.tags).toEqual([" 旅行 ", "カフェ"]);
  });
});
