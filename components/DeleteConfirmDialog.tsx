"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import type { OperationResult } from "@/hooks/useRecords";
import { Modal } from "./Modal";
import { operationErrorMessage } from "./messages";

interface DeleteConfirmDialogProps {
  title: string;
  locked: boolean;
  onConfirm: () => OperationResult;
  onClose: () => void;
}

export function DeleteConfirmDialog({
  title,
  locked,
  onConfirm,
  onClose,
}: DeleteConfirmDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    const message = operationErrorMessage(onConfirm(), "delete");
    if (message === null) onClose();
    else setError(message);
  };

  return (
    <Modal title="記録を削除しますか？" onCancel={onClose} size="sm">
      <p className="text-sm text-ink-soft">
        「<span className="font-medium text-ink">{title}</span>」を削除します。この操作は取り消せません。
      </p>
      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-secondary">
          キャンセル
        </button>
        <button type="button" onClick={handleConfirm} disabled={locked} className="btn-danger">
          削除する
        </button>
      </div>
    </Modal>
  );
}
