import { ALL_CATEGORIES, type CategoryFilter, type LogRecord } from "./types";

export interface SearchConditions {
  category: CategoryFilter;
  tags: readonly string[];
  keyword: string;
}

/** 前後の半角・全角空白だけを除去する（途中の空白は残す） */
export function normalizeKeyword(keyword: string): string {
  return keyword.trim();
}

export function filterRecords<T extends LogRecord>(
  records: readonly T[],
  { category, tags, keyword }: SearchConditions,
): T[] {
  const q = normalizeKeyword(keyword).toLowerCase();
  return records.filter((r) => {
    if (category !== ALL_CATEGORIES && r.category !== category) return false;
    if (tags.length > 0 && !(r.tags ?? []).some((t) => tags.includes(t))) {
      return false;
    }
    if (q !== "") {
      const inTitle = r.title.toLowerCase().includes(q);
      const inComment = (r.comment ?? "").toLowerCase().includes(q);
      if (!inTitle && !inComment) return false;
    }
    return true;
  });
}

/** 登録日時の新しい順（同じ値は元の順序を保つ） */
export function sortByCreatedAtDesc<T extends LogRecord>(records: readonly T[]): T[] {
  return [...records].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}
