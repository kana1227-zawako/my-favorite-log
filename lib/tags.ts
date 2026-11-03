import type { LogRecord } from "./types";

export function normalizeTag(input: string): string {
  return input.trim();
}

/**
 * タグを追加する。前後の空白を除去してから判定し、
 * 空または既存タグと重複する場合（大文字・小文字は区別）は同じ配列をそのまま返す。
 */
export function addTag(tags: string[], input: string): string[] {
  const tag = normalizeTag(input);
  if (tag === "" || tags.includes(tag)) return tags;
  return [...tags, tag];
}

export function removeTag(tags: string[], tag: string): string[] {
  return tags.filter((t) => t !== tag);
}

/** 現在の記録で使われているタグの一覧（既存タグ） */
export function collectExistingTags(records: readonly LogRecord[]): string[] {
  const set = new Set<string>();
  for (const r of records) for (const t of r.tags ?? []) set.add(t);
  return [...set].sort((a, b) => a.localeCompare(b, "ja"));
}

/** 入力中の文字に部分一致する既存タグの候補。追加済みのタグは除く */
export function suggestTags(
  existing: readonly string[],
  input: string,
  current: readonly string[],
): string[] {
  const q = normalizeTag(input).toLowerCase();
  return existing.filter(
    (t) => !current.includes(t) && (q === "" || t.toLowerCase().includes(q)),
  );
}

/** 選択中のタグから、既存タグでなくなったものを外す（変化がなければ同じ配列を返す） */
export function pruneSelectedTags(
  selected: string[],
  existing: readonly string[],
): string[] {
  const next = selected.filter((t) => existing.includes(t));
  return next.length === selected.length ? selected : next;
}
