import { CircleCheck, Hammer, PackageCheck, PencilRuler } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/types";

const CONFIG: Record<
  ProjectStatus,
  { label: string; className: string; Icon: typeof Hammer }
> = {
  planning: {
    label: "Planning",
    className: "bg-muted text-muted-foreground border-border",
    Icon: PencilRuler,
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-primary/10 text-primary border-primary/30",
    Icon: Hammer,
  },
  "materials-ready": {
    label: "Materials Ready",
    className: "bg-warning/15 text-warning-foreground border-warning/30",
    Icon: PackageCheck,
  },
  completed: {
    label: "Completed",
    className: "bg-success/15 text-success border-success/30",
    Icon: CircleCheck,
  },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
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
