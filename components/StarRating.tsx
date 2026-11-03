"use client";

import { Star } from "lucide-react";

const STARS = [1, 2, 3, 4, 5] as const;

interface StarRatingInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  labelledBy?: string;
}

/** 入力用。選択中の星をもう一度押すと評価を解除する */
export function StarRatingInput({
  value,
  onChange,
  disabled,
  labelledBy,
}: StarRatingInputProps) {
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex items-center gap-1">
      {STARS.map((n) => {
        const filled = value !== null && n <= value;
        return (
          <button
            key={n}
            type="button"
            aria-label={`星${n}`}
            aria-pressed={value === n}
            disabled={disabled}
            onClick={() => onChange(value === n ? null : n)}
            className="rounded-md p-1 transition hover:bg-sand-50 focus-visible:outline-2 focus-visible:outline-sand-500 disabled:opacity-50"
          >
            <Star
              aria-hidden="true"
              className={`size-6 ${filled ? "fill-star text-star" : "text-sand-300"}`}
            />
          </button>
        );
      })}
      <span className="ml-2 text-xs text-ink-soft">
        {value === null ? "未評価" : "もう一度押すと解除"}
      </span>
    </div>
  );
}

/** 表示用 */
export function StarRatingDisplay({ value }: { value: number }) {
  return (
    <div role="img" aria-label={`評価 ${value} / 5`} className="flex gap-0.5">
      {STARS.map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={`size-4 ${n <= value ? "fill-star text-star" : "text-sand-200"}`}
        />
      ))}
    </div>
  );
}
