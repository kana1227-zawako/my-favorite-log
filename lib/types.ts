export const STORAGE_KEY = "my-favorite-log-records";

export const CATEGORIES = ["映画", "読書", "お出かけ"] as const;
export type Category = (typeof CATEGORIES)[number];

export const ALL_CATEGORIES = "すべて" as const;
export type CategoryFilter = typeof ALL_CATEGORIES | Category;

/** アプリが管理する項目 */
export interface LogRecord {
  id: string;
  category: Category;
  title: string;
  createdAt: string;
  experienceDate?: string;
  comment?: string;
  rating?: number;
  tags?: string[];
}

/** 保存データの記録（定義外の余分な項目を含みうる） */
export type StoredRecord = LogRecord & Record<string, unknown>;

export function isCategory(value: unknown): value is Category {
  return (
    typeof value === "string" &&
    (CATEGORIES as readonly string[]).includes(value)
  );
}
