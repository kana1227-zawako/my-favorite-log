import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { isValidUtcDateTime } from "@/lib/date";
import { STORAGE_KEY } from "@/lib/types";
import { FavoriteLogApp } from "./FavoriteLogApp";

const base = {
  category: "映画",
  createdAt: "2026-11-01T03:17:13.000Z",
};

function seed(value: unknown) {
  localStorage.setItem(
    STORAGE_KEY,
    typeof value === "string" ? value : JSON.stringify(value),
  );
}

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!);
const raw = () => localStorage.getItem(STORAGE_KEY);
const dialog = () => screen.getByRole("dialog");
const card = (title: string) => screen.getByRole("article", { name: title });
const addButton = () => screen.getByRole("button", { name: "新しい記録を追加" });

function setup() {
  const user = userEvent.setup();
  render(<FavoriteLogApp />);
  return user;
}

describe("一覧と0件表示", () => {
  it("保存データがなければ「まだ記録がありません」。読み込みで書き込まない", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    setup();
    expect(screen.getByText("まだ記録がありません")).toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();
    expect(raw()).toBeNull();
  });

  it("新しい順に並び、createdAt は表示しない。体験日は YYYY/MM/DD", () => {
    seed([
      { ...base, id: "1", title: "古い", createdAt: "2026-01-01T00:00:00.000Z" },
      { ...base, id: "2", title: "新しい", experienceDate: "2026-10-31", rating: 4 },
    ]);
    setup();
    const titles = screen.getAllByRole("article").map((a) => a.getAttribute("aria-label"));
    expect(titles).toEqual(["新しい", "古い"]);
    expect(within(card("新しい")).getByText("2026/10/31")).toBeInTheDocument();
    expect(within(card("新しい")).getByRole("img", { name: "評価 4 / 5" })).toBeInTheDocument();
    expect(screen.queryByText(/2026-11-01T03:17:13/)).not.toBeInTheDocument();
    expect(within(card("古い")).queryByRole("img")).not.toBeInTheDocument();
  });

  it("記録があり検索結果が0件なら「条件に一致する記録がありません」", async () => {
    seed([{ ...base, id: "1", title: "君の名は" }]);
    const user = setup();
    await user.type(screen.getByLabelText("キーワード"), "存在しない");
    expect(screen.getByText("条件に一致する記録がありません")).toBeInTheDocument();
    expect(screen.queryByText("まだ記録がありません")).not.toBeInTheDocument();
  });

  it("カテゴリ・タグ・キーワードを AND で組み合わせる", async () => {
    seed([
      { ...base, id: "1", title: "映画A", tags: ["感動"] },
      { ...base, id: "2", title: "映画B", tags: ["家族"], comment: "楽しい" },
      { ...base, id: "3", title: "本C", category: "読書", tags: ["感動"] },
    ]);
    const user = setup();
    const search = screen.getByRole("region", { name: "検索" });
    await user.click(within(search).getByRole("button", { name: "映画" }));
    await user.click(within(search).getByRole("button", { name: "#感動" }));
    await user.click(within(search).getByRole("button", { name: "#家族" }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
    await user.type(screen.getByLabelText("キーワード"), "　楽しい ");
    expect(screen.getAllByRole("article").map((a) => a.getAttribute("aria-label"))).toEqual([
      "映画B",
    ]);
    await user.click(within(search).getByRole("button", { name: "すべて" }));
    await user.clear(screen.getByLabelText("キーワード"));
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });
});

describe("登録", () => {
  it("カテゴリは未選択で始まり、未選択・タイトル空ではエラーを表示して保存しない", async () => {
    const user = setup();
    await user.click(addButton());
    const d = dialog();
    expect(within(d).getByRole("heading", { name: "新しい記録を追加" })).toBeInTheDocument();
    for (const radio of within(d).getAllByRole("radio")) expect(radio).not.toBeChecked();

    await user.type(within(d).getByLabelText(/タイトル/), "　 ");
    await user.click(within(d).getByRole("button", { name: "保存" }));
    expect(within(d).getByText("カテゴリを選択してください")).toBeInTheDocument();
    expect(within(d).getByText("タイトルを入力してください")).toBeInTheDocument();
    expect(raw()).toBeNull();
  });

  it("全項目を入力して保存すると、整形された記録が保存され一覧に表示される", async () => {
    const user = setup();
    await user.click(addButton());
    const d = dialog();
    await user.click(within(d).getByRole("radio", { name: "読書" }));
    await user.type(within(d).getByLabelText(/タイトル/), "  雪国　");
    await user.type(within(d).getByLabelText("一言感想"), " 美しい ");
    await user.click(within(d).getByRole("button", { name: "星4" }));
    const tagInput = within(d).getByLabelText("タグ");
    await user.type(tagInput, " 名作 {Enter}");
    await user.type(tagInput, "冬 "); // チップにせず保存しても含める
    await user.click(within(d).getByRole("button", { name: "保存" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const [rec] = stored();
    expect(rec).toEqual({
      id: expect.any(String),
      category: "読書",
      title: "雪国",
      comment: "美しい",
      rating: 4,
      tags: ["名作", "冬"],
      createdAt: expect.any(String),
    });
    expect(isValidUtcDateTime(rec.createdAt)).toBe(true);
    expect("experienceDate" in rec).toBe(false);
    expect(within(card("雪国")).getByText("#名作")).toBeInTheDocument();
  });

  it("必須のみで保存すると任意項目のキーを作らない", async () => {
    const user = setup();
    await user.click(addButton());
    const d = dialog();
    await user.click(within(d).getByRole("radio", { name: "お出かけ" }));
    await user.type(within(d).getByLabelText(/タイトル/), "鎌倉");
    await user.click(within(d).getByRole("button", { name: "星2" }));
    await user.click(within(d).getByRole("button", { name: "星2" })); // 解除
    await user.click(within(d).getByRole("button", { name: "保存" }));
    expect(Object.keys(stored()[0]).sort()).toEqual(["category", "createdAt", "id", "title"]);
  });

  it("キャンセルと Esc は入力を破棄して閉じ、背景クリックでは閉じない", async () => {
    const user = setup();
    await user.click(addButton());
    await user.type(within(dialog()).getByLabelText(/タイトル/), "途中");
    await user.click(screen.getByTestId("modal-overlay"));
    expect(dialog()).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(raw()).toBeNull();

    await user.click(addButton());
    expect(within(dialog()).getByLabelText(/タイトル/)).toHaveValue("");
    await user.click(within(dialog()).getByRole("button", { name: "キャンセル" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(raw()).toBeNull();
  });

  it("保存に失敗したらモーダル内に知らせ、入力を保持し、既存データを変えない", async () => {
    seed([{ ...base, id: "1", title: "既存" }]);
    const before = raw();
    const user = setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    await user.click(addButton());
    const d = dialog();
    await user.click(within(d).getByRole("radio", { name: "映画" }));
    await user.type(within(d).getByLabelText(/タイトル/), "新規");
    await user.click(within(d).getByRole("button", { name: "保存" }));

    expect(within(d).getByRole("alert")).toHaveTextContent("保存できませんでした");
    expect(within(d).getByLabelText(/タイトル/)).toHaveValue("新規");
    expect(raw()).toBe(before);
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("保存直前に読み直したデータが破損していたら書き込まず、操作を停止する", async () => {
    seed([]);
    const user = setup();
    await user.click(addButton());
    const d = dialog();
    await user.click(within(d).getByRole("radio", { name: "映画" }));
    await user.type(within(d).getByLabelText(/タイトル/), "新規");
    localStorage.setItem(STORAGE_KEY, "{broken"); // 別タブなどで壊れた想定
    await user.click(within(d).getByRole("button", { name: "保存" }));

    expect(within(d).getByRole("alert")).toHaveTextContent("破損");
    expect(within(d).getByRole("button", { name: "保存" })).toBeDisabled();
    expect(raw()).toBe("{broken");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alert")).toHaveTextContent("保存データが破損しているため");
    expect(addButton()).toBeDisabled();
  });
});

describe("編集", () => {
  const record = {
    ...base,
    id: "keep-id",
    title: "旧タイトル",
    rating: 3,
    tags: ["旧"],
    memo: "定義外の項目",
  };

  it("管理項目だけを更新し、id・createdAt・定義外の項目を保持する", async () => {
    seed([record]);
    const user = setup();
    await user.click(within(card("旧タイトル")).getByRole("button", { name: "編集" }));
    const d = dialog();
    expect(within(d).getByRole("heading", { name: "記録を編集" })).toBeInTheDocument();
    const title = within(d).getByLabelText(/タイトル/);
    expect(title).toHaveValue("旧タイトル");
    await user.clear(title);
    await user.type(title, "新タイトル");
    await user.click(within(d).getByRole("button", { name: "星3" })); // 解除
    await user.click(within(d).getByRole("button", { name: "タグ「旧」を削除" }));
    await user.click(within(d).getByRole("button", { name: "保存" }));

    expect(stored()).toEqual([
      {
        id: "keep-id",
        category: "映画",
        title: "新タイトル",
        createdAt: base.createdAt,
        memo: "定義外の項目",
      },
    ]);
    expect(card("新タイトル")).toBeInTheDocument();
  });

  it("キャンセル・Esc では保存データを変更しない", async () => {
    seed([record]);
    const before = raw();
    const user = setup();
    await user.click(within(card("旧タイトル")).getByRole("button", { name: "編集" }));
    await user.type(within(dialog()).getByLabelText(/タイトル/), "変更");
    await user.click(within(dialog()).getByRole("button", { name: "キャンセル" }));
    expect(raw()).toBe(before);

    await user.click(within(card("旧タイトル")).getByRole("button", { name: "編集" }));
    await user.type(within(dialog()).getByLabelText(/タイトル/), "変更");
    await user.keyboard("{Escape}");
    expect(raw()).toBe(before);
    expect(card("旧タイトル")).toBeInTheDocument();
  });
});

describe("削除", () => {
  it("確認でキャンセル・Esc・背景クリックなら削除せず、「削除する」で削除する", async () => {
    seed([{ ...base, id: "1", title: "消す記録" }]);
    const user = setup();
    const del = () => within(card("消す記録")).getByRole("button", { name: "削除" });

    await user.click(del());
    await user.click(within(dialog()).getByRole("button", { name: "キャンセル" }));
    await user.click(del());
    await user.keyboard("{Escape}");
    await user.click(del());
    await user.click(screen.getByTestId("modal-overlay"));
    expect(dialog()).toBeInTheDocument();
    expect(stored()).toHaveLength(1);

    await user.click(within(dialog()).getByRole("button", { name: "削除する" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(stored()).toEqual([]);
    expect(screen.getByText("まだ記録がありません")).toBeInTheDocument();
  });

  it("使われなくなったタグは検索の選択から自動で外れる", async () => {
    seed([
      { ...base, id: "1", title: "限定の記録", tags: ["限定"] },
      { ...base, id: "2", title: "残る記録", tags: ["共通"] },
    ]);
    const user = setup();
    const search = screen.getByRole("region", { name: "検索" });
    await user.click(within(search).getByRole("button", { name: "#限定" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);

    await user.click(within(card("限定の記録")).getByRole("button", { name: "削除" }));
    await user.click(within(dialog()).getByRole("button", { name: "削除する" }));

    expect(within(search).queryByRole("button", { name: "#限定" })).not.toBeInTheDocument();
    expect(card("残る記録")).toBeInTheDocument();
  });

  it("削除に失敗したらダイアログ内に知らせ、データを変えない", async () => {
    seed([{ ...base, id: "1", title: "記録" }]);
    const before = raw();
    const user = setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("x");
    });
    await user.click(within(card("記録")).getByRole("button", { name: "削除" }));
    await user.click(within(dialog()).getByRole("button", { name: "削除する" }));
    expect(within(dialog()).getByRole("alert")).toHaveTextContent("削除できませんでした");
    expect(raw()).toBe(before);
  });
});

describe("保存データの破損・読み込み失敗", () => {
  it.each([
    ["不正な JSON", "{not json"],
    ["配列でない", '{"a":1}'],
    ["id の重複", JSON.stringify([{ ...base, id: "1", title: "a" }, { ...base, id: "1", title: "b" }])],
    ["前後の空白違いのタグ重複", JSON.stringify([{ ...base, id: "1", title: "a", tags: ["旅行", " 旅行"] }])],
  ])("%s: 警告のみを表示し、操作を停止し、元データを変えない", (_, value) => {
    seed(value);
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    setup();
    expect(screen.getByRole("alert")).toHaveTextContent("保存データが破損しているため");
    expect(screen.queryByText("まだ記録がありません")).not.toBeInTheDocument();
    expect(screen.queryByText("条件に一致する記録がありません")).not.toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(addButton()).toBeDisabled();
    expect(screen.getByLabelText("キーワード")).toBeDisabled();
    expect(setItem).not.toHaveBeenCalled();
    expect(raw()).toBe(value);
  });

  it("「再読み込み」: 破損が続けば停止を維持し、修正後は操作を再開する（書き込みなし）", async () => {
    seed("{broken");
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const user = setup();
    const reloadButton = () => screen.getByRole("button", { name: "再読み込み" });

    await user.click(reloadButton());
    expect(screen.getByRole("alert")).toHaveTextContent("破損");
    expect(addButton()).toBeDisabled();
    expect(raw()).toBe("{broken");

    // ユーザーがデータを修正した想定（テスト用に直接書き換える）
    setItem.mockRestore();
    seed([{ ...base, id: "1", title: "復旧した記録" }]);
    const setItemAfter = vi.spyOn(Storage.prototype, "setItem");

    await user.click(reloadButton());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(card("復旧した記録")).toBeInTheDocument();
    expect(addButton()).toBeEnabled();
    expect(within(card("復旧した記録")).getByRole("button", { name: "編集" })).toBeEnabled();
    expect(setItemAfter).not.toHaveBeenCalled();
  });

  it("読み込み失敗: 警告を表示し、再読み込みしても失敗が続く間は停止を維持する", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const user = setup();
    expect(screen.getByRole("alert")).toHaveTextContent("データを読み込めませんでした");
    expect(screen.queryByText("まだ記録がありません")).not.toBeInTheDocument();
    expect(addButton()).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "再読み込み" }));
    expect(screen.getByRole("alert")).toHaveTextContent("データを読み込めませんでした");
    expect(addButton()).toBeDisabled();

    getItem.mockRestore();
    await user.click(screen.getByRole("button", { name: "再読み込み" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("まだ記録がありません")).toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();
  });
});
