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
            This is indicative planning guidance only — not a permit
            submission or a construction contract. Final scope, cost, and
            code requirements are confirmed by a licensed contractor and
            your local building authority.
          </>
        )}
      </p>
    </div>
  );
}
