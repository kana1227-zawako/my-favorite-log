"use client";

import { useId, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import type { OperationResult } from "@/hooks/useRecords";
import { validateForm, type FormErrors, type RecordFormValues } from "@/lib/form";
import { CATEGORIES } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { Modal } from "./Modal";
import { StarRatingInput } from "./StarRating";
import { TagInput } from "./TagInput";
import { operationErrorMessage } from "./messages";

interface RecordFormModalProps {
  mode: "create" | "edit";
  initialValues: RecordFormValues;
  existingTags: readonly string[];
  /** 破損・読み込み失敗中は true（保存ボタンを無効にする） */
  locked: boolean;
  onSubmit: (values: RecordFormValues) => OperationResult;
  onClose: () => void;
}

export function RecordFormModal({
  mode,
  initialValues,
  existingTags,
  locked,
  onSubmit,
  onClose,
}: RecordFormModalProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const ids = {
    category: useId(),
    title: useId(),
    date: useId(),
    comment: useId(),
    rating: useId(),
    tags: useId(),
  };

  const set = <K extends keyof RecordFormValues>(key: K, value: RecordFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = onSubmit(values);
    const message = operationErrorMessage(result, "save");
    if (message === null) {
      onClose();
    } else {
      // 失敗時はモーダルを開いたまま入力を保持する
      setSubmitError(message);
    }
  };

  return (
    <Modal title={mode === "create" ? "新しい記録を追加" : "記録を編集"} onCancel={onClose}>
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <fieldset aria-describedby={errors.category ? `${ids.category}-err` : undefined}>
          <legend className="mb-2 text-sm font-medium">
            カテゴリ <span className="text-xs text-sand-500">必須</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <label
                key={c}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-sand-200 px-2 py-2 text-sm transition hover:bg-sand-50 has-checked:border-sand-500 has-checked:bg-sand-100 has-focus-visible:ring-2 has-focus-visible:ring-sand-300"
              >
                <input
                  type="radio"
                  name="category"
                  value={c}
                  checked={values.category === c}
                  onChange={() => set("category", c)}
                  className="sr-only"
                />
                <CategoryIcon category={c} className="size-4" />
                {c}
              </label>
            ))}
          </div>
          {errors.category && (
            <p id={`${ids.category}-err`} className="field-error">
              {errors.category}
            </p>
          )}
        </fieldset>

        <div>
          <label htmlFor={ids.title} className="mb-1 block text-sm font-medium">
            タイトル <span className="text-xs text-sand-500">必須</span>
          </label>
          <input
            id={ids.title}
            type="text"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? `${ids.title}-err` : undefined}
            className="input"
          />
          {errors.title && (
            <p id={`${ids.title}-err`} className="field-error">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={ids.date} className="mb-1 block text-sm font-medium">
            体験日
          </label>
          <input
            id={ids.date}
            type="date"
            value={values.experienceDate}
            onChange={(e) => set("experienceDate", e.target.value)}
            aria-invalid={errors.experienceDate ? true : undefined}
            aria-describedby={errors.experienceDate ? `${ids.date}-err` : undefined}
            className="input"
          />
          {errors.experienceDate && (
            <p id={`${ids.date}-err`} className="field-error">
              {errors.experienceDate}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={ids.comment} className="mb-1 block text-sm font-medium">
            一言感想
          </label>
          <textarea
            id={ids.comment}
            rows={3}
            value={values.comment}
            onChange={(e) => set("comment", e.target.value)}
            className="input resize-y"
          />
        </div>

        <div>
          <span id={ids.rating} className="mb-1 block text-sm font-medium">
            評価
          </span>
          <StarRatingInput
            labelledBy={ids.rating}
            value={values.rating}
            onChange={(v) => set("rating", v)}
          />
        </div>

        <div>
          <label htmlFor={ids.tags} className="mb-1 block text-sm font-medium">
            タグ
          </label>
          <TagInput
            id={ids.tags}
            tags={values.tags}
            pending={values.pendingTag}
            existingTags={existingTags}
            onTagsChange={(tags) => set("tags", tags)}
            onPendingChange={(p) => set("pendingTag", p)}
          />
        </div>

        {submitError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {submitError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            キャンセル
          </button>
          <button type="submit" disabled={locked} className="btn-primary">
            保存
          </button>
        </div>
      </form>
    </Modal>
  );
}
