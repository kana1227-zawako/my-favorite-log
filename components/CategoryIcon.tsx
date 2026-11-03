import { BookOpen, Film, MapPin, type LucideProps } from "lucide-react";
import type { Category } from "@/lib/types";

const ICONS = {
  映画: Film,
  読書: BookOpen,
  お出かけ: MapPin,
} as const satisfies Record<Category, unknown>;

export function CategoryIcon({
  category,
  ...props
}: { category: Category } & LucideProps) {
  const Icon = ICONS[category];
  return <Icon aria-hidden="true" {...props} />;
}
