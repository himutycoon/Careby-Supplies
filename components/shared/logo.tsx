import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The CareBy Supplies logo.
 *
 * Two files rather than one: the wordmark is navy, which disappears on
 * the ink surfaces and in dark mode, so a white-wordmark copy ships
 * alongside it. Which one shows is decided in CSS — `dark:` swaps them
 * on theme, and `variant="inverted"` forces the light one for a panel
 * that is dark in both themes, like the auth split shell.
 *
 * Both images are always in the markup and one is hidden, so the swap
 * costs no JavaScript and cannot flash the wrong logo on first paint.
 * They are ~20KB each and cached after the first view.
 *
 * `mark` drops the wordmark for places too narrow for the lockup.
 */
const ASSETS = {
  lockup: { dark: "/images/logo-lockup.png", light: "/images/logo-lockup-light.png", w: 287, h: 96 },
  mark: { dark: "/images/logo-mark.png", light: "/images/logo-mark-light.png", w: 112, h: 128 },
};

export function Logo({
  className,
  variant = "default",
  mark = false,
  /** Height class. Width follows the aspect ratio. */
  size = "h-8",
}: {
  className?: string;
  variant?: "default" | "inverted";
  mark?: boolean;
  size?: string;
}) {
  const asset = mark ? ASSETS.mark : ASSETS.lockup;
  const inverted = variant === "inverted";

  return (
    <Link
      href="/"
      aria-label="CareBy Supplies — home"
      className={cn(
        "inline-flex shrink-0 items-center focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={inverted ? asset.light : asset.dark}
        alt="CareBy Supplies"
        width={asset.w}
        height={asset.h}
        className={cn(size, "w-auto", !inverted && "dark:hidden")}
      />
      {!inverted ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.light}
          alt=""
          aria-hidden="true"
          width={asset.w}
          height={asset.h}
          className={cn(size, "hidden w-auto dark:block")}
        />
      ) : null}
    </Link>
  );
}
