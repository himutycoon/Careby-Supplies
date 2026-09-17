import {
  CircleCheck,
  CircleX,
  Clock,
  PackageCheck,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const CONFIG: Record<
  OrderStatus,
  { label: string; className: string; Icon: typeof Clock }
> = {
  processing: {
    label: "Processing",
    className: "bg-warning/15 text-warning-foreground border-warning/30",
    Icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-primary/10 text-primary border-primary/30",
    Icon: PackageCheck,
  },
  shipped: {
    label: "Shipped",
    className: "bg-primary/10 text-primary border-primary/30",
    Icon: Truck,
  },
  delivered: {
    label: "Delivered",
    className: "bg-success/15 text-success border-success/30",
    Icon: CircleCheck,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
    Icon: CircleX,
  },
};

/** Icon + label, never colour alone. */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className, Icon } = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
