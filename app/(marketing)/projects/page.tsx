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
  /** Materials only, delivered, HST excluded. Labour is not ours to price. */
  materialsCad: number;
  tone: ImageTone;
}

/**
 * Illustrative project types with representative MATERIAL budgets — not
 * past client work, and not what the whole job costs: labour, equipment
 * and permits are the customer's contractor to price, not ours. Replace
 * with real supplied projects (and real photos) once the client has them.
 */
const SHOWCASE: ShowcaseProject[] = [
  {
    title: "Full bathroom renovation",
    category: "Renovation",
    location: "Mississauga, ON",
    scope: "Board, membrane, tile, vanity, fixtures and trim",
    materialsCad: 6500,
    tone: "sand",
  },
  {
    title: "Kitchen refresh",
    category: "Renovation",
    location: "Mississauga, ON",
    scope: "Cabinets, countertops, backsplash tile and light fixtures",
    materialsCad: 12000,
    tone: "slate",
  },
  {
    title: "Basement finishing",
    category: "Renovation",
    location: "Mississauga, ON",
    scope: "Framing lumber, insulation, board, flooring and doors",
    materialsCad: 16000,
    tone: "forest",
  },
  {
    title: "Rear deck build",
    category: "New Construction",
    location: "Mississauga, ON",
    scope: "Pressure-treated frame, composite boards, railing and hardware",
    materialsCad: 7200,
    tone: "sand",
  },
  {
    title: "Roof replacement",
    category: "Repair",
    location: "Mississauga, ON",
    scope: "Shingles, underlay, sheathing, flashing and vents",
    materialsCad: 5400,
    tone: "slate",
  },
  {
    title: "Single family home",
    category: "New Construction",
    location: "Mississauga, ON",
    scope: "2,400 sq ft, 4 bed / 3 bath — framing through to finishes",
    materialsCad: 265000,
    tone: "navy",
  },
];

export const metadata: Metadata = { title: "Projects — CareBy Supplies" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="The kinds of projects we supply"
        subtitle="From a leaking roof to a new build — here's the range of jobs we stock the material for. The work itself stays with you and your trades."
      />

      <Section>
        <SectionHeading
          eyebrow="Project types"
          title="Representative scopes and material budgets"
          subtitle="Materials only, delivered — labour is not included. Indicative figures for planning; your own list depends on your space, scope and finishes."
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
                  <span className="text-muted-foreground">
                    Typical materials{" "}
                  </span>
                  <span className="font-semibold">
                    {formatCad(project.materialsCad)}
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
                Price your materials <ArrowRight className="size-4" />
              </Link>
            }
          />
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
