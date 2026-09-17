import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon = "Boxes",
  title,
  description,
  action,
  className,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-xl bg-background text-muted-foreground">
        <Icon name={icon} className="size-6" />
      </span>
      <h3 className="text-lg">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
