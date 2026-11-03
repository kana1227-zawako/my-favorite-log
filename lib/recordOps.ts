import type { ManagedFields } from "./form";
import type { StoredRecord } from "./types";

const OPTIONAL_KEYS = ["experienceDate", "comment", "rating", "tags"] as const;

/** 新規登録用の記録。定義済みの項目だけで構成する */
export function buildNewRecord(
  fields: ManagedFields,
  id: string,
  now: Date,
): StoredRecord {
  return {
    id,
    category: fields.category,
    title: fields.title,
    ...(fields.experienceDate !== undefined && {
      experienceDate: fields.experienceDate,
    }),
    ...(fields.comment !== undefined && { comment: fields.comment }),
    ...(fields.rating !== undefined && { rating: fields.rating }),
    ...(fields.tags !== undefined && { tags: [...fields.tags] }),
    createdAt: now.toISOString(),
  };
}

/**
 * 既存の記録を編集する。id・createdAt・定義外の項目は保持し、
 * 管理項目だけを更新する（空にした任意項目はキーを削除する）。
 */
export function applyEdit(raw: StoredRecord, fields: ManagedFields): StoredRecord {
  const next: Record<string, unknown> = { ...raw };
  for (const key of OPTIONAL_KEYS) delete next[key];
  next.category = fields.category;
  next.title = fields.title;
  for (const key of OPTIONAL_KEYS) {
    const value = fields[key];
    if (value !== undefined) next[key] = Array.isArray(value) ? [...value] : value;
  }
  return next as StoredRecord;
}

export function updateInList(
  records: StoredRecord[],
  id: string,
  fields: ManagedFields,
): StoredRecord[] | null {
  const index = records.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const next = [...records];
  next[index] = applyEdit(records[index], fields);
  return next;
}

export function removeRecord(
  records: StoredRecord[],
  id: string,
): StoredRecord[] | null {
  if (!records.some((r) => r.id === id)) return null;
  return records.filter((r) => r.id !== id);
}
