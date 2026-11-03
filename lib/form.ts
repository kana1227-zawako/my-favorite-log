import { isValidDateString } from "./date";
import { addTag } from "./tags";
import type { Category, LogRecord } from "./types";

export interface RecordFormValues {
  category: Category | "";
  title: string;
  experienceDate: string;
  comment: string;
  rating: number | null;
  tags: string[];
  /** タグ入力欄に入力中で、まだチップにしていない文字 */
  pendingTag: string;
}

export type FormErrors = Partial<
  Record<"category" | "title" | "experienceDate", string>
>;

/** アプリが管理する項目のうち、フォームで入力するもの */
export type ManagedFields = Omit<LogRecord, "id" | "createdAt">;

export const EMPTY_FORM: RecordFormValues = {
  category: "",
  title: "",
  experienceDate: "",
  comment: "",
  rating: null,
  tags: [],
  pendingTag: "",
};

export function formFromRecord(record: LogRecord): RecordFormValues {
  return {
    category: record.category,
    title: record.title,
    experienceDate: record.experienceDate ?? "",
    comment: record.comment ?? "",
    rating: record.rating ?? null,
    tags: [...(record.tags ?? [])],
    pendingTag: "",
  };
}

export function validateForm(values: RecordFormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.category === "") errors.category = "カテゴリを選択してください";
  if (values.title.trim() === "") errors.title = "タイトルを入力してください";
  if (values.experienceDate !== "" && !isValidDateString(values.experienceDate)) {
    errors.experienceDate = "正しい日付を入力してください";
  }
  return errors;
}

/**
 * フォーム値を保存用の管理項目に変換する（validateForm を通過した値を前提とする）。
 * 空の任意項目はキー自体を作らない。
 */
export function toManagedFields(values: RecordFormValues): ManagedFields {
  if (values.category === "") throw new Error("category is required");

  const fields: ManagedFields = {
    category: values.category,
    title: values.title.trim(),
  };
  if (values.experienceDate !== "") fields.experienceDate = values.experienceDate;
  const comment = values.comment.trim();
  if (comment !== "") fields.comment = comment;
  if (values.rating !== null) fields.rating = values.rating;
  const tags = addTag(values.tags, values.pendingTag);
  if (tags.length > 0) fields.tags = [...tags];
  return fields;
}
