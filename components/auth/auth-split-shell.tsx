import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const PANEL_FEATURES = [
  "Instant AI photo analysis",
  "Itemised cost breakdown",
  "Permit & code checks",
  "Hand-designed plan in 48 hours",
];

export function AuthSplitShell({
  heading,
  subheading,
  children,
  footer,
}: {
  heading: string;
  subheading: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-linear-to-br from-ink via-ink to-ink-light p-10 text-white lg:flex">
        <Logo variant="inverted" />

        <div className="flex flex-col gap-6">
          <h1 className="text-4xl leading-tight text-white">
            Your renovation,
            <br />
            planned by AI.
          </h1>
          <p className="max-w-sm text-white/80">
            Upload your photos and budget — we&apos;ll hand you a complete,
            hand-designed renovation plan within 48 hours.
          </p>
          <ul className="flex flex-col gap-3">
            {PANEL_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 text-sm font-medium"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-hi-vis text-hi-vis-foreground">
                  <Check className="size-3.5" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/60">
          Indicative planning guidance only — not a permit or contract.
        </p>
      </div>

      <div className="flex flex-col px-4 py-6 sm:px-6 lg:px-16 lg:py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="mt-8 lg:hidden">
          <Logo />
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          <div className="mx-auto w-full max-w-sm">
            <h2 className="text-2xl font-bold">{heading}</h2>
            <p className="mt-1 text-muted-foreground">{subheading}</p>
            <div className="mt-6">{children}</div>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
