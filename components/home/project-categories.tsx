import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/shared/section";
import { EditorialImage } from "@/components/shared/editorial-image";
import { PROJECT_CATEGORIES } from "@/data/platform";
import { siteImage, type SiteImageSlot } from "@/data/site-images";

/** Maps a category id to its image slot in data/site-images.ts. */
const CATEGORY_IMAGE_SLOT: Record<string, SiteImageSlot> = {
  repair: "categoryRepair",
  renovation: "categoryRenovation",
  "new-construction": "categoryNewConstruction",
};

export function ProjectCategories() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Project types"
        title="Start with what you're building"
        subtitle="Each path adapts to your scope, budget and timeline."
        align="left"
      />

      <div className="mt-6 grid gap-3 sm:mt-10 sm:gap-5 md:grid-cols-3">
        {PROJECT_CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="group relative flex flex-row items-center overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:flex-col sm:items-stretch sm:hover:-translate-y-0.5 sm:hover:shadow-xl"
          >
            <div className="w-28 shrink-0 overflow-hidden sm:w-auto">
              {/* Per-category photo slots live in data/site-images.ts. */}
              <EditorialImage
                tone={category.tone}
                src={siteImage(CATEGORY_IMAGE_SLOT[category.id] ?? "categoryRepair")}
                alt={`${category.title} projects`}
                className="aspect-square w-full rounded-none transition-transform duration-500 group-hover:scale-105 sm:aspect-16/10"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 p-4 sm:gap-2 sm:p-6">
              <h3 className="flex items-center gap-2 text-lg sm:text-2xl">
                {category.title}
                <ArrowRight
                  className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {category.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
