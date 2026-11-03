import { describe, expect, it } from "vitest";
import {
  addTag,
  collectExistingTags,
  pruneSelectedTags,
  removeTag,
  suggestTags,
} from "./tags";
import type { LogRecord } from "./types";

describe("addTag", () => {
  it("前後の空白を除去して追加する", () =>
    expect(addTag([], "  旅行　")).toEqual(["旅行"]));
  it("空白除去後に重複判定する", () => {
    const tags = ["Movie"];
    expect(addTag(tags, "  Movie ")).toBe(tags);
    expect(addTag(tags, "　Movie")).toBe(tags);
  });
  it("大文字・小文字は区別する", () =>
    expect(addTag(["Movie"], "movie")).toEqual(["Movie", "movie"]));
  it.each(["", " ", "　", " 　 "])("空・空白のみは追加しない: %j", (v) => {
    const tags = ["a"];
    expect(addTag(tags, v)).toBe(tags);
  });
  it("途中の空白は残す", () => expect(addTag([], " 旅 行 ")).toEqual(["旅 行"]));
});

describe("removeTag", () => {
  it("指定したタグだけを外す", () =>
    expect(removeTag(["a", "b", "c"], "b")).toEqual(["a", "c"]));
});

const r = (id: string, tags?: string[]): LogRecord => ({
  id,
  category: "映画",
  title: id,
  createdAt: "2026-11-01T00:00:00.000Z",
  ...(tags && { tags }),
});

describe("collectExistingTags", () => {
  it("記録で使われているタグの和集合（重複なし）", () =>
    expect(
      collectExistingTags([r("1", ["カフェ", "旅行"]), r("2", ["旅行"]), r("3")]),
    ).toEqual(["カフェ", "旅行"].sort((a, b) => a.localeCompare(b, "ja"))));
  it("記録がなければ空", () => expect(collectExistingTags([])).toEqual([]));
});

describe("suggestTags", () => {
  const existing = ["Movie", "旅行", "カフェ", "家族旅行"];
  it("入力が空なら追加済み以外の全候補", () =>
    expect(suggestTags(existing, "", ["旅行"])).toEqual([
      "Movie",
      "カフェ",
      "家族旅行",
    ]));
  it("部分一致する候補", () =>
    expect(suggestTags(existing, "旅行", [])).toEqual(["旅行", "家族旅行"]));
  it("追加済みのタグは除外する", () =>
    expect(suggestTags(existing, "旅行", ["旅行"])).toEqual(["家族旅行"]));
});

describe("pruneSelectedTags", () => {
  it("既存タグでなくなった選択を外す", () =>
    expect(pruneSelectedTags(["a", "b"], ["a"])).toEqual(["a"]));
  it("変化がなければ同じ配列", () => {
    const sel = ["a"];
    expect(pruneSelectedTags(sel, ["a", "b"])).toBe(sel);
  });
});
