import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function DisclaimerBox({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <Info className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
      <p>
        {children ?? (
          <>
            CareBy Supplies sells building materials — we don&apos;t install
            them or provide trades. Quantities here are indicative and come
            from the dimensions you gave us; confirm them on site before
            ordering, and leave permits, code and labour to your contractor.
          </>
        )}
      </p>
    </div>
  );
}
