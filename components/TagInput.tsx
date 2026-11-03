"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { addTag, removeTag, suggestTags } from "@/lib/tags";

interface TagInputProps {
  id: string;
  tags: string[];
  pending: string;
  existingTags: readonly string[];
  onTagsChange: (tags: string[]) => void;
  onPendingChange: (pending: string) => void;
  disabled?: boolean;
}

export function TagInput({
  id,
  tags,
  pending,
  existingTags,
  onTagsChange,
  onPendingChange,
  disabled,
}: TagInputProps) {
  const [focused, setFocused] = useState(false);
  const suggestions = suggestTags(existingTags, pending, tags);

  const add = (value: string) => {
    onTagsChange(addTag(tags, value));
    onPendingChange("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 日本語 IME の変換確定の Enter ではタグを追加しない
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      add(pending);
    }
  };

  return (
    <div>
      {tags.length > 0 && (
        <ul aria-label="追加したタグ" className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="flex items-center gap-1 rounded-full bg-sand-100 py-1 pl-3 pr-1 text-sm text-ink"
            >
              <span>{tag}</span>
              <button
                type="button"
                aria-label={`タグ「${tag}」を削除`}
                disabled={disabled}
                onClick={() => onTagsChange(removeTag(tags, tag))}
                className="rounded-full p-0.5 text-ink-soft hover:bg-sand-200 hover:text-ink"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={pending}
          disabled={disabled}
          autoComplete="off"
          placeholder="タグを入力して Enter"
          onChange={(e) => onPendingChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="input flex-1"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => add(pending)}
          className="btn-secondary"
        >
          追加
        </button>
      </div>
      {focused && suggestions.length > 0 && (
        <ul
          aria-label="タグの候補"
          className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto"
        >
          {suggestions.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                // クリックで入力欄のフォーカスが外れて候補が消えないようにする
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(tag)}
                className="rounded-full border border-dashed border-sand-300 px-3 py-0.5 text-sm text-ink-soft hover:border-sand-500 hover:bg-sand-50 hover:text-ink"
              >
                + {tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
