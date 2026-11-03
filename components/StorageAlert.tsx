import { RefreshCw, TriangleAlert } from "lucide-react";

interface StorageAlertProps {
  kind: "corrupt" | "readError";
  onReload: () => void;
}

const MESSAGES = {
  corrupt: {
    title: "保存データが破損しているため読み込めませんでした",
    body: "データを保護するため、登録・編集・削除を停止しています。保存データは変更していません。データを修正してから「再読み込み」を押してください。",
  },
  readError: {
    title: "データを読み込めませんでした",
    body: "ブラウザの設定で LocalStorage が使えない可能性があります。登録・編集・削除を停止しています。保存データは変更していません。",
  },
} as const;

export function StorageAlert({ kind, onReload }: StorageAlertProps) {
  const { title, body } = MESSAGES[kind];
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 sm:flex-row sm:items-start"
    >
      <TriangleAlert aria-hidden="true" className="size-5 shrink-0 text-amber-600" />
      <div className="flex-1 space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm">{body}</p>
      </div>
      <button type="button" onClick={onReload} className="btn-secondary shrink-0">
        <RefreshCw aria-hidden="true" className="size-4" />
        再読み込み
      </button>
    </div>
  );
}
