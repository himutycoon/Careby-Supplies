import type { Metadata } from "next";
import { Bot, Calculator, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { CtaBand } from "@/components/home/cta-band";

export const metadata: Metadata = { title: "About — CareBy Canada" };

const APPROACH = [
  {
    icon: Bot,
    title: "AI reads your photos",
    description:
      "Computer vision identifies your fixtures, finishes, and visible issues — structured data, not guesswork.",
  },
  {
    icon: Calculator,
    title: "Rules decide the numbers",
    description:
      "Every cost, area, and verdict comes from a deterministic pricing engine, not from the AI improvising.",
  },
  {
    icon: UserCheck,
    title: "A person designs your plan",
    description:
      "A CareBy designer reviews every submission by hand and builds your renovation plan and concept image.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="Renovation planning shouldn't take weeks to get started"
        subtitle="CareBy Canada gives homeowners a fast, honest starting point — then a real person takes it from there."
      />

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <p className="text-muted-foreground">
          Most homeowners planning a renovation spend weeks going back and
          forth with contractors just to get a rough number. We built
          CareBy to shortcut that first step: upload a few photos and
          your budget, and get an instant, structured estimate in seconds.
        </p>
        <p className="mt-4 text-muted-foreground">
          That instant estimate is deliberately just a starting point.
          Within 48 hours, a CareBy designer reviews your submission by
          hand and builds your actual renovation plan — layout, materials,
          and a concept image — so what you receive is something you could
          hand to a contractor, not just a number.
        </p>
        <p className="mt-4 text-muted-foreground">
          We&apos;re currently focused on renovations in Mississauga, Ontario,
          with more municipalities on the way.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="mb-8 text-center">How we keep it honest</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {APPROACH.map((item) => (
            <Card key={item.title} className="gap-3 p-5">
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </span>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
