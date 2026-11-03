import { describe, expect, it } from "vitest";
import { filterRecords, normalizeKeyword, sortByCreatedAtDesc } from "./search";
import type { LogRecord } from "./types";

const rec = (over: Partial<LogRecord> & { id: string }): LogRecord => ({
  category: "映画",
  title: over.id,
  createdAt: "2026-11-01T00:00:00.000Z",
  ...over,
});

const records: LogRecord[] = [
  rec({ id: "m1", category: "映画", title: "君の 名は", tags: ["感動"] }),
  rec({ id: "m2", category: "映画", title: "Alien", tags: ["家族", "SF"] }),
  rec({ id: "m3", category: "映画", title: "Up", comment: "泣けた" }),
  rec({ id: "b1", category: "読書", title: "雪国", tags: ["感動"] }),
  rec({ id: "o1", category: "お出かけ", title: "鎌倉", comment: "Cafe が良い" }),
];

const ids = (rs: LogRecord[]) => rs.map((r) => r.id);
const search = (over: Partial<Parameters<typeof filterRecords>[1]>) =>
  ids(filterRecords(records, { category: "すべて", tags: [], keyword: "", ...over }));

describe("normalizeKeyword", () => {
  it("前後の半角・全角スペースだけを除去する", () =>
    expect(normalizeKeyword("　 君の 名は　 ")).toBe("君の 名は"));
});

describe("filterRecords", () => {
  it("条件なしなら全件", () => expect(search({})).toHaveLength(5));
  it("カテゴリ", () => expect(search({ category: "読書" })).toEqual(["b1"]));
  it("タグ1つ", () => expect(search({ tags: ["感動"] })).toEqual(["m1", "b1"]));
  it("複数タグは OR", () =>
    expect(search({ tags: ["感動", "家族"] })).toEqual(["m1", "m2", "b1"]));
  it("カテゴリ × タグは AND", () =>
    expect(search({ category: "映画", tags: ["感動", "家族"] })).toEqual([
      "m1",
      "m2",
    ]));
  it("キーワードはタイトルと感想の部分一致", () => {
    expect(search({ keyword: "泣け" })).toEqual(["m3"]);
    expect(search({ keyword: "国" })).toEqual(["b1"]);
  });
  it("キーワードは大文字小文字を区別しない", () => {
    expect(search({ keyword: "alien" })).toEqual(["m2"]);
    expect(search({ keyword: "CAFE" })).toEqual(["o1"]);
  });
  it.each(["", "   ", "　　", " 　 "])("空白のみのキーワードは条件なし: %j", (k) =>
    expect(search({ keyword: k })).toHaveLength(5));
  it("前後の空白は除去し、途中の空白は残して1つの文字列として判定する", () => {
    expect(search({ keyword: "　君の 名は " })).toEqual(["m1"]);
    expect(
      ids(
        filterRecords([rec({ id: "x", title: "君の名は" })], {
          category: "すべて",
          tags: [],
          keyword: "　君の 名は ",
        }),
      ),
    ).toEqual([]);
  });
  it("3条件の AND", () =>
    expect(search({ category: "映画", tags: ["感動"], keyword: "名は" })).toEqual([
      "m1",
    ]));
  it("一致なし", () => expect(search({ category: "読書", tags: ["家族"] })).toEqual([]));
});

describe("sortByCreatedAtDesc", () => {
  it("新しい順。同じ値は元の順序", () => {
    const list = [
      rec({ id: "a", createdAt: "2026-01-01T00:00:00.000Z" }),
      rec({ id: "b", createdAt: "2026-03-01T00:00:00.000Z" }),
      rec({ id: "c", createdAt: "2026-02-01T00:00:00.000Z" }),
      rec({ id: "d", createdAt: "2026-03-01T00:00:00.000Z" }),
    ];
    expect(ids(sortByCreatedAtDesc(list))).toEqual(["b", "d", "c", "a"]);
  });
});
