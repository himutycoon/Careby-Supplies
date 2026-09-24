import type { Metadata } from "next";
import { Reveal } from "@/components/shared/reveal";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { GuidedFlowRouter } from "@/components/shared/guided-flow-router";
import { ServicesSection } from "@/components/home/services-section";
import { ProjectCategories } from "@/components/home/project-categories";
import { PremiumSection } from "@/components/home/premium-section";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaBand } from "@/components/home/cta-band";

export const metadata: Metadata = {
  title: "Services — CareBy Supplies",
  description:
    "Materials, takeoffs, estimates and delivery — for contractors and homeowners alike.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="CareBy Services"
        title="Everything but the labour."
        subtitle="Materials, takeoffs, estimates and delivery — for contractors and homeowners alike."
        imageSlot="servicesHero"
        actions={
          <>
            <Button
              size="lg"
              className="press w-full sm:w-auto"
              render={<Link href="#start">Find your path</Link>}
            />
            <Button
              size="lg"
              variant="outline"
              className="press w-full border-white/25 bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground sm:w-auto"
              render={
                <Link href="/contact?about=quote">
                  Talk to us <ArrowRight className="size-4" />
                </Link>
              }
            />
          </>
        }
      />

      {/*
        The router sits directly under the hero with no second heading:
        the previous "What do you need today?" block repeated what the
        hero already said and left a large empty band between the two.
      */}
      <Section width="wide" className="scroll-mt-24" id="start">
        <GuidedFlowRouter />
      </Section>

      <Reveal>
        <ServicesSection />
      </Reveal>
      <Reveal>
        <ProjectCategories />
      </Reveal>
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <PremiumSection />
      </Reveal>
      <Reveal>
        <CtaBand />
      </Reveal>
    </>
  );
}
