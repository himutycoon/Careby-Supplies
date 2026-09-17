import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";

/**
 * Selectable option tile shared by every wizard (category pickers,
 * question choices, repair areas). One component so selection states
 * look identical across the product.
 */
export function OptionCard({
  label,
  description,
  icon,
  selected,
  onSelect,
  size = "default",
}: {
  label: string;
  description?: string;
  icon?: string;
  selected: boolean;
  onSelect: () => void;
  size?: "default" | "large";
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex rounded-xl border text-left transition-all focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        size === "large"
          ? "flex-col items-center gap-3 p-8 text-center"
          : icon
            ? "flex-col items-center gap-2.5 p-4 text-center"
            : "flex-col gap-1 px-4 py-3.5",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      {icon ? (
        <span
          className={cn(
            "flex items-center justify-center rounded-xl transition-colors",
            size === "large" ? "size-14" : "size-10",
            selected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon name={icon} className={size === "large" ? "size-7" : "size-5"} />
        </span>
      ) : null}

      <span
        className={cn(
          "font-medium",
          size === "large" ? "text-lg font-semibold" : "text-sm",
          selected && !icon && "text-primary",
        )}
      >
        {label}
      </span>

      {description ? (
        <span className="text-sm text-muted-foreground">{description}</span>
      ) : null}
    </button>
  );
}
