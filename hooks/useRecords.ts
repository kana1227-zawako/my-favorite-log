"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { RecordFormValues } from "@/lib/form";
import { toManagedFields } from "@/lib/form";
import { buildNewRecord, removeRecord, updateInList } from "@/lib/recordOps";
import {
  NOT_FOUND,
  getBrowserStorage,
  loadRecords,
  mutateRecords,
  type LoadResult,
  type MutateResult,
} from "@/lib/storage";
import type { StoredRecord } from "@/lib/types";

export type RecordsStatus = "loading" | "ready" | "corrupt" | "readError";

export interface RecordsState {
  status: RecordsStatus;
  records: StoredRecord[];
}

/** 操作の結果。blocked は破損・読み込み失敗中のため操作を受け付けなかったことを表す */
export type OperationResult = MutateResult | { status: "blocked" };

const LOADING_STATE: RecordsState = { status: "loading", records: [] };

function stateFromLoad(result: LoadResult): RecordsState {
  if (result.status === "ok") return { status: "ready", records: result.records };
  // 破損・読み込み失敗時は表示用の記録も持たない
  return { status: result.status, records: [] };
}

/**
 * 画面の状態を保持する小さなストア。
 * 初回の読み込みはクライアントで最初にスナップショットを求められたときに行う
 * （サーバーとハイドレーション中は loading を返すため、SSR との不一致が起きない）。
 */
function createRecordsStore() {
  let state: RecordsState | null = null;
  const listeners = new Set<() => void>();

  const set = (next: RecordsState) => {
    state = next;
    listeners.forEach((l) => l());
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot(): RecordsState {
      // 読み込みのみ。書き込みは一切しない
      state ??= stateFromLoad(loadRecords(getBrowserStorage()));
      return state;
    },
    getServerSnapshot: () => LOADING_STATE,
    set,
    reload() {
      // 読み直して検証するだけで、書き込みは一切しない
      set(stateFromLoad(loadRecords(getBrowserStorage())));
    },
  };
}

export function useRecords() {
  const [store] = useState(createRecordsStore);
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const mutate = useCallback(
    (op: (fresh: StoredRecord[]) => StoredRecord[] | typeof NOT_FOUND): OperationResult => {
      if (store.getSnapshot().status !== "ready") return { status: "blocked" };
      const result = mutateRecords(getBrowserStorage(), op);
      switch (result.status) {
        case "ok":
        case "notFound":
          store.set({ status: "ready", records: result.records });
          break;
        case "corrupt":
        case "readError":
          store.set({ status: result.status, records: [] });
          break;
        case "writeError":
          // 保存できなかった場合は画面上のデータも変えない
          break;
      }
      return result;
    },
    [store],
  );

  const createRecord = useCallback(
    (values: RecordFormValues) => {
      const fields = toManagedFields(values);
      return mutate((fresh) => [
        ...fresh,
        buildNewRecord(fields, crypto.randomUUID(), new Date()),
      ]);
    },
    [mutate],
  );

  const updateRecord = useCallback(
    (id: string, values: RecordFormValues) => {
      const fields = toManagedFields(values);
      return mutate((fresh) => updateInList(fresh, id, fields) ?? NOT_FOUND);
    },
    [mutate],
  );

  const deleteRecord = useCallback(
    (id: string) => mutate((fresh) => removeRecord(fresh, id) ?? NOT_FOUND),
    [mutate],
  );

  return {
    ...state,
    reload: store.reload,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}
