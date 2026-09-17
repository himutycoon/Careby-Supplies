import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import type { StockStatus } from "@/lib/types";

const CONFIG: Record<
  StockStatus,
  { label: string; className: string; Icon: typeof CircleCheck }
> = {
  "in-stock": {
    label: "In Stock",
    className: "text-success",
    Icon: CircleCheck,
  },
  "low-stock": {
    label: "Low Stock",
    className: "text-warning",
    Icon: CircleAlert,
  },
  "out-of-stock": {
    label: "Out of Stock",
    className: "text-muted-foreground",
    Icon: CircleX,
  },
};

/** Status uses an icon as well as colour — never colour alone (a11y). */
export function StockBadge({ status }: { status: StockStatus }) {
  const { label, className, Icon } = CONFIG[status];
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${className}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
