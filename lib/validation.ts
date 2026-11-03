import { isValidDateString, isValidUtcDateTime } from "./date";
import { isCategory, type StoredRecord } from "./types";

export type ValidationResult =
  | { ok: true; records: StoredRecord[] }
  | { ok: false; reason: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBlank(value: string): boolean {
  return value.trim() === "";
}

/** 1件の記録を検証する。問題があれば理由を返し、正常なら null を返す */
export function validateRecord(value: unknown): string | null {
  if (!isPlainObject(value)) return "記録がオブジェクトではありません";

  for (const key of ["id", "category", "title", "createdAt"] as const) {
    if (!(key in value)) return `必須項目 ${key} がありません`;
    if (typeof value[key] !== "string") return `${key} が文字列ではありません`;
  }
  const { id, category, title, createdAt } = value as Record<string, string>;

  if (isBlank(id)) return "id が空です";
  if (isBlank(title)) return "title が空です";
  if (!isCategory(category)) return "category が不正です";
  if (!isValidUtcDateTime(createdAt)) return "createdAt が不正です";

  if ("experienceDate" in value) {
    const v = value.experienceDate;
    if (typeof v !== "string" || !isValidDateString(v)) {
      return "experienceDate が不正です";
    }
  }

  if ("comment" in value) {
    const v = value.comment;
    if (typeof v !== "string" || isBlank(v)) return "comment が不正です";
  }

  if ("rating" in value) {
    const v = value.rating;
    if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 5) {
      return "rating が不正です";
    }
  }

  if ("tags" in value) {
    const v = value.tags;
    if (!Array.isArray(v)) return "tags が配列ではありません";
    const seen = new Set<string>();
    for (const tag of v) {
      if (typeof tag !== "string") return "tags に文字列以外の要素があります";
      // 判定には trim した値のコピーだけを使い、保存データ自体は変更しない
      const normalized = tag.trim();
      if (normalized === "") return "tags に空のタグがあります";
      if (seen.has(normalized)) return "tags に重複があります";
      seen.add(normalized);
    }
  }

  return null;
}

/** 保存データ全体を検証する（JSON.parse 後の値を受け取る） */
export function validateRecords(data: unknown): ValidationResult {
  if (!Array.isArray(data)) return { ok: false, reason: "配列ではありません" };

  const ids = new Set<string>();
  for (let i = 0; i < data.length; i++) {
    const reason = validateRecord(data[i]);
    if (reason) return { ok: false, reason: `${i} 件目: ${reason}` };
    const id = (data[i] as StoredRecord).id;
    if (ids.has(id)) return { ok: false, reason: `id が重複しています: ${id}` };
    ids.add(id);
  }
  return { ok: true, records: data as StoredRecord[] };
}
