import { describe, expect, it } from "vitest";
import { applyEdit, buildNewRecord, removeRecord, updateInList } from "./recordOps";
import type { StoredRecord } from "./types";
import { validateRecords } from "./validation";

const now = new Date("2026-11-01T03:17:13.000Z");

describe("buildNewRecord", () => {
  it("定義済みの項目だけで構成し、空の任意項目のキーを作らない", () => {
    const rec = buildNewRecord({ category: "映画", title: "君の名は" }, "id-1", now);
    expect(rec).toEqual({
      id: "id-1",
      category: "映画",
      title: "君の名は",
      createdAt: "2026-11-01T03:17:13.000Z",
    });
    expect(Object.keys(rec).sort()).toEqual(["category", "createdAt", "id", "title"]);
  });
  it("全項目", () => {
    const rec = buildNewRecord(
      {
        category: "読書",
        title: "雪国",
        experienceDate: "2026-10-01",
        comment: "美しい",
        rating: 5,
        tags: ["名作"],
      },
      "id-2",
      now,
    );
    expect(validateRecords([rec]).ok).toBe(true);
    expect(rec.rating).toBe(5);
  });
});

describe("applyEdit", () => {
  const raw: StoredRecord = {
    id: "a1",
    category: "映画",
    title: "旧タイトル",
    experienceDate: "2026-01-01",
    comment: "旧感想",
    rating: 2,
    tags: ["旧"],
    createdAt: "2026-01-02T00:00:00.000Z",
    memo: "定義外",
    nested: { keep: true },
  };

  it("id・createdAt・定義外の項目を保持し、管理項目だけを更新する", () => {
    const next = applyEdit(raw, {
      category: "読書",
      title: "新タイトル",
      comment: "新感想",
      rating: 4,
      tags: ["新"],
      experienceDate: "2026-02-02",
    });
    expect(next).toEqual({
      id: "a1",
      createdAt: "2026-01-02T00:00:00.000Z",
      memo: "定義外",
      nested: { keep: true },
      category: "読書",
      title: "新タイトル",
      comment: "新感想",
      rating: 4,
      tags: ["新"],
      experienceDate: "2026-02-02",
    });
  });

  it("空にした任意項目のキーを削除する", () => {
    const next = applyEdit(raw, { category: "映画", title: "t" });
    for (const key of ["experienceDate", "comment", "rating", "tags"]) {
      expect(key in next).toBe(false);
    }
    expect(next.memo).toBe("定義外");
  });

  it("元の記録を変更しない", () => {
    const copy = structuredClone(raw);
    applyEdit(raw, { category: "映画", title: "t" });
    expect(raw).toEqual(copy);
  });
});

describe("updateInList / removeRecord", () => {
  const a: StoredRecord = {
    id: "a",
    category: "映画",
    title: "A",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  const b: StoredRecord = { ...a, id: "b", title: "B" };

  it("更新", () =>
    expect(updateInList([a, b], "b", { category: "映画", title: "B2" })?.[1].title).toBe(
      "B2",
    ));
  it("更新対象がなければ null", () =>
    expect(updateInList([a], "x", { category: "映画", title: "t" })).toBeNull());
  it("削除", () => expect(removeRecord([a, b], "a")).toEqual([b]));
  it("削除対象がなければ null", () => expect(removeRecord([a], "x")).toBeNull());
});
