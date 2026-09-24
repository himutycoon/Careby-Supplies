import type { Metadata } from "next";
import { Bot, Calculator, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { CtaBand } from "@/components/home/cta-band";

export const metadata: Metadata = { title: "About — CareBy Supplies" };

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
      "Every quantity, price and verdict comes from a deterministic takeoff engine, not from the AI improvising.",
  },
  {
    icon: UserCheck,
    title: "A person checks your list",
    description:
      "A CareBy advisor checks every material list by hand against your photos before it reaches you.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="Working out what to buy shouldn't take three site visits"
        subtitle="CareBy Supplies sells building materials — and tells you straight what your job needs, in what quantity, at what price."
      />

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <p className="text-muted-foreground">
          We are a building-materials supplier. We do not install anything,
          we do not employ trades, and we do not run your project — your
          contractor does that. What we do is work out what the job needs,
          price it honestly, and get it to site on the day it is wanted.
        </p>
        <p className="mt-4 text-muted-foreground">
          Most people buying material for a renovation are guessing at
          quantities or waiting on someone else to guess for them. Upload a
          few photos and the room&apos;s dimensions and you get an itemised
          material list in seconds — every line something we stock, with the
          quantity the room implies and the price you would pay.
        </p>
        <p className="mt-4 text-muted-foreground">
          Within 48 hours a CareBy advisor checks that list by hand against
          your photos, so what you receive is an order you can place and a
          set of quantities your installer can price their labour against.
        </p>
        <p className="mt-4 text-muted-foreground">
          We deliver across Mississauga and the surrounding GTA, with more
          of the region on the way.
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
