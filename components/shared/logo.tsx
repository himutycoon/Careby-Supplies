import Link from "next/link";
import { Hammer } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "inverted";
}) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 font-heading text-lg font-bold tracking-tight",
        variant === "inverted" && "text-white",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-md",
          variant === "inverted"
            ? "bg-white text-primary"
            : "bg-primary text-primary-foreground",
        )}
      >
        <Hammer className="size-4" aria-hidden="true" />
      </span>
      CareBy
    </Link>
  );
}
