import { Check } from "lucide-react";
import { EditorialImage } from "@/components/shared/editorial-image";
import { siteImage, type SiteImageSlot } from "@/data/site-images";
import { cn } from "@/lib/utils";

/**
 * The masthead every in-app flow opens with.
 *
 * One component rather than a hand-rolled heading per page: /new,
 * /repair and /new-construction had three different header shapes, so
 * moving between them felt like moving between three products.
 *
 * `title` is split in two so the second half can carry the accent — the
 * colour break is what stops a long flow title reading as a wall.
 */
const PROMISES = [
  { title: "Quality products", body: "Top brands, trusted supply" },
  { title: "Competitive pricing", body: "Trade rates, no membership" },
  { title: "Fast, reliable delivery", body: "On time, to your site" },
];

export function FlowPageHeader({
  eyebrow,
  title,
  accent,
  description,
  imageSlot,
  className,
}: {
  eyebrow: string;
  title: string;
  /** Second half of the title, printed in the accent colour. */
  accent?: string;
  description: string;
  imageSlot?: SiteImageSlot;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-5", className)}>
      <div
        className={cn(
          "grid gap-6",
          imageSlot && "lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-10",
        )}
      >
        <div className="flex min-w-0 flex-col gap-3">
          <span className="flex items-center gap-2.5 text-xs font-semibold tracking-[0.14em] text-brand uppercase">
            <span className="h-px w-6 shrink-0 bg-brand" aria-hidden="true" />
            {eyebrow}
          </span>

          <h1 className="text-balance">
            {title}
            {accent ? (
              <>
                {" "}
                <span className="text-brand">{accent}</span>
              </>
            ) : null}
          </h1>

          <p className="max-w-xl text-pretty text-muted-foreground">
            {description}
          </p>
        </div>

        {imageSlot ? (
          <EditorialImage
            tone="sand"
            src={siteImage(imageSlot)}
            alt=""
            className="hidden aspect-[16/10] w-full lg:block"
          />
        ) : null}
      </div>

      {/* Three small boxes on a phone, a divided row on a wide screen.
          Either way they are the first thing under the title, because
          what the business promises should not need scrolling to. */}
      <ul className="grid grid-cols-3 gap-2 sm:gap-0 sm:divide-x sm:divide-border sm:rounded-xl sm:border sm:border-border sm:bg-card">
        {PROMISES.map(({ title: promise, body }) => (
          <li
            key={promise}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-3 text-center sm:flex-row sm:items-start sm:gap-2.5 sm:rounded-none sm:border-0 sm:px-4 sm:text-left"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <Check className="size-3.5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs leading-tight font-medium sm:text-sm">
                {promise}
              </span>
              <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                {body}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </header>
  );
}
