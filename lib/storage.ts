import { STORAGE_KEY, type StoredRecord } from "./types";
import { validateRecords } from "./validation";

export type LoadResult =
  | { status: "ok"; records: StoredRecord[] }
  | { status: "corrupt"; reason: string }
  | { status: "readError" };

export type MutateResult =
  | { status: "ok"; records: StoredRecord[] }
  | { status: "corrupt"; reason: string }
  | { status: "readError" }
  | { status: "writeError" }
  | { status: "notFound"; records: StoredRecord[] };

/** 操作関数が対象の記録を見つけられなかったことを示す値 */
export const NOT_FOUND = Symbol("notFound");

/** 利用できる Storage を返す。アクセス自体が例外を投げる環境では null */
export function getBrowserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * LocalStorage から読み込んで検証する。
 * どの結果になっても書き込みは一切しない（キーがない場合も [] を書き込まない）。
 */
export function loadRecords(storage: Storage | null): LoadResult {
  if (!storage) return { status: "readError" };

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { status: "readError" };
  }
  if (raw === null) return { status: "ok", records: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "corrupt", reason: "JSON として読み込めません" };
  }

  const result = validateRecords(parsed);
  if (!result.ok) return { status: "corrupt", reason: result.reason };
  return { status: "ok", records: result.records };
}

export function writeRecords(
  storage: Storage | null,
  records: StoredRecord[],
): { ok: boolean } {
  if (!storage) return { ok: false };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(records));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * 保存直前に読み直して検証し、最新データに操作を適用してから書き込む。
 * 読み直したデータが破損・読み込み失敗の場合は書き込まない。
 */
export function mutateRecords(
  storage: Storage | null,
  op: (fresh: StoredRecord[]) => StoredRecord[] | typeof NOT_FOUND,
): MutateResult {
  const loaded = loadRecords(storage);
  if (loaded.status !== "ok") return loaded;

  const next = op(loaded.records);
  if (next === NOT_FOUND) return { status: "notFound", records: loaded.records };

  if (!writeRecords(storage, next).ok) return { status: "writeError" };
  return { status: "ok", records: next };
}
