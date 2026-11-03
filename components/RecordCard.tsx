import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { LogRecord } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";
import { StarRatingDisplay } from "./StarRating";

interface RecordCardProps {
  record: LogRecord;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function RecordCard({ record, disabled, onEdit, onDelete }: RecordCardProps) {
  // 表示にはアプリが管理する項目だけを使う（createdAt は表示しない）
  const { category, title, experienceDate, rating, comment, tags } = record;

  return (
    <article
      aria-label={title}
      className="flex flex-1 flex-col rounded-2xl border border-sand-200 bg-white p-5 shadow-sm shadow-sand-200/40 transition hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sand-100 text-sand-700"
          title={category}
        >
          <CategoryIcon category={category} className="size-4.5" />
          <span className="sr-only">{category}</span>
        </span>
        <h3 className="min-w-0 flex-1 pt-1.5 font-semibold leading-snug break-words text-ink">
          {title}
        </h3>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        {(experienceDate !== undefined || rating !== undefined) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {experienceDate !== undefined && (
              <span className="flex items-center gap-1 text-ink-soft">
                <CalendarDays aria-hidden="true" className="size-3.5" />
                {formatDate(experienceDate)}
              </span>
            )}
            {rating !== undefined && <StarRatingDisplay value={rating} />}
          </div>
        )}
        {comment !== undefined && (
          <p className="whitespace-pre-wrap break-words text-ink">{comment}</p>
        )}
        {tags !== undefined && tags.length > 0 && (
          <ul aria-label="タグ" className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag} className="rounded-full bg-sand-50 px-2.5 py-0.5 text-xs text-sand-700">
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto flex justify-end gap-1 pt-4">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs text-ink-soft transition hover:bg-sand-50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pencil aria-hidden="true" className="size-3.5" />
          編集
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs text-ink-soft transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
          削除
        </button>
      </div>
    </article>
  );
}
