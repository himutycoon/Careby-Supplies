import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: string;
  hint?: string;
  tone?: "default" | "attention";
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            tone === "attention"
              ? "bg-warning/15 text-warning-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon name={icon} className="size-4.5" />
        </span>
      </div>
      <p className="font-heading text-3xl font-medium tabular-nums">{value}</p>
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
