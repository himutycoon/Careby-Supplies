import { Image as ImageIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const BEFORE_PALETTE = [
  "bg-slate-200 dark:bg-slate-800",
  "bg-stone-200 dark:bg-stone-800",
  "bg-zinc-200 dark:bg-zinc-800",
  "bg-neutral-200 dark:bg-neutral-800",
];

function paletteIndex(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % BEFORE_PALETTE.length;
  }
  return hash;
}

export function PhotoPlaceholder({
  label,
  tone = "before",
  className,
}: {
  label: string;
  tone?: "before" | "after";
  className?: string;
}) {
  const isAfter = tone === "after";
  const bgClass = isAfter
    ? "bg-primary/10 dark:bg-primary/15"
    : BEFORE_PALETTE[paletteIndex(label)];

  return (
    <div
      className={cn(
        "flex aspect-4/3 w-full flex-col items-center justify-center gap-2 rounded-md border",
        isAfter ? "border-primary/30 border-dashed" : "border-border",
        bgClass,
        className,
      )}
    >
      {isAfter ? (
        <Sparkles
          className="size-6 text-primary/70"
          aria-hidden="true"
          strokeWidth={1.5}
        />
      ) : (
        <ImageIcon
          className="size-6 text-muted-foreground/70"
          aria-hidden="true"
          strokeWidth={1.5}
        />
      )}
      <span
        className={cn(
          "px-2 text-center text-xs font-medium",
          isAfter ? "text-primary/80" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}
