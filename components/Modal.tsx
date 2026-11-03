"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  title: string;
  /** キャンセル処理。Esc キーでも呼ばれる。背景クリックでは呼ばれない */
  onCancel: () => void;
  children: ReactNode;
  size?: "md" | "sm";
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function Modal({ title, onCancel, children, size = "md" }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      // IME の変換中の Esc は変換の取り消しなので無視する
      if (e.key === "Escape" && !e.isComposing) {
        e.preventDefault();
        onCancelRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  return (
    // 背景（オーバーレイ）には閉じる処理を付けない
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 px-4 py-10 backdrop-blur-[2px]"
      data-testid="modal-overlay"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full ${size === "sm" ? "max-w-sm" : "max-w-lg"} rounded-2xl border border-sand-200 bg-white p-6 shadow-xl shadow-sand-700/10`}
      >
        <h2 id={titleId} className="mb-5 text-lg font-semibold tracking-wide text-ink">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
