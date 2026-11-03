import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { TagInput } from "./TagInput";

function Harness({ initial = [] as string[], existing = [] as string[] }) {
  const [tags, setTags] = useState(initial);
  const [pending, setPending] = useState("");
  return (
    <>
      <label htmlFor="t">タグ</label>
      <TagInput
        id="t"
        tags={tags}
        pending={pending}
        existingTags={existing}
        onTagsChange={setTags}
        onPendingChange={setPending}
      />
      <output>{JSON.stringify(tags)}</output>
    </>
  );
}

const tagsOutput = () => JSON.parse(screen.getByRole("status").textContent!);

describe("TagInput", () => {
  it("Enter で前後の空白を除去して追加し、入力欄を空にする", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("タグ");
    await user.type(input, "  旅行　{Enter}");
    expect(tagsOutput()).toEqual(["旅行"]);
    expect(input).toHaveValue("");
  });

  it("「追加」ボタンでも追加できる", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText("タグ"), "カフェ");
    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(tagsOutput()).toEqual(["カフェ"]);
  });

  it("重複（前後の空白違いを含む）と空白のみは無視し、大文字小文字は区別する", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["Movie"]} />);
    const input = screen.getByLabelText("タグ");
    await user.type(input, " Movie {Enter}");
    await user.type(input, "　{Enter}");
    expect(tagsOutput()).toEqual(["Movie"]);
    await user.type(input, "movie{Enter}");
    expect(tagsOutput()).toEqual(["Movie", "movie"]);
  });

  it("IME 変換中の Enter では追加しない", () => {
    render(<Harness />);
    const input = screen.getByLabelText("タグ");
    fireEvent.change(input, { target: { value: "りょこう" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(tagsOutput()).toEqual([]);
    expect(input).toHaveValue("りょこう");
  });

  it("× ボタンで個別に削除できる", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["a", "b"]} />);
    await user.click(screen.getByRole("button", { name: "タグ「a」を削除" }));
    expect(tagsOutput()).toEqual(["b"]);
  });

  it("入力時に既存タグを候補表示し、追加済みは除外する。クリックで追加", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["旅行"]} existing={["旅行", "家族旅行", "カフェ"]} />);
    await user.type(screen.getByLabelText("タグ"), "旅");
    const list = screen.getByRole("list", { name: "タグの候補" });
    const items = within(list).getAllByRole("button").map((b) => b.textContent);
    expect(items).toEqual(["+ 家族旅行"]);
    await user.click(within(list).getByRole("button", { name: "+ 家族旅行" }));
    expect(tagsOutput()).toEqual(["旅行", "家族旅行"]);
  });
});
