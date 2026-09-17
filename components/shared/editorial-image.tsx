import { cn } from "@/lib/utils";

export type ImageTone = "sand" | "slate" | "forest" | "navy";

/**
 * Editorial imagery slot.
 *
 * Real photography isn't wired yet, so this renders a considered
 * architectural placeholder (layered gradient + blueprint line motif)
 * instead of a grey box. Pass `src` once real assets exist and every
 * layout using this keeps working unchanged.
 */
const TONES: Record<ImageTone, string> = {
  sand: "from-[#C9B08A] via-[#B08F63] to-[#6F5334]",
  slate: "from-[#94A3B8] via-[#64748B] to-[#334155]",
  forest: "from-[#4E8C6A] via-[#2F6B4C] to-[#14532D]",
  navy: "from-[#334155] via-[#1E293B] to-[#0F172A]",
};

export function EditorialImage({
  tone = "slate",
  label,
  src,
  alt,
  className,
  children,
}: {
  tone?: ImageTone;
  label?: string;
  src?: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-linear-to-br",
        TONES[tone],
        className,
      )}
      role={src ? undefined : "img"}
      aria-label={src ? undefined : (alt ?? label ?? "Project imagery")}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? label ?? ""}
          className="size-full object-cover"
        />
      ) : (
        <>
          {/* Blueprint line motif — subtle, keeps placeholders feeling intentional. */}
          <svg
            className="absolute inset-0 size-full opacity-[0.14]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id={`grid-${tone}`}
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M32 0H0V32"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${tone})`} />
          </svg>
          <div className="absolute inset-0 bg-linear-to-t from-black/35 to-transparent" />
        </>
      )}

      {label ? (
        <span className="absolute bottom-3 left-3 rounded-md bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {label}
        </span>
      ) : null}

      {children}
    </div>
  );
}
