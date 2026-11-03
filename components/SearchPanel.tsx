"use client";

import { useId } from "react";
import { Search } from "lucide-react";
import { ALL_CATEGORIES, CATEGORIES, type CategoryFilter } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";

interface SearchPanelProps {
  category: CategoryFilter;
  selectedTags: readonly string[];
  keyword: string;
  existingTags: readonly string[];
  disabled: boolean;
  onCategoryChange: (category: CategoryFilter) => void;
  onToggleTag: (tag: string) => void;
  onKeywordChange: (keyword: string) => void;
}

const FILTERS: CategoryFilter[] = [ALL_CATEGORIES, ...CATEGORIES];

export function SearchPanel({
  category,
  selectedTags,
  keyword,
  existingTags,
  disabled,
  onCategoryChange,
  onToggleTag,
  onKeywordChange,
}: SearchPanelProps) {
  const keywordId = useId();
  const categoryLabelId = useId();
  const tagLabelId = useId();

  return (
    <section
      aria-label="検索"
      className="space-y-4 rounded-2xl border border-sand-200 bg-white/70 p-5"
    >
      <div className="relative">
        <label htmlFor={keywordId} className="sr-only">
          キーワード
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sand-500"
        />
        <input
          id={keywordId}
          type="search"
          value={keyword}
          disabled={disabled}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="タイトル・感想で検索"
          className="input pl-9"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span id={categoryLabelId} className="w-16 shrink-0 text-xs font-medium text-ink-soft">
          カテゴリ
        </span>
        <div role="group" aria-labelledby={categoryLabelId} className="flex flex-wrap gap-1.5">
          {FILTERS.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => onCategoryChange(c)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? "border-ink bg-ink text-cream"
                    : "border-sand-200 bg-white text-ink hover:bg-sand-50"
                }`}
              >
                {c !== ALL_CATEGORIES && <CategoryIcon category={c} className="size-3.5" />}
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <span id={tagLabelId} className="w-16 shrink-0 pt-1 text-xs font-medium text-ink-soft">
          タグ
        </span>
        {existingTags.length === 0 ? (
          <p className="pt-1 text-xs text-sand-500">タグはまだありません</p>
        ) : (
          <div role="group" aria-labelledby={tagLabelId} className="flex flex-wrap gap-1.5">
            {existingTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  onClick={() => onToggleTag(tag)}
                  className={`rounded-full border px-3 py-0.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    active
                      ? "border-sand-500 bg-sand-100 text-ink"
                      : "border-sand-200 bg-white text-ink-soft hover:bg-sand-50"
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
