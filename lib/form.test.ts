import { describe, expect, it } from "vitest";
import { EMPTY_FORM, formFromRecord, toManagedFields, validateForm } from "./form";

const filled = { ...EMPTY_FORM, category: "映画" as const, title: "君の名は" };

describe("validateForm", () => {
  it("初期値はカテゴリ未選択・タイトル空でエラー", () =>
    expect(validateForm(EMPTY_FORM)).toEqual({
      category: "カテゴリを選択してください",
      title: "タイトルを入力してください",
    }));
  it.each(["   ", "　", " 　\t"])("空白のみのタイトルはエラー: %j", (title) =>
    expect(validateForm({ ...filled, title }).title).toBe(
      "タイトルを入力してください",
    ));
  it("体験日が不正ならエラー", () =>
    expect(validateForm({ ...filled, experienceDate: "2026-02-30" }).experienceDate)
      .toBeDefined());
  it("必須のみ入力でエラーなし", () => expect(validateForm(filled)).toEqual({}));
});

describe("toManagedFields", () => {
  it("必須のみなら任意項目のキーを作らない", () => {
    const fields = toManagedFields({ ...filled, comment: "  　", tags: [] });
    expect(fields).toEqual({ category: "映画", title: "君の名は" });
    for (const key of ["experienceDate", "comment", "rating", "tags"]) {
      expect(key in fields).toBe(false);
    }
  });
  it("タイトルと感想を trim する", () => {
    const fields = toManagedFields({
      ...filled,
      title: "  君の名は　",
      comment: "　よかった ",
    });
    expect(fields.title).toBe("君の名は");
    expect(fields.comment).toBe("よかった");
  });
  it("全項目", () =>
    expect(
      toManagedFields({
        ...filled,
        experienceDate: "2026-10-31",
        comment: "よかった",
        rating: 4,
        tags: ["感動"],
      }),
    ).toEqual({
      category: "映画",
      title: "君の名は",
      experienceDate: "2026-10-31",
      comment: "よかった",
      rating: 4,
      tags: ["感動"],
    }));
  it("入力中のタグも整形して含める", () =>
    expect(toManagedFields({ ...filled, tags: ["感動"], pendingTag: " 家族 " }).tags)
      .toEqual(["感動", "家族"]));
  it("入力中のタグは空白除去後に重複判定する", () =>
    expect(toManagedFields({ ...filled, tags: ["感動"], pendingTag: " 感動　" }).tags)
      .toEqual(["感動"]));
  it("入力中のタグが空白のみなら無視", () =>
    expect("tags" in toManagedFields({ ...filled, pendingTag: "　" })).toBe(false));
});

describe("formFromRecord", () => {
  it("記録からフォームの初期値を作る", () =>
    expect(
      formFromRecord({
        id: "a",
        category: "読書",
        title: "雪国",
        createdAt: "2026-11-01T00:00:00.000Z",
        rating: 3,
      }),
    ).toEqual({
      category: "読書",
      title: "雪国",
      experienceDate: "",
      comment: "",
      rating: 3,
      tags: [],
      pendingTag: "",
    }));
});
