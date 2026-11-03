"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useRecords } from "@/hooks/useRecords";
import { EMPTY_FORM, formFromRecord } from "@/lib/form";
import { filterRecords, sortByCreatedAtDesc } from "@/lib/search";
import { collectExistingTags, pruneSelectedTags } from "@/lib/tags";
import { ALL_CATEGORIES, type CategoryFilter } from "@/lib/types";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { RecordFormModal } from "./RecordFormModal";
import { RecordList } from "./RecordList";
import { SearchPanel } from "./SearchPanel";
import { StorageAlert } from "./StorageAlert";

type ModalState =
  | null
  | { type: "create" }
  | { type: "edit"; id: string }
  | { type: "delete"; id: string };

export function FavoriteLogApp() {
  const { status, records, reload, createRecord, updateRecord, deleteRecord } = useRecords();
  const ready = status === "ready";

  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const existingTags = useMemo(() => collectExistingTags(records), [records]);

  // 既存タグでなくなったタグは、検索の選択から実際に外す（正常なデータを確認できたときだけ）
  const [prunedFor, setPrunedFor] = useState(existingTags);
  if (ready && prunedFor !== existingTags) {
    setPrunedFor(existingTags);
    setSelectedTags((s) => pruneSelectedTags(s, existingTags));
  }

  const visible = useMemo(
    () => sortByCreatedAtDesc(filterRecords(records, { category, tags: selectedTags, keyword })),
    [records, category, selectedTags, keyword],
  );

  const toggleTag = (tag: string) =>
    setSelectedTags((s) => (s.includes(tag) ? s.filter((t) => t !== tag) : [...s, tag]));

  const closeModal = () => setModal(null);
  const target =
    modal && modal.type !== "create" ? records.find((r) => r.id === modal.id) : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide text-ink sm:text-3xl">
            My Favorite Log
          </h1>
          <p className="mt-1 text-sm text-ink-soft">映画・読書・お出かけの記録</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ type: "create" })}
          disabled={!ready}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus aria-hidden="true" className="size-4" />
          新しい記録を追加
        </button>
      </header>

      <main className="space-y-6">
        {(status === "corrupt" || status === "readError") && (
          <StorageAlert kind={status} onReload={reload} />
        )}

        <SearchPanel
          category={category}
          selectedTags={selectedTags}
          keyword={keyword}
          existingTags={ready ? existingTags : []}
          disabled={!ready}
          onCategoryChange={setCategory}
          onToggleTag={toggleTag}
          onKeywordChange={setKeyword}
        />

        {status === "loading" && (
          <p role="status" className="py-16 text-center text-sm text-ink-soft">
            読み込み中…
          </p>
        )}

        {ready && (
          <RecordList
            totalCount={records.length}
            records={visible}
            disabled={!ready}
            onEdit={(id) => setModal({ type: "edit", id })}
            onDelete={(id) => setModal({ type: "delete", id })}
          />
        )}
      </main>

      {modal?.type === "create" && (
        <RecordFormModal
          mode="create"
          initialValues={EMPTY_FORM}
          existingTags={existingTags}
          locked={!ready}
          onSubmit={createRecord}
          onClose={closeModal}
        />
      )}

      {modal?.type === "edit" && (
        <RecordFormModal
          key={modal.id}
          mode="edit"
          initialValues={target ? formFromRecord(target) : EMPTY_FORM}
          existingTags={existingTags}
          locked={!ready || !target}
          onSubmit={(values) => updateRecord(modal.id, values)}
          onClose={closeModal}
        />
      )}

      {modal?.type === "delete" && (
        <DeleteConfirmDialog
          title={target?.title ?? ""}
          locked={!ready || !target}
          onConfirm={() => deleteRecord(modal.id)}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
