import type { StoredRecord } from "@/lib/types";
import { RecordCard } from "./RecordCard";

interface RecordListProps {
  totalCount: number;
  records: readonly StoredRecord[];
  disabled: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RecordList({ totalCount, records, disabled, onEdit, onDelete }: RecordListProps) {
  if (totalCount === 0) {
    return <EmptyMessage>まだ記録がありません</EmptyMessage>;
  }
  if (records.length === 0) {
    return <EmptyMessage>条件に一致する記録がありません</EmptyMessage>;
  }
  return (
    <ul aria-label="記録一覧" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {records.map((r) => (
        <li key={r.id} className="flex">
          <RecordCard
            record={r}
            disabled={disabled}
            onEdit={() => onEdit(r.id)}
            onDelete={() => onDelete(r.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function EmptyMessage({ children }: { children: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-sand-200 py-16 text-center text-sm text-ink-soft">
      {children}
    </p>
  );
}
