import { PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "We supply the material, you supply the trades."
 *
 * This exists because the flows read as hiring a contractor. Someone
 * picking "Renovation", answering six screens about their bathroom and
 * uploading photos has every reason to think a person is coming to do
 * the work — nothing in the flow said otherwise until the result screen,
 * by which point they had already invested the effort.
 *
 * So it sits at the top of every intake flow and stays there for the
 * whole of it, rather than being a disclaimer at the end.
 */
export function SuppliesOnlyNotice({
  className,
  /** `bare` drops the card chrome for use inside an existing panel. */
  variant = "card",
  children,
}: {
  className?: string;
  variant?: "card" | "bare";
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3",
        variant === "card" &&
          "rounded-xl border border-primary/25 bg-primary/5 px-4 py-3",
        className,
      )}
    >
      <PackageCheck
        className="mt-0.5 size-4 shrink-0 text-primary"
        aria-hidden="true"
      />
      <p className="text-sm leading-relaxed text-muted-foreground">
        {children ?? (
          <>
            <span className="font-medium text-foreground">
              You&apos;re building a material list, not booking a crew.
            </span>{" "}
            CareBy Supplies works out what your project needs and delivers
            it. Installation is done by your own contractor or trades — we
            don&apos;t provide them.
          </>
        )}
      </p>
    </div>
  );
}
