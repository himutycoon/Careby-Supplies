import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Section, SectionHeading } from "@/components/shared/section";
import { EditorialImage } from "@/components/shared/editorial-image";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/home/cta-band";
import { formatCad } from "@/lib/format";
import type { ImageTone } from "@/components/shared/editorial-image";

interface ShowcaseProject {
  title: string;
  category: string;
  location: string;
  scope: string;
  budget: number;
  tone: ImageTone;
}

/**
 * Illustrative project types with representative budgets — not past
 * client work. Replace with real completed projects (and real photos)
 * once the client supplies them.
 */
const SHOWCASE: ShowcaseProject[] = [
  {
    title: "Full bathroom renovation",
    category: "Renovation",
    location: "Mississauga, ON",
    scope: "Strip to studs, relocate fixtures, new tile and vanity",
    budget: 18000,
    tone: "sand",
  },
  {
    title: "Kitchen refresh",
    category: "Renovation",
    location: "Mississauga, ON",
    scope: "Cabinet refacing, countertops, backsplash and lighting",
    budget: 32000,
    tone: "slate",
  },
  {
    title: "Basement finishing",
    category: "Renovation",
    location: "Mississauga, ON",
    scope: "Framing, insulation, drywall, flooring and egress",
    budget: 45000,
    tone: "forest",
  },
  {
    title: "Rear deck build",
    category: "New Construction",
    location: "Mississauga, ON",
    scope: "Pressure-treated frame, composite decking, railings",
    budget: 14500,
    tone: "sand",
  },
  {
    title: "Roof replacement",
    category: "Repair",
    location: "Mississauga, ON",
    scope: "Tear-off, deck repair, architectural shingles",
    budget: 12800,
    tone: "slate",
  },
  {
    title: "Single family home",
    category: "New Construction",
    location: "Mississauga, ON",
    scope: "2,400 sq ft, 4 bed / 3 bath, attached garage",
    budget: 615000,
    tone: "navy",
  },
];

export const metadata: Metadata = { title: "Projects — CareBy Canada" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="The kinds of projects we support"
        subtitle="From a leaking roof to a new build — here's the range of work the platform is set up for."
      />

      <Section>
        <SectionHeading
          eyebrow="Project types"
          title="Representative scopes and budgets"
          subtitle="Indicative figures for planning only — your estimate depends on your space, scope and finishes."
          align="left"
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SHOWCASE.map((project) => (
            <article
              key={project.title}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="overflow-hidden">
                <EditorialImage
                  tone={project.tone}
                  label={project.category}
                  alt={project.title}
                  className="aspect-16/10 w-full rounded-none transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h3 className="text-xl">{project.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {project.location}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {project.scope}
                </p>
                <p className="mt-auto pt-3 text-sm">
                  <span className="text-muted-foreground">Typical budget </span>
                  <span className="font-semibold">
                    {formatCad(project.budget)}
                  </span>
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            size="lg"
            render={
              <Link href="/get-started">
                Plan your project <ArrowRight className="size-4" />
              </Link>
            }
          />
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
