import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  ClipboardList,
  Crown,
  Headset,
  Lightbulb,
  MessageCircle,
  PencilRuler,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_URL } from "@/data/mock";

const QUICK_ACTIONS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Get a new estimate", href: "/new", icon: PencilRuler },
  // The requests list is on this page; the anchor jumps to it.
  { label: "Track your requests", href: "#requests", icon: ClipboardList },
  { label: "Browse products", href: "/products", icon: ShoppingCart },
  { label: "View premium benefits", href: "/premium", icon: Crown },
];

/**
 * Right-hand column: a way to reach a person, shortcuts, and one tip.
 *
 * Support offers WhatsApp alongside the form because that is the line
 * the team actually answers; the form still exists for anything that
 * needs a written reference number.
 */
export function HelpRail() {
  return (
    <aside className="flex flex-col gap-4" aria-label="Help and shortcuts">
      <section className="rounded-2xl border border-success/25 bg-success/8 p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
            <Headset className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-sans text-base font-semibold tracking-normal">
              Need help with something?
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Our team is here to assist you.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            className="press w-full"
            render={
              <Link href="/contact?about=support">
                Contact Support <ArrowRight className="size-4" />
              </Link>
            }
          />
          <Button
            variant="outline"
            className="press w-full"
            render={
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" /> Chat on WhatsApp
              </a>
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-3">
        <h2 className="px-2 pt-1 pb-2 font-sans text-base font-semibold tracking-normal">
          Quick actions
        </h2>
        <ul className="flex flex-col">
          {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/80 group-hover:bg-background">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="flex-1 font-medium">{label}</span>
                <ChevronRight
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-primary/20 bg-accent p-5">
        <div className="flex items-start gap-3">
          <Lightbulb
            className="mt-0.5 size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="font-sans text-sm font-semibold tracking-normal text-primary">
              Pro tip
            </h2>
            <p className="mt-1 text-sm text-foreground/80">
              Planning a big project? Get a detailed estimate first so you
              can compare options before you buy materials.
            </p>
            <Button
              size="sm"
              className="press mt-3"
              render={
                <Link href="/new">
                  Create estimate <ArrowRight className="size-3.5" />
                </Link>
              }
            />
          </div>
        </div>
      </section>
    </aside>
  );
}
